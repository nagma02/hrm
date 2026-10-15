import { Bot, X, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHRAssistant } from '../hooks/useHRAssistant'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { SuggestedQuestions } from './SuggestedQuestions'

export function HRAssistantPanel({ onClose, open }: { onClose: () => void; open: boolean }) {
  const { messages, typing, send, clear, clearVersion } = useHRAssistant()
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, typing, open])
  return <section className={`hr-assistant-panel${open ? '' : ' hr-assistant-panel--closed'}`} role="dialog" aria-modal="false" aria-hidden={!open} aria-labelledby="hr-assistant-title">
    <header className="hr-assistant-header"><span className="hr-assistant-header__avatar"><Bot size={20} /></span><div><h2 id="hr-assistant-title">AI Assistant</h2><p><i /> Ask me anything</p></div><button aria-label="Clear chat" title="Clear chat" onClick={clear}><Trash2 size={16} /></button><button aria-label="Close AI Assistant" onClick={onClose}><X size={19} /></button></header>
    <div className="hr-assistant-messages" ref={listRef} aria-live="polite">{messages.map((message) => <ChatMessage key={message.id} message={message} onNavigate={(path) => { navigate(path); onClose() }} onRetry={send} />)}{messages.length === 1 && <SuggestedQuestions onSelect={send} />}{typing && <div className="hr-chat-typing" aria-label="AI assistant is thinking"><span>Thinking...</span><i /><i /><i /></div>}</div>
    <div className="hr-assistant-footer"><ChatInput key={clearVersion} onSend={send} disabled={typing} /><span>AI answers may need HR confirmation for company-specific policies</span></div>
  </section>
}
