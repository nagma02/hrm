import { cleanup, render, renderHook, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '@/app/providers/auth-context'
import type { AuthContextValue } from '@/app/providers/auth-context'
import { ApiClientError } from '@/services/api-client'
import { ChatInput } from './components/ChatInput'
import { HRAssistantPanel } from './components/HRAssistantPanel'
import { suggestedQuestions } from './data/suggestedQuestions'
import { useHRAssistant } from './hooks/useHRAssistant'

const apiMocks = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/services/api-client', () => ({
  apiClient: { post: apiMocks.post },
  ApiClientError: class MockApiClientError extends Error {
    status: number
    constructor(shape: { status: number; message: string }) { super(shape.message); this.status = shape.status }
  },
}))

const auth: AuthContextValue = {
  portal: 'employee', setPortal: vi.fn(), session: null,
  user: { id: 'employee-7', name: 'Test Employee', email: 'test@example.test', role: 'EMPLOYEE', permissions: [] },
  isAuthenticated: true, isInitializing: false, acceptSession: vi.fn(), updateUser: vi.fn(),
  signOut: vi.fn(), hasPermission: () => false,
}

function wrapper({ children }: PropsWithChildren) {
  return <MemoryRouter initialEntries={['/app/employee-dashboard']}><AuthContext.Provider value={auth}>{children}</AuthContext.Provider></MemoryRouter>
}

describe('AI assistant message flow', () => {
  beforeEach(() => apiMocks.post.mockReset())
  afterEach(cleanup)

  it('sends greetings and the exact current message to the AI endpoint, then renders its response', async () => {
    apiMocks.post.mockResolvedValue({ data: { reply: 'Hi! How can I help you today?' } })
    const { result } = renderHook(() => useHRAssistant(), { wrapper })
    await act(async () => { await result.current.send('Hi') })
    expect(apiMocks.post).toHaveBeenCalledWith('/ai/chat', expect.objectContaining({
      message: 'Hi', userId: 'employee-7', portalMode: 'employee', history: [],
    }))
    expect(result.current.messages.at(-1)?.text).toBe('Hi! How can I help you today?')
  })

  it('shows all HR suggestions and sends each clicked question to the AI endpoint', async () => {
    const user = userEvent.setup()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() })
    apiMocks.post.mockImplementation(async (_path: string, body?: { message: string }) => ({ data: { reply: `AI answer: ${body?.message ?? ''}` } }))
    render(<HRAssistantPanel open onClose={vi.fn()} />, { wrapper })

    expect(screen.getByText("Hi! I'm your AI Assistant. Ask me anything about your HR portal.")).toBeInTheDocument()
    for (const question of suggestedQuestions) {
      const chip = await screen.findByRole('button', { name: question })
      await user.click(chip)
      expect(await screen.findByText(`AI answer: ${question}`)).toBeInTheDocument()
      expect(screen.getByText(question)).toBeInTheDocument()
      expect(apiMocks.post).toHaveBeenLastCalledWith('/ai/chat', expect.objectContaining({ message: question }))
      if (question !== suggestedQuestions.at(-1)) {
        await user.click(screen.getByRole('button', { name: 'Clear chat' }))
      }
    }
    expect(screen.queryAllByRole('button', { name: /How can I|What is my|Where can I/ })).toHaveLength(0)
  })

  it('sends previous user and assistant turns in order and sends the follow-up only once', async () => {
    apiMocks.post
      .mockResolvedValueOnce({ data: { reply: 'JavaScript is a programming language.' } })
      .mockResolvedValueOnce({ data: { reply: 'For example, const answer = 42.' } })
    const { result } = renderHook(() => useHRAssistant(), { wrapper })
    await act(async () => { await result.current.send('Explain JavaScript.') })
    await act(async () => { await result.current.send('Give me an example.') })
    const [, secondBody] = apiMocks.post.mock.calls[1]
    expect(secondBody.history).toEqual([
      { role: 'user', text: 'Explain JavaScript.' },
      { role: 'assistant', text: 'JavaScript is a programming language.' },
    ])
    expect(secondBody.message).toBe('Give me an example.')
    expect(secondBody.history.filter((turn: { text: string }) => turn.text.includes('Give me an example.'))).toHaveLength(0)
    expect(result.current.messages.at(-1)?.text).toBe('For example, const answer = 42.')
  })

  it('does not send unrelated HR conversation history with a new general question', async () => {
    apiMocks.post
      .mockResolvedValueOnce({ data: { reply: 'Open My Leave to submit a request.' } })
      .mockResolvedValueOnce({ data: { reply: 'React is a JavaScript library for user interfaces.' } })
    const { result } = renderHook(() => useHRAssistant(), { wrapper })
    await act(async () => { await result.current.send('How do I apply for leave?') })
    await act(async () => { await result.current.send('What is React?') })
    const [, secondBody] = apiMocks.post.mock.calls[1]
    expect(secondBody.message).toBe('What is React?')
    expect(secondBody.history).toEqual([])
  })

  it('clears the conversation and preserves a failed message for retry', async () => {
    apiMocks.post
      .mockRejectedValueOnce(new ApiClientError({ status: 503, message: 'AI chat is not configured.' }))
      .mockResolvedValueOnce({ data: { reply: 'AI response received.' } })
    const { result } = renderHook(() => useHRAssistant(), { wrapper })
    let succeeded = true
    await act(async () => { succeeded = await result.current.send('What is React?') })
    expect(succeeded).toBe(false)
    expect(result.current.messages.at(-1)?.retryText).toBe('What is React?')
    await act(async () => { await result.current.send('What is React?') })
    expect(result.current.messages.at(-1)?.text).toBe('AI response received.')
    act(() => result.current.clear())
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].id).toBe('welcome')
  })

  it('keeps the typed message when the AI request fails', async () => {
    const onSend = vi.fn().mockResolvedValue(false)
    const user = userEvent.setup()
    render(<ChatInput onSend={onSend} disabled={false} />)
    const input = screen.getByLabelText('Message AI Assistant')
    await user.type(input, 'What is an API?')
    await user.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledWith('What is an API?')
    expect(input).toHaveValue('What is an API?')
  })
})
