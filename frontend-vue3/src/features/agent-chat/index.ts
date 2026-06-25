import type { App } from 'vue'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import AgentChatButton from './AgentChatButton.vue'
import { registerGlobalIcons } from '@/utils/icons'

export function registerAgentChatGlobal(_app: App): void {
  const host = document.createElement('div')
  host.id = 'agent-chat-root'
  document.body.appendChild(host)

  const widget = createApp(AgentChatButton)
  registerGlobalIcons(widget)
  widget.use(ElementPlus)
  widget.mount(host)
}

export { default as AgentChatDialog } from './AgentChatDialog.vue'
export { default as AgentChatPage } from './AgentChatPage.vue'
export { useChat } from './useChat'
export { isMockMode, agentChatEndpoint } from './types'
