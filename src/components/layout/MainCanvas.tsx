import { useState, useCallback, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { useUIStore, CHAT_WIDTH_MIN, CHAT_WIDTH_MAX } from '../../store/uiStore'
import { IntelFeedPanel } from '../panels/IntelFeedPanel'
import { ThreatGroupPanel } from '../panels/ThreatGroupPanel'
import { InvestigationsPanel } from '../panels/InvestigationsPanel'
import { DailySummaryPanel } from '../panels/DailySummaryPanel'
import { AgentActivityPanel } from '../panels/AgentActivityPanel'
import { ChatPane } from '../chat/ChatPane'

export function MainCanvas() {
  const chatOpen = useUIStore(s => s.chatOpen)
  const chatWidth = useUIStore(s => s.chatWidth)
  const setChatWidth = useUIStore(s => s.setChatWidth)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)

  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(chatWidth)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (mv: MouseEvent) => {
      if (!dragging.current) return
      const delta = startX.current - mv.clientX
      const newWidth = Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, startWidth.current + delta))
      setChatWidth(newWidth)
    }

    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [chatWidth, setChatWidth])

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Main content panels */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-w-0">
        <AgentActivityPanel />
        <DailySummaryPanel />
        <IntelFeedPanel />
        <ThreatGroupPanel />
        <InvestigationsPanel />
      </div>

      {/* Desktop chat pane — hidden on mobile */}
      <div
        className="flex-shrink-0 border-l border-aegis-border-panel hidden md:flex flex-col relative"
        style={{ width: chatOpen ? chatWidth : 32 }}
      >
        {chatOpen && (
          <div
            onMouseDown={onMouseDown}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-amber-500/40 active:bg-amber-500/60 transition-colors"
            title="Drag to resize chat panel"
            aria-hidden="true"
          />
        )}
        <ChatPane />
      </div>

      {/* Mobile FAB — only visible on small screens */}
      <button
        onClick={() => setMobileChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 md:hidden w-12 h-12 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black flex items-center justify-center shadow-xl transition-colors"
        aria-label="Open analyst chat"
        title="Open analyst chat"
      >
        <MessageCircle size={20} />
      </button>

      {/* Mobile bottom-sheet overlay */}
      {mobileChatOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/60 cursor-default"
            onClick={() => setMobileChatOpen(false)}
            aria-label="Close chat"
            tabIndex={-1}
          />
          {/* Sheet */}
          <div
            className="relative bg-aegis-bg-base border-t border-aegis-border-strong flex flex-col shadow-2xl"
            style={{ height: '75dvh' }}
          >
            <ChatPane forceOpen onRequestClose={() => setMobileChatOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
