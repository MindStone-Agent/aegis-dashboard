import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import type { Message } from '../../hooks/useStreamingChat'
import { format } from 'date-fns'

interface AgentMessageProps {
  message: Message
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 text-aegis-text-muted hover:text-aegis-text-secondary transition-colors"
      aria-label="Copy message"
      title="Copy to clipboard"
    >
      {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
    </button>
  )
}

function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).trim()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const lang = className?.replace('language-', '') ?? ''

  return (
    <div className="relative group my-2">
      {lang && (
        <div className="flex items-center justify-between px-3 py-1 bg-gray-900/80 border-b border-gray-700/50">
          <span className="text-xs font-mono text-aegis-text-muted">{lang}</span>
          <button
            onClick={handleCopy}
            className="text-xs font-mono text-aegis-text-muted hover:text-aegis-text-secondary transition-colors flex items-center gap-1"
          >
            {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="bg-gray-900/80 border border-gray-700/50 p-3 overflow-x-auto">
        <code className={`text-xs font-mono text-aegis-text-mono ${className ?? ''}`}>{code}</code>
      </pre>
    </div>
  )
}

// Normalize content so single newlines that aren't inside code blocks
// become double newlines (proper paragraph breaks). This prevents
// sentences from running together when inline markdown (bold, code, etc)
// is adjacent to line endings.
//
// Rules:
// - Blank lines are NOT injected between consecutive list items (tight list)
//   or between consecutive table rows — those structures break if blank lines
//   appear within them.
// - Blank lines ARE injected at paragraph↔list and paragraph↔table transitions
//   so prose text doesn't run into list/table content without a separator.
// - Code fences are passed through verbatim.
// - Windows \r\n and bare \r are normalized to \n first.
function normalizeLineBreaks(content: string): string {
  const segments: string[] = []
  let inCode = false
  let fence = ''

  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  const isTableRow = (s: string) => /^\s*\|/.test(s)
  const isListItem = (s: string) => /^(\s*[-*+]\s|\s*\d+\.\s)/.test(s)

  // Only skip blank-line injection when both lines are within the same
  // markdown structure (consecutive table rows or consecutive list items).
  const skipBlank = (cur: string, prv: string) =>
    (isTableRow(cur) && isTableRow(prv)) ||
    (isListItem(cur) && isListItem(prv))

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const fenceMatch = line.match(/^(`{3,}|~{3,})/)

    if (fenceMatch && !inCode) {
      inCode = true
      fence = fenceMatch[1]
      segments.push(line)
    } else if (inCode && line.startsWith(fence)) {
      inCode = false
      fence = ''
      segments.push(line)
    } else if (inCode) {
      segments.push(line)
    } else {
      const prev = segments[segments.length - 1] ?? ''
      const prevNonEmpty = prev !== ''
      const lineNonEmpty = line !== ''

      if (prevNonEmpty && lineNonEmpty && !skipBlank(line, prev)) {
        segments.push('')
      }
      segments.push(line)
    }
  }

  return segments.join('\n')
}

export function AgentMessage({ message }: AgentMessageProps) {
  const time = (() => {
    try { return format(new Date(message.timestamp), 'HH:mm') } catch { return '' }
  })()

  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] w-full">
        <div className="border-l-2 border-gray-600 bg-aegis-bg-panel px-3 py-2">
          {message.interrupted && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-red-400 mb-2">
              <AlertTriangle size={11} />
              <span>Stream interrupted</span>
            </div>
          )}
          <div className="prose prose-invert prose-xs max-w-none text-xs leading-relaxed
            [&_p]:text-aegis-text-primary [&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-xs
            [&_h1]:text-aegis-text-primary [&_h1]:text-sm [&_h1]:font-mono [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1
            [&_h2]:text-aegis-text-primary [&_h2]:text-xs [&_h2]:font-mono [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1
            [&_h3]:text-amber-400 [&_h3]:text-xs [&_h3]:font-mono [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
            [&_ul]:my-1 [&_ul]:pl-3 [&_li]:text-aegis-text-secondary [&_li]:text-xs [&_li]:my-0.5
            [&_ol]:my-1 [&_ol]:pl-3
            [&_strong]:text-aegis-text-primary [&_strong]:font-semibold
            [&_em]:text-aegis-text-secondary [&_em]:italic
            [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-gray-800/60 [&_code]:px-1 [&_code]:py-0.5
            [&_table]:border-collapse [&_table]:w-full [&_table]:my-2
            [&_th]:border [&_th]:border-aegis-border-panel [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-xs [&_th]:font-mono [&_th]:text-aegis-text-secondary [&_th]:bg-aegis-bg-overlay
            [&_td]:border [&_td]:border-aegis-border-panel [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs [&_td]:text-aegis-text-secondary
            [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500/40 [&_blockquote]:pl-3 [&_blockquote]:text-aegis-text-muted [&_blockquote]:italic
            [&_hr]:border-aegis-border-panel [&_hr]:my-2
            [&_br]:block [&_br]:mt-0.5
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? '')
                  const isBlock = match !== null
                  if (isBlock) {
                    return <CodeBlock className={className}>{children}</CodeBlock>
                  }
                  return <code className={className} {...props}>{children}</code>
                },
                pre({ children }) {
                  return <>{children}</>
                },
              }}
            >
              {normalizeLineBreaks(message.content)}
            </ReactMarkdown>
          </div>
          {message.streaming && (
            <span className="inline-block w-1.5 h-3.5 bg-amber-500 animate-pulse ml-0.5" aria-hidden="true" />
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs font-mono text-aegis-text-muted">{time}</span>
          {!message.streaming && (
            <CopyButton text={message.content} />
          )}
        </div>
      </div>
    </div>
  )
}
