import { useEffect, useRef } from 'react'
import type { Message } from '../../hooks/useStreamingChat'
import { UserMessage } from './UserMessage'
import { AgentMessage } from './AgentMessage'

interface MessageThreadProps {
  messages: Message[]
}

export function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const threshold = 100
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-aegis-text-muted">No messages yet</div>
          <div className="text-xs font-mono text-aegis-text-muted/60">
            Ask the Threat Analyst Agent a question
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-label="Chat message thread"
      aria-live="polite"
      className="flex-1 overflow-y-auto p-3 space-y-3"
      onScroll={handleScroll}
    >
      {messages.map(msg =>
        msg.role === 'user'
          ? <UserMessage key={msg.id} message={msg} />
          : <AgentMessage key={msg.id} message={msg} />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
