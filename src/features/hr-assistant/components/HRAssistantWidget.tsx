import { useState } from 'react'
import { Bot, X } from 'lucide-react'
import { HRAssistantPanel } from './HRAssistantPanel'
export function HRAssistantWidget() {
  const [open, setOpen] = useState(false)
  return <div className="hr-assistant-widget"><HRAssistantPanel open={open} onClose={() => setOpen(false)} /><button className="hr-assistant-launcher" aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={22} /> : <Bot size={23} />}<span className="hr-assistant-tooltip">AI Assistant</span></button></div>
}
