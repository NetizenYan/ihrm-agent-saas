import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarOpened = ref<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('sidebarStatus') !== '0' : true
  )
  const language = ref<string>('zh-cn')

  function toggleSidebar() {
    sidebarOpened.value = !sidebarOpened.value
    try {
      localStorage.setItem('sidebarStatus', sidebarOpened.value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  function setLanguage(lang: string) {
    language.value = lang
  }

  return { sidebarOpened, language, toggleSidebar, setLanguage }
})
