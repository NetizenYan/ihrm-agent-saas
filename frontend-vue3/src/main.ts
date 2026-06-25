import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import './styles/global.css'
import { registerAgentChatGlobal } from './features/agent-chat'
import { registerGlobalIcons } from './utils/icons'

const app = createApp(App)

// 仅注册按字符串名称解析的图标，避免整包图标打入主 chunk
registerGlobalIcons(app)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn, size: 'default' })

// Global floating Agent chat button + dialog (mounted on body)
registerAgentChatGlobal(app)

app.mount('#app')
