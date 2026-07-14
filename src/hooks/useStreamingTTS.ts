/**
 * useStreamingTTS — ElevenLabs real-time streaming TTS via WebSocket
 *
 * Feeds text tokens to ElevenLabs streaming TTS as they arrive and plays
 * PCM 24kHz audio in the browser via Web Audio API. No files, no play buttons.
 * Audio starts before the full response is done generating.
 */

import { useRef, useCallback, useState, useEffect } from 'react'

// Voice ID: set VITE_ELEVENLABS_VOICE_ID in .env.local to override
// Options provided by Clint: Cz0K1kOv9tD8l0b5Qu53, 1SM7GgM6IMuvQlz2BwM3
// Fallback: JBFqnCBsd6RMkjVDRZzb (George)
const VOICE_ID = (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string | undefined) ?? 'JBFqnCBsd6RMkjVDRZzb'
const MODEL_ID = 'eleven_multilingual_v2'
const SAMPLE_RATE = 24000

interface StreamingTTSReturn {
  queueText: (text: string) => void
  flush: () => void
  stop: () => void
  isPlaying: boolean
}

export function useStreamingTTS(enabled: boolean): StreamingTTSReturn {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined
  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextPlayTimeRef = useRef<number>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playingCountRef = useRef(0)
  const pendingTextRef = useRef<string>('')
  const isOpenRef = useRef(false)
  const flushCalledRef = useRef(false)
  const textBufferRef = useRef<string>('')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close()
      audioCtxRef.current?.close()
    }
  }, [])

  const getAudioContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE })
      nextPlayTimeRef.current = 0
    }
    return audioCtxRef.current
  }, [])

  const playPCMChunk = useCallback((pcmData: ArrayBuffer) => {
    const ctx = getAudioContext()
    const int16 = new Int16Array(pcmData)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0
    }

    if (float32.length === 0) return

    const buffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE)
    buffer.copyToChannel(float32, 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const now = ctx.currentTime
    const startTime = Math.max(now, nextPlayTimeRef.current)
    nextPlayTimeRef.current = startTime + buffer.duration

    playingCountRef.current++
    setIsPlaying(true)

    source.onended = () => {
      playingCountRef.current = Math.max(0, playingCountRef.current - 1)
      if (playingCountRef.current === 0) {
        setIsPlaying(false)
      }
    }

    source.start(startTime)
  }, [getAudioContext])

  const openWebSocket = useCallback(() => {
    if (!apiKey || !enabled) return
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return

    const url = `wss://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream-input?model_id=${MODEL_ID}&output_format=pcm_24000&optimize_streaming_latency=0`
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws
    isOpenRef.current = false
    flushCalledRef.current = false

    ws.onopen = () => {
      isOpenRef.current = true
      // Send BOS (beginning of stream) message
      ws.send(JSON.stringify({
        text: ' ',
        voice_settings: { stability: 0.85, similarity_boost: 0.65, speed: 1.1 },
        xi_api_key: apiKey,
      }))

      // Flush any text that arrived before WS opened
      if (pendingTextRef.current) {
        ws.send(JSON.stringify({ text: pendingTextRef.current, try_trigger_generation: true }))
        pendingTextRef.current = ''
      }
    }

    ws.onmessage = (event: MessageEvent) => {
      // EL streaming TTS sends JSON: {"audio": "<base64 PCM>", "isFinal": bool}
      // Raw binary fallback also handled for PCM output formats
      if (event.data instanceof ArrayBuffer) {
        if (event.data.byteLength > 0) playPCMChunk(event.data)
        return
      }
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data) as {
            audio?: string
            isFinal?: boolean
            message?: string
            error?: string
          }
          if (msg.error) {
            console.error('[StreamingTTS] EL error:', msg.error)
            return
          }
          if (msg.audio) {
            // Decode base64 → ArrayBuffer → PCM
            const binary = atob(msg.audio)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            playPCMChunk(bytes.buffer)
          }
        } catch {
          // not JSON, ignore
        }
      }
    }

    ws.onerror = (err) => {
      console.error('[StreamingTTS] WebSocket error:', err)
      isOpenRef.current = false
    }

    ws.onclose = () => {
      isOpenRef.current = false
      wsRef.current = null
    }
  }, [apiKey, enabled, playPCMChunk])

  const sendBufferedText = useCallback((ws: WebSocket, textToSend: string) => {
    if (!textToSend) return
    ws.send(JSON.stringify({ text: textToSend, try_trigger_generation: true }))
  }, [])

  const queueText = useCallback((text: string) => {
    if (!apiKey || !enabled || !text) return

    // Ensure WS is open
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      openWebSocket()
    }

    const ws = wsRef.current
    if (!ws) return

    if (ws.readyState === WebSocket.OPEN && isOpenRef.current) {
      // Buffer text and send on phrase boundaries for smoother audio
      // Sending many tiny chunks causes skip artifacts
      textBufferRef.current += text
      const hasPhraseEnd = /[.!?,;:\n]/.test(textBufferRef.current)
      const isLongEnough = textBufferRef.current.length >= 50
      if (hasPhraseEnd || isLongEnough) {
        sendBufferedText(ws, textBufferRef.current)
        textBufferRef.current = ''
      }
    } else {
      // Buffer until open
      pendingTextRef.current += text
    }
  }, [apiKey, enabled, openWebSocket, sendBufferedText])

  const flush = useCallback(() => {
    if (!wsRef.current || !isOpenRef.current || flushCalledRef.current) return
    flushCalledRef.current = true
    // Drain any remaining buffered text first
    if (textBufferRef.current) {
      wsRef.current.send(JSON.stringify({ text: textBufferRef.current, try_trigger_generation: true }))
      textBufferRef.current = ''
    }
    // EOS message: empty text triggers final synthesis
    wsRef.current.send(JSON.stringify({ text: '' }))
  }, [])

  const stop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    isOpenRef.current = false
    flushCalledRef.current = false
    pendingTextRef.current = ''
    textBufferRef.current = ''
    playingCountRef.current = 0
    setIsPlaying(false)
    nextPlayTimeRef.current = 0
  }, [])

  return { queueText, flush, stop, isPlaying }
}
