import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/use-auth'
import { isEmployeePortalPath } from '@/app/router/portal-route'
import { ApiClientError, apiClient } from '@/services/api-client'
import type { ChatMessage } from '../types'

const welcome: ChatMessage = { id: 'welcome', role: 'assistant', text: "Hi! I'm your AI Assistant. Ask me anything about your HR portal." }
type ChatApiResponse = { reply: string }
type ChatApiRequest = { message: string; userId: string; portalMode: 'admin' | 'employee'; history: Array<{ role: 'user' | 'assistant'; text: string }> }

function hrActionForQuestion(question: string, employeePortal: boolean) {
  const q = question.toLowerCase()
  if (/\b(apply|submit|request).{0,30}\bleave\b|\bleave application\b/.test(q)) {
    return { label: 'Open Leave', path: employeePortal ? '/app/employee-leave/apply' : '/app/leave/apply' }
  }
  if (/\b(payslip|salary|payroll)\b/.test(q)) {
    return { label: employeePortal ? 'Open My Payslips' : 'Open Payroll', path: employeePortal ? '/app/employee-payslips' : '/app/payroll' }
  }
  if (/\b(attendance|clock.?in|timesheet)\b/.test(q)) {
    return { label: employeePortal ? 'Open My Attendance' : 'Open Attendance', path: employeePortal ? '/app/employee-attendance' : '/app/attendance' }
  }
  if (/\b(profile|leave balance|remaining leave|my leave|leave request)\b/.test(q)) {
    return { label: employeePortal ? 'Open My Leave' : 'Open Leave', path: employeePortal ? '/app/employee-leave' : '/app/leave' }
  }
  return undefined
}

function relevantHistory(question: string, messages: ChatMessage[]) {
  const previous = messages.filter((message) => message.id !== 'welcome' && !message.retryText)
  const latestUserQuestion = [...previous].reverse().find((message) => message.role === 'user')?.text
  if (!latestUserQuestion) return []
  const followUp = /^(?:and\b|but\b|what about\b|how about\b|why\b|how so\b|explain (?:it|that|this)\b|give (?:me )?(?:an? )?(?:example|more detail)|(?:can you |please )?(?:explain|simplify|elaborate)\b|make it (?:simple|simpler)|translate (?:it|that|this)\b|what does (?:it|that) mean|show (?:me )?an example|and you\??)/i.test(question.trim())
  const topics = [
    /\b(leave|time off)\b/i, /\b(attendance|clock.?in|timesheet)\b/i,
    /\b(payroll|salary|payslip)\b/i, /\b(profile|account)\b/i,
    /\b(policy|announcement|holiday)\b/i,
  ]
  const sameTopic = topics.some((topic) => topic.test(question) && topic.test(latestUserQuestion))
  const words = (value: string) => value.toLowerCase().match(/[a-z0-9]{4,}/g)?.filter((word) => !['what', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'have', 'does', 'will', 'your', 'about'].includes(word)) ?? []
  const currentWords = new Set(words(question))
  const sharedTopicWord = words(latestUserQuestion).some((word) => currentWords.has(word))
  return followUp || sameTopic || sharedTopicWord ? previous.slice(-8) : []
}

export function useHRAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome])
  const [typing, setTyping] = useState(false)
  const [clearVersion, setClearVersion] = useState(0)
  const requestSequence = useRef(0)
  const inFlight = useRef(false)
  const location = useLocation()
  const { user } = useAuth()
  const send = async (text: string): Promise<boolean> => {
    const value = text.trim()
    if (!value || inFlight.current) return false
    const id = `${Date.now()}`
    const requestId = ++requestSequence.current
    const history = relevantHistory(value, messages)
    setMessages((current) => [...current, { id: `${id}-user`, role: 'user', text: value }])
    inFlight.current = true
    setTyping(true)
    const employeePortal = isEmployeePortalPath(location.pathname)
    const portalMode = employeePortal ? 'employee' : 'admin'
    let responseMessage: ChatMessage
    try {
      const response = await apiClient.post<ChatApiResponse, ChatApiRequest>('/ai/chat', {
        message: value,
        userId: user?.id || '',
        portalMode,
        history: history.map(({ role, text: messageText }) => ({ role, text: messageText })),
      })
      const serverReply = response.data?.reply
      if (typeof serverReply !== 'string' || !serverReply.trim()) throw new Error('The AI assistant returned an empty response.')
      responseMessage = { id: `${id}-assistant`, role: 'assistant', text: serverReply.trim(), action: hrActionForQuestion(value, employeePortal) }
    } catch (error) {
      const message = error instanceof ApiClientError
        ? error.status === 0 ? 'I could not reach the AI service. Check your connection and try again.' : error.message
        : 'I could not reach the AI service. Check your connection and try again.'
      responseMessage = { id: `${id}-assistant`, role: 'assistant', text: message, retryText: value }
    }
    if (requestSequence.current !== requestId) return false
    setMessages((current) => [...current, responseMessage])
    setTyping(false)
    inFlight.current = false
    return !responseMessage.retryText
  }
  const clear = () => { requestSequence.current += 1; inFlight.current = false; setMessages([welcome]); setTyping(false); setClearVersion((version) => version + 1) }
  return { messages, typing, send, clear, clearVersion }
}
