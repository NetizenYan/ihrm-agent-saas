import type { ChatStreamOptions } from './types'

const MOCK_REPLIES: string[] = [
  `你好！我是 IHRM Agent 演示助手。

当前 Agent UI **仅为前端演示**，不具备真实业务 Tool 调用能力。

我可以展示流式输出、停止生成、清空会话与复制回答等交互。后端流式接口就绪后，将 \`VITE_AGENT_CHAT_MOCK\` 设为 \`false\` 即可切换到真实接口 \`POST /api/agent/chat/stream\`。`,
  `这是一条 **Mock 流式回复**。

- 支持多轮对话展示
- 支持 Markdown 渲染（已做 XSS 防护）
- 支持停止生成与清空会话

> 提示：真实 Agent 后端尚未实现，当前内容由前端本地生成。`,
  `收到你的消息："{q}"。

演示模式下我不会访问薪资、社保、考勤、审批、权限、导入、导出、上传等敏感接口，也不会查询数据库。`
]

function pickReply(question: string): string {
  const q = (question || '').trim()
  if (q && MOCK_REPLIES[2]) { return MOCK_REPLIES[2].replace('{q}', q.slice(0, 80)) }
  return MOCK_REPLIES[0]
}

export async function mockStreamChat(options: ChatStreamOptions): Promise<void> {
  const { messages, signal, onDelta, onDone, onError } = options
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const reply = pickReply(lastUser?.content || '')
  const tokens = Array.from(reply)
  let i = 0
  const tickMs = 24

  if (signal?.aborted) { onDone?.(); return }

  await new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (signal?.aborted) { clearInterval(timer); onDone?.(); resolve(); return }
      const step = Math.max(1, Math.round(tokens.length / 120))
      for (let k = 0; k < step && i < tokens.length; k++, i++) { onDelta(tokens[i]) }
      if (i >= tokens.length) { clearInterval(timer); onDone?.(); resolve() }
    }, tickMs)
    signal?.addEventListener('abort', () => { clearInterval(timer); onDone?.(); resolve() }, { once: true })
  }).catch((err) => { onError?.(err instanceof Error ? err : new Error('Mock 流式失败')) })
}
