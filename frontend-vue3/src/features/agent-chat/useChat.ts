import { ref, computed } from 'vue'
import type { ChatMessage, ChatRole } from './types'
import { isMockMode, agentChatEndpoint } from './types'
import { streamChat } from './api'
import { mockStreamChat } from './mock'

let idCounter = 0
function nextId(): string { idCounter += 1; return `msg-${Date.now()}-${idCounter}` }

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let controller: AbortController | null = null

  const canStop = computed(() => loading.value)
  const mockMode = computed(() => isMockMode())
  const endpoint = computed(() => agentChatEndpoint())

  function pushSystemNotice(text: string) {
    messages.value.push({ id: nextId(), role: 'system', content: text, createdAt: Date.now() })
  }

  async function send(text: string) {
    const content = text.trim()
    if (!content || loading.value) return

    error.value = null
    messages.value.push({ id: nextId(), role: 'user', content, createdAt: Date.now() })

    const assistantMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', createdAt: Date.now(), streaming: true }
    messages.value.push(assistantMsg)

    loading.value = true
    controller = new AbortController()

    const history = messages.value.filter((m) => m.role !== 'system').map((m) => ({ role: m.role as ChatRole, content: m.content }))

    const opts = {
      messages: history,
      signal: controller.signal,
      onDelta: (delta: string) => { assistantMsg.content += delta },
      onDone: () => { assistantMsg.streaming = false; loading.value = false; controller = null },
      onError: (err: Error) => { assistantMsg.streaming = false; assistantMsg.error = true; error.value = err.message; loading.value = false; controller = null }
    }

    if (isMockMode()) { await mockStreamChat(opts) } else { await streamChat(opts) }
  }

  function stop() {
    if (controller) { controller.abort(); controller = null }
    loading.value = false
    const last = messages.value[messages.value.length - 1]
    if (last && last.streaming) { last.streaming = false }
  }

  function clear() { stop(); messages.value = []; error.value = null }

  function copyAnswer(msg: ChatMessage): Promise<void> {
    return navigator.clipboard.writeText(msg.content).then(() => { /* caller surfaces toast */ })
  }

  return { messages, loading, error, canStop, mockMode, endpoint, pushSystemNotice, send, stop, clear, copyAnswer }
}
