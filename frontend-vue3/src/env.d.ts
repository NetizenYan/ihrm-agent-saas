/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_PROXY_TARGET: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_AGENT_CHAT_ENDPOINT: string
  readonly VITE_AGENT_CHAT_MOCK: string
  readonly VITE_USE_DEMO_LOGIN: string
  readonly VITE_DEMO_MOBILE: string
  readonly VITE_DEMO_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
