export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  error?: boolean
  streaming?: boolean
}

export interface ChatStreamOptions {
  messages: { role: ChatRole; content: string }[]
  signal?: AbortSignal
  onDelta: (delta: string) => void
  onDone?: () => void
  onError?: (err: Error) => void
}

export interface StreamEvent {
  type: 'delta' | 'done' | 'error'
  content?: string
  message?: string
}

export function isMockMode(): boolean {
  const v = import.meta.env.VITE_AGENT_CHAT_MOCK
  return v === 'true' || v === '1'
}

export function agentChatEndpoint(): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const ep = import.meta.env.VITE_AGENT_CHAT_ENDPOINT || '/agent/chat/stream'
  return `${base}${ep}`
}
