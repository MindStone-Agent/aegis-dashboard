import { useState, useEffect } from 'react'
import { MessageSquare, ChevronRight, Trash2, History, Loader2 } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useStreamingChat } from '../../hooks/useStreamingChat'
import { useStreamingTTS } from '../../hooks/useStreamingTTS'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { MessageThread } from './MessageThread'
import { MessageInput } from './MessageInput'
import { DemoModeOverlay } from './DemoModeOverlay'

function formatSessionDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

interface ChatPaneProps {
  /**
   * Force chat pane into the open state (used for mobile drawers/bottom-sheets).
   * When set, the pane will not render its collapsed rail.
   */
  forceOpen?: boolean
  /** Called when the user requests the pane be closed (e.g. collapse button). */
  onRequestClose?: () => void
}

export function ChatPane({ forceOpen = false, onRequestClose }: ChatPaneProps) {
  const { chatOpen, setChatOpen } = useUIStore()
  const {
    messages, streaming, isDemoMode,
    sessions, sessionsLoading, activeSessionId,
    sendMessage, cancelStream, clearMessages, loadSession,
    setTokenCallback, setStreamEndCallback,
  } = useStreamingChat()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false)

  // Voice: TTS output + STT input
  const voiceAvailable = Boolean(import.meta.env.VITE_ELEVENLABS_API_KEY)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const tts = useStreamingTTS(voiceEnabled && voiceAvailable)

  const voiceInput = useVoiceInput({
    onTranscript: (text) => {
      if (text.trim()) {
        void sendMessage(text.trim())
      }
    },
  })

  // Wire TTS callbacks into the streaming chat hook
  useEffect(() => {
    if (voiceEnabled && voiceAvailable) {
      setTokenCallback((token) => tts.queueText(token))
      setStreamEndCallback(() => tts.flush())
    } else {
      setTokenCallback(null)
      setStreamEndCallback(null)
      tts.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled, voiceAvailable])

  const handleVoiceStart = async () => {
    if (!voiceEnabled) setVoiceEnabled(true)
    await voiceInput.startListening()
  }

  const handleVoiceStop = () => {
    voiceInput.stopListening()
  }

  const handleClear = () => {
    if (showClearConfirm) {
      clearMessages()
      setShowClearConfirm(false)
    } else {
      setShowClearConfirm(true)
      setTimeout(() => setShowClearConfirm(false), 3000)
    }
  }

  const handleSelectSession = async (sessionId: string) => {
    setSessionDropdownOpen(false)
    await loadSession(sessionId)
  }

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null

  const hasSessionMessages = messages.length > 0

  if (!chatOpen && !forceOpen) {
    return (
      <aside
        className="w-8 h-full flex flex-col items-center justify-start pt-3"
        role="complementary"
        aria-label="Analyst Chat (collapsed)"
      >
        {/* Unread activity dot — visible when there are messages in the current session */}
        {hasSessionMessages && (
          <span
            className="w-2 h-2 rounded-full bg-amber-400 mb-1 animate-pulse"
            aria-label="Chat has activity"
            title="Chat has messages — click to open"
          />
        )}
        {/* ChevronRight points toward the direction the panel expands */}
        <button
          onClick={() => setChatOpen(true)}
          className="p-1.5 text-aegis-text-muted hover:text-amber-400 transition-colors w-full flex justify-center"
          aria-label="Open chat pane"
          title="Open chat (C)"
        >
          <ChevronRight size={14} />
        </button>
        <div
          className="mt-4 text-aegis-text-muted"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em' }}
          title="Analyst Chat panel"
        >
          ANALYST CHAT
        </div>
      </aside>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-aegis-border-panel flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={12} className="text-amber-500" />
          <span className="text-xs font-mono font-semibold text-aegis-text-primary tracking-widest">
            ANALYST CHAT
          </span>
          {isDemoMode && (
            <span className="text-xs font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              DEMO
            </span>
          )}
          {tts.isPlaying && (
            <span className="text-xs font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
              ◉ SPEAKING
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className={`p-1 text-xs font-mono transition-colors ${
              showClearConfirm
                ? 'text-red-400 hover:text-red-300'
                : 'text-aegis-text-muted hover:text-aegis-text-secondary'
            }`}
            title={showClearConfirm ? 'Click again to confirm clear' : 'Clear conversation'}
            aria-label="Clear conversation"
          >
            {showClearConfirm ? (
              <span className="text-xs font-mono text-red-400">CONFIRM?</span>
            ) : (
              <Trash2 size={11} />
            )}
          </button>
          <button
            onClick={() => forceOpen ? onRequestClose?.() : setChatOpen(false)}
            className="p-1 text-aegis-text-muted hover:text-amber-400 transition-colors"
            aria-label="Collapse chat pane"
            title="Collapse chat (C)"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Session selector — shown in demo mode (always has sessions) or live mode with sessions */}
      {(isDemoMode || sessions.length > 0) && (
        <div className="relative flex-shrink-0 border-b border-aegis-border-panel">
          <button
            onClick={() => setSessionDropdownOpen(prev => !prev)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-aegis-text-secondary hover:text-aegis-text-primary hover:bg-aegis-bg-panel-hover transition-colors"
            aria-haspopup="listbox"
            aria-expanded={sessionDropdownOpen}
            aria-label="Select chat session"
          >
            {sessionsLoading ? (
              <Loader2 size={10} className="animate-spin text-amber-500/60 flex-shrink-0" />
            ) : (
              <History size={10} className="flex-shrink-0 text-aegis-text-muted" />
            )}
            <span className="flex-1 text-left truncate">
              {activeSession ? activeSession.title : (hasSessionMessages ? 'Current Session' : 'New Session')}
            </span>
            <ChevronRight
              size={10}
              className={`flex-shrink-0 text-aegis-text-muted transition-transform ${sessionDropdownOpen ? 'rotate-90' : ''}`}
            />
          </button>

          {sessionDropdownOpen && sessions.length > 0 && (
            <div
              role="listbox"
              aria-label="Previous chat sessions"
              className="absolute left-0 right-0 top-full z-50 bg-aegis-bg-overlay border border-aegis-border-strong shadow-lg max-h-48 overflow-y-auto"
            >
              {sessions.map(session => (
                <button
                  key={session.id}
                  role="option"
                  aria-selected={session.id === activeSessionId}
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2 hover:bg-aegis-bg-panel-hover transition-colors ${
                    session.id === activeSessionId ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-aegis-text-primary truncate">
                      {session.title}
                    </div>
                    <div className="text-xs font-mono text-aegis-text-muted mt-0.5">
                      {session.messageCount} msgs · {formatSessionDate(session.updatedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {sessionDropdownOpen && sessions.length === 0 && !sessionsLoading && (
            <div className="absolute left-0 right-0 top-full z-50 bg-aegis-bg-overlay border border-aegis-border-strong p-3">
              <span className="text-xs font-mono text-aegis-text-muted">No previous sessions found.</span>
            </div>
          )}

          {sessionDropdownOpen && (
            <button
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setSessionDropdownOpen(false)}
              aria-label="Close session selector"
              tabIndex={-1}
            />
          )}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden flex flex-col">
        <MessageThread messages={messages} />
        {isDemoMode && <DemoModeOverlay />}
      </div>

      <MessageInput
        onSend={sendMessage}
        onCancel={cancelStream}
        streaming={streaming}
        voiceAvailable={voiceAvailable}
        isListening={voiceInput.isListening}
        isPlaying={tts.isPlaying}
        onVoiceStart={handleVoiceStart}
        onVoiceStop={handleVoiceStop}
        voiceError={voiceInput.error}
      />
    </div>
  )
}
