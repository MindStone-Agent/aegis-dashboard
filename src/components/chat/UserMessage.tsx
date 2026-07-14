import type { Message } from '../../hooks/useStreamingChat'
import { format } from 'date-fns'

interface UserMessageProps {
  message: Message
}

// Parse out embedded image markers: __IMG__filename||dataUrl
function parseContent(raw: string): { text: string; image?: { name: string; src: string } } {
  const IMG_MARKER = '__IMG__'
  const idx = raw.indexOf(IMG_MARKER)
  if (idx === -1) return { text: raw }

  const text = raw.slice(0, idx).trimEnd()
  const rest = raw.slice(idx + IMG_MARKER.length)
  const sep = rest.indexOf('||')
  if (sep === -1) return { text: raw }

  const name = rest.slice(0, sep)
  const src = rest.slice(sep + 2)
  return { text, image: { name, src } }
}

export function UserMessage({ message }: UserMessageProps) {
  const time = (() => {
    try { return format(new Date(message.timestamp), 'HH:mm') } catch { return '' }
  })()

  const { text, image } = parseContent(message.content)

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%]">
        <div className="border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2">
          {text && (
            <p className="text-xs font-mono text-aegis-text-primary whitespace-pre-wrap break-words leading-relaxed">
              {text}
            </p>
          )}
          {image && (
            <div className={text ? 'mt-2' : ''}>
              <img
                src={image.src}
                alt={image.name}
                className="max-w-full max-h-64 border border-aegis-border-panel object-contain"
              />
              <p className="text-xs font-mono text-aegis-text-muted mt-0.5">{image.name}</p>
            </div>
          )}
        </div>
        <div className="text-right mt-0.5">
          <span className="text-xs font-mono text-aegis-text-muted">{time}</span>
        </div>
      </div>
    </div>
  )
}
