/**
 * useVoiceInput — ElevenLabs Scribe v2 Realtime STT
 *
 * Correct implementation based on EL API spec:
 * - Endpoint: wss://api.elevenlabs.io/v1/speech-to-text/realtime
 * - Auth: single-use token (POST /v1/single-use-token/realtime_scribe)
 * - Audio: base64 PCM16 chunks sent as {"type":"input_audio_chunk","chunk":"<b64>"}
 * - Config: query params on the WebSocket URL
 */

import { useRef, useCallback, useState } from 'react'

const SCRIBE_SAMPLE_RATE = 16000
const EL_BASE = 'https://api.elevenlabs.io'
const EL_WS_BASE = 'wss://api.elevenlabs.io'

interface VoiceInputReturn {
  startListening: () => Promise<void>
  stopListening: () => void
  isListening: boolean
  error: string | null
}

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void
}

/** Convert PCM16 Int16Array to base64 string */
function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function useVoiceInput({ onTranscript }: UseVoiceInputOptions): VoiceInputReturn {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const sessionReadyRef = useRef(false)

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect()
    sourceRef.current?.disconnect()
    processorRef.current = null
    sourceRef.current = null
    sessionReadyRef.current = false

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsListening(false)
  }, [])

  const stopListening = useCallback(() => {
    cleanup()
  }, [cleanup])

  const startListening = useCallback(async () => {
    if (!apiKey) {
      setError('ElevenLabs API key not configured')
      return
    }
    if (isListening) return

    setError(null)

    try {
      // Step 1: Get a single-use token (browser can't set WS headers directly)
      const tokenRes = await fetch(`${EL_BASE}/v1/single-use-token/realtime_scribe`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
      })
      if (!tokenRes.ok) {
        throw new Error(`Token request failed: HTTP ${tokenRes.status}`)
      }
      const { token } = await tokenRes.json() as { token: string }

      // Step 2: Get mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: SCRIBE_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      // Step 3: Open Scribe v2 Realtime WebSocket
      const params = new URLSearchParams({
        model_id: 'scribe_v2_realtime',
        audio_format: 'pcm_16000',
        token,
        commit_strategy: 'vad',        // auto-commit on silence detection
        vad_silence_threshold_secs: '2.0',
        vad_threshold: '0.4',
      })
      const ws = new WebSocket(`${EL_WS_BASE}/v1/speech-to-text/realtime?${params}`)
      wsRef.current = ws

      ws.onmessage = (event: MessageEvent) => {
        if (typeof event.data !== 'string') return
        try {
          const msg = JSON.parse(event.data) as {
            message_type?: string
            type?: string
            text?: string
            is_final?: boolean
            transcript?: string
            words?: Array<{ text: string; type?: string; word?: string }>
          }

          // Log everything in dev so we can see the actual event types
          console.log('[VoiceInput] WS message:', msg)

          const msgType = msg.message_type ?? msg.type ?? ''

          if (msgType === 'session_started') {
            sessionReadyRef.current = true
            console.log('[VoiceInput] Session started — ready for audio')
            return
          }

          // Extract text from any possible field
          const rawText = msg.text ?? msg.transcript ?? ''
          const isFinalMsg =
            msgType === 'committed_transcript' ||
            msgType === 'committed_transcript_with_timestamps' ||
            msg.is_final === true

          if (isFinalMsg && rawText.trim()) {
            console.log('[VoiceInput] Final transcript:', rawText)
            onTranscript(rawText.trim())
            // Do NOT stop listening here — let the session continue until
            // the user manually stops. VAD will keep committing new utterances
            // as long as the user is speaking.
          }
        } catch {
          // ignore non-JSON messages
        }
      }

      ws.onerror = () => {
        setError('Voice connection failed — check API key')
        cleanup()
      }

      ws.onclose = () => {
        setIsListening(false)
        sessionReadyRef.current = false
      }

      // Step 4: Set up audio capture + streaming
      const audioCtx = new AudioContext({ sampleRate: SCRIBE_SAMPLE_RATE })
      audioCtxRef.current = audioCtx
      console.log('[VoiceInput] AudioContext sample rate:', audioCtx.sampleRate, '(requested 16000)')

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      // ScriptProcessorNode: buffer 4096 samples, 1 in channel, 1 out channel
      // Deprecated but universally supported; AudioWorklet needs HTTPS + worker file
      const processor = audioCtx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      let chunkCount = 0

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const ws = wsRef.current
        if (!ws || ws.readyState !== WebSocket.OPEN) return
        // Don't send audio before session is confirmed
        if (!sessionReadyRef.current) return

        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]))
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        const audio_base_64 = int16ToBase64(int16)
        // Correct EL protocol: message_type + audio_base_64 (not type + chunk)
        ws.send(JSON.stringify({ message_type: 'input_audio_chunk', audio_base_64 }))
        chunkCount++
        if (chunkCount <= 3 || chunkCount % 50 === 0) {
          console.log(`[VoiceInput] Sent chunk #${chunkCount}, size: ${audio_base_64.length} chars`)
        }
      }

      source.connect(processor)
      // Connect to destination to keep audio graph alive (silent — no output)
      processor.connect(audioCtx.destination)

      setIsListening(true)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice input failed'
      setError(msg)
      console.error('[VoiceInput]', err)
      cleanup()
    }
  }, [apiKey, isListening, onTranscript, cleanup, stopListening])

  return { startListening, stopListening, isListening, error }
}
