import { useState, type ReactNode } from 'react'
import { Bot, Check, Copy } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../types'

function formattedText(text: string): ReactNode[] {
  const lines = text.split('\n')
  return lines.map((line, lineIndex) => {
    if (!line) return <br key={`line-${lineIndex}`} />
    const heading = /^(#{1,3})\s+/.exec(line)
    const bullet = /^\s*[-*]\s+/.exec(line)
    const content = line.slice(heading?.[0].length ?? bullet?.[0].length ?? 0)
    const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={partIndex}>{part.slice(2, -2)}</strong>
      if (part.startsWith('`') && part.endsWith('`')) return <code key={partIndex}>{part.slice(1, -1)}</code>
      return part
    })
    return <span key={`line-${lineIndex}`}>{heading && <br />}{bullet && <span aria-hidden="true">• </span>}{heading ? <strong>{parts}</strong> : parts}{lineIndex < lines.length - 1 && <br />}</span>
  })
}

export function ChatMessage({ message, onNavigate, onRetry }: { message: ChatMessageType; onNavigate: (path: string) => void; onRetry: (text: string) => void | Promise<boolean> }) {
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const codePattern = /```([\w+-]*)\n?([\s\S]*?)```/g
  const content: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let codeIndex = 0
  while ((match = codePattern.exec(message.text)) !== null) {
    if (match.index > cursor) content.push(...formattedText(message.text.slice(cursor, match.index)))
    const currentIndex = codeIndex++
    const code = match[2].replace(/\n$/, '')
    content.push(<div className="hr-chat-codeblock" key={`code-${currentIndex}`}>
      <div className="hr-chat-codeblock__toolbar"><span>{match[1] || 'Code'}</span><button aria-label="Copy code" onClick={async () => {
        try {
          await navigator.clipboard.writeText(code)
          setCopiedCode(currentIndex)
        } catch {
          setCopiedCode(null)
        }
      }}>{copiedCode === currentIndex ? <Check size={13} /> : <Copy size={13} />}{copiedCode === currentIndex ? 'Copied' : 'Copy'}</button></div>
      <pre><code>{code}</code></pre>
    </div>)
    cursor = codePattern.lastIndex
  }
  if (cursor < message.text.length) content.push(...formattedText(message.text.slice(cursor)))
  return <div className={`hr-chat-message hr-chat-message--${message.role}${message.retryText ? ' hr-chat-message--error' : ''}`}>
    {message.role === 'assistant' && <span className="hr-chat-avatar"><Bot size={15} aria-hidden="true" /></span>}
    <div className="hr-chat-message__content"><p>{content}</p>{message.action && <button className="hr-chat-action" onClick={() => onNavigate(message.action!.path)}>{message.action.label}</button>}{message.retryText && <button className="hr-chat-retry" onClick={() => { void onRetry(message.retryText!) }}>Retry</button>}</div>
  </div>
}
