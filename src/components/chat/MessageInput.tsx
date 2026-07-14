import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Square, Paperclip, X, Mic, MicOff, Volume2 } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => void
  onCancel: () => void
  streaming: boolean
  disabled?: boolean
  // Voice props (optional — only shown when EL key is configured)
  voiceAvailable?: boolean
  isListening?: boolean
  isPlaying?: boolean
  onVoiceStart?: () => void
  onVoiceStop?: () => void
  voiceError?: string | null
}

interface AttachedFile {
  name: string
  content: string
  type: 'text' | 'image'
  dataUrl?: string // for image previews
}

// ---------------------------------------------------------------------------
// Web Speech API — not fully typed in all TS lib.dom versions
// ---------------------------------------------------------------------------
interface SpeechRecognitionResult {
  readonly 0: { readonly transcript: string }
}
interface SpeechRecognitionResultList {
  readonly 0: SpeechRecognitionResult
}
interface ISpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition
}
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor
    webkitSpeechRecognition?: ISpeechRecognitionConstructor
  }
}

export function MessageInput({
  onSend, onCancel, streaming, disabled,
  voiceAvailable = false, isListening = false, isPlaying = false,
  onVoiceStart, onVoiceStop, voiceError,
}: MessageInputProps) {
  const [value, setValue] = useState('')
  const [attachment, setAttachment] = useState<AttachedFile | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    let content = value.trim()
    if (attachment) {
      const separator = content ? '\n\n' : ''
      if (attachment.type === 'image' && attachment.dataUrl) {
        // Embed image as a special marker UserMessage can detect and render
        content = `${content}${separator}__IMG__${attachment.name}||${attachment.dataUrl}`
      } else {
        content = `${content}${separator}**Attached: ${attachment.name}**\n\`\`\`\n${attachment.content}\n\`\`\``
      }
    }
    if (!content && !attachment) return
    if (streaming) return
    onSend(content)
    setValue('')
    setAttachment(null)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')

    const MAX_BYTES = isImage ? 4 * 1024 * 1024 : 512 * 1024 // 4MB for images, 512KB for text
    if (file.size > MAX_BYTES) {
      alert(`File too large (${(file.size / 1024).toFixed(0)} KB). Maximum is ${isImage ? '4 MB' : '512 KB'}.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()

    if (isImage) {
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setAttachment({ name: file.name, content: '', type: 'image', dataUrl })
      }
      reader.readAsDataURL(file)
    } else {
      const isText =
        file.type.startsWith('text/') ||
        /\.(txt|md|json|yaml|yml|csv|log|xml|html|js|ts|tsx|jsx|py|sh|bash|conf|cfg|ini|toml|env)$/i.test(file.name)

      reader.onload = (ev) => {
        const content = ev.target?.result as string
        setAttachment({ name: file.name, content, type: 'text' })
      }

      if (isText) {
        reader.readAsText(file)
      } else {
        reader.readAsDataURL(file)
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSend = (value.trim() || attachment) && !streaming && !disabled

  return (
    <div className="border-t border-aegis-border-panel p-2 flex-shrink-0">
      {/* Attachment pill */}
      {attachment && (
        <div className="flex items-center gap-2 mb-1.5 px-2 py-1 bg-aegis-bg-panel border border-aegis-border-panel text-xs font-mono">
          {attachment.type === 'image' && attachment.dataUrl ? (
            <img src={attachment.dataUrl} alt={attachment.name} className="h-8 w-8 object-cover border border-aegis-border-panel flex-shrink-0" />
          ) : (
            <Paperclip size={10} className="text-amber-400 flex-shrink-0" />
          )}
          <span className="text-aegis-text-secondary truncate flex-1">{attachment.name}</span>
          <button
            onClick={() => setAttachment(null)}
            className="text-aegis-text-muted hover:text-red-400 transition-colors"
            aria-label="Remove attachment"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Textarea */}
      <div className={`relative border ${isListening ? 'border-red-500/40' : streaming ? 'border-amber-500/30' : 'border-aegis-border-panel'} bg-aegis-bg-input`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming || disabled || isListening}
          placeholder={
            isListening
              ? '🎙️ Listening... (click mic to stop)'
              : streaming
              ? 'Agent responding...'
              : 'Ask Aegis... (Ctrl+Enter to send · / for commands)'
          }
          className="w-full bg-transparent px-3 py-2 text-xs font-mono text-aegis-text-primary placeholder-aegis-text-muted resize-none focus:outline-none min-h-[64px] max-h-[120px] overflow-y-auto disabled:opacity-50"
          rows={3}
          aria-label="Chat message input"
        />
        {streaming && !isListening && (
          <div className="absolute inset-0 bg-aegis-bg-input/30 pointer-events-none" />
        )}
        {isListening && (
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-xs font-mono text-aegis-text-muted">Ctrl+Enter to send</span>
        <div className="flex gap-1.5 items-center">

          {/* File attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming || disabled}
            title="Attach file"
            aria-label="Attach file"
            className="flex items-center px-2 py-1 text-xs font-mono text-aegis-text-muted border border-aegis-border-panel hover:text-amber-400 hover:border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Paperclip size={10} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
            accept=".txt,.md,.json,.yaml,.yml,.csv,.log,.xml,.html,.js,.ts,.tsx,.jsx,.py,.sh,.bash,.conf,.cfg,.ini,.toml,.env,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg"
          />

          {/* Voice input — ElevenLabs Scribe v2 Realtime STT */}
          {voiceAvailable && (
            <button
              onClick={isListening ? onVoiceStop : onVoiceStart}
              disabled={streaming || disabled}
              title={isListening ? 'Stop listening' : 'Voice input (ElevenLabs Scribe v2)'}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              className={`flex items-center px-2 py-1 text-xs font-mono border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                isListening
                  ? 'text-red-400 border-red-500/40 bg-red-500/10 animate-pulse'
                  : 'text-aegis-text-muted border-aegis-border-panel hover:text-amber-400 hover:border-amber-500/30'
              }`}
            >
              {isListening ? <MicOff size={10} /> : <Mic size={10} />}
            </button>
          )}

          {/* TTS playing indicator */}
          {isPlaying && (
            <span
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-amber-400 border border-amber-500/30 animate-pulse"
              title="Audio playing"
              aria-label="Audio playing"
            >
              <Volume2 size={10} />
            </span>
          )}

          {/* Voice error inline */}
          {voiceError && (
            <span className="text-xs font-mono text-red-400" title={voiceError}>
              ⚠️
            </span>
          )}

          {/* Cancel stream */}
          {streaming && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              aria-label="Cancel stream"
            >
              <Square size={10} fill="currentColor" />
              STOP
            </button>
          )}

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-black disabled:text-black/40 text-xs font-mono font-semibold transition-colors chat-input"
            aria-label="Send message"
          >
            <Send size={11} />
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
