export type ChatAction = { label: string; path: string }
export type AssistantReply = { text: string; action?: ChatAction }
export type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string; action?: ChatAction; retryText?: string }
