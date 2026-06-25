import { getToken } from '@/utils/auth'
import { agentChatEndpoint, type ChatStreamOptions, type StreamEvent } from './types'

export async function streamChat(options: ChatStreamOptions): Promise<void> {
  const { messages, signal, onDelta, onDone, onError } = options
  const token = getToken()

  let response: Response
  try {
    response = await fetch(agentChatEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messages }),
      signal
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') { onDone?.(); return }
    onError?.(err instanceof Error ? err : new Error('网络请求失败'))
    return
  }

  if (!response.ok) { onError?.(new Error(`流式请求失败，状态码：${response.status}`)); return }
  if (!response.body) { const text = await response.text().catch(() => ''); if (text) onDelta(text); onDone?.(); return }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nlIndex: number
      while ((nlIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nlIndex).trim()
        buffer = buffer.slice(nlIndex + 1)
        if (!line) continue
        const evt = parseEvent(line)
        if (evt.type === 'done') { onDone?.(); return }
        if (evt.type === 'error') { onError?.(new Error(evt.message || '服务端返回错误')); return }
        if (evt.content) onDelta(evt.content)
      }
    }
    const tail = buffer.trim()
    if (tail) {
      const evt = parseEvent(tail)
      if (evt.type === 'error') { onError?.(new Error(evt.message || '服务端返回错误')); return }
      if (evt.content) onDelta(evt.content)
    }
    onDone?.()
  } catch (err: any) {
    if (err?.name === 'AbortError') { onDone?.(); return }
    onError?.(err instanceof Error ? err : new Error('流式读取失败'))
  }
}

function parseEvent(line: string): StreamEvent {
  if (line.startsWith('{') && line.endsWith('}')) {
    try {
      const obj = JSON.parse(line)
      if (obj && (obj.type === 'delta' || obj.type === 'done' || obj.type === 'error')) {
        return { type: obj.type, content: obj.content, message: obj.message }
      }
      if (obj.content || obj.data || obj.text || obj.delta) {
        return { type: 'delta', content: obj.content ?? obj.data ?? obj.text ?? obj.delta }
      }
    } catch { /* fall through */ }
  }
  if (line.startsWith('data:')) {
    const payload = line.slice(5).trim()
    if (payload === '[DONE]') return { type: 'done' }
    return parseEvent(payload)
  }
  return { type: 'delta', content: line }
}
