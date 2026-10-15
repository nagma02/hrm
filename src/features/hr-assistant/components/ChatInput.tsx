import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
export function ChatInput({ onSend, disabled }: { onSend: (message: string) => Promise<boolean> | void; disabled: boolean }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 90)}px`
  }, [value])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const submitted = value
    if (!submitted.trim()) return
    const sent = await onSend(submitted)
    if (sent !== false) setValue((current) => current === submitted ? '' : current)
  }
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }
  return <form className="hr-chat-input" onSubmit={submit}><label className="sr-only" htmlFor="hr-assistant-input">Message AI Assistant</label><textarea ref={inputRef} id="hr-assistant-input" rows={1} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={keyDown} placeholder="Message AI Assistant..." disabled={disabled} /><button type="submit" aria-label="Send message" disabled={!value.trim() || disabled}><Send size={17} /></button></form>
}
