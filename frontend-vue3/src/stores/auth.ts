import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, profileApi, logoutApi } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'
import type { RoleSet } from '@/utils/permission'

export interface UserProfile {
  userId?: string
  username?: string
  mobile?: string
  avatar?: string
  introduction?: string
  company?: string
  [key: string]: any
}

interface ProfileData {
  user?: UserProfile
  roles?: RoleSet
  username?: string
  mobile?: string
  avatar?: string
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | undefined>(getToken())
  const user = ref<UserProfile>({})
  const roles = ref<RoleSet>({})
  const menus = ref<string[]>([])
  const permissions = ref<string[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const rolesLoaded = computed(() => !!roles.value && !!roles.value.menus)

  async function login(payload: { mobile: string; password: string }) {
    const res = await loginApi(payload)
    const sessionId = res?.data?.data ?? res?.data
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('登录失败：未返回有效的会话凭证')
    }
    token.value = sessionId
    setToken(sessionId)
    return sessionId
  }

  async function fetchProfile() {
    const res = await profileApi()
    const data: ProfileData = res?.data?.data ?? res?.data ?? {}
    const roleSet: RoleSet = data.roles || { menus: [], points: [] }
    roles.value = roleSet
    menus.value = roleSet.menus || []
    permissions.value = roleSet.points || []
    user.value = {
      userId: data.userId ?? data.user?.userId,
      username: data.username ?? data.user?.username,
      mobile: data.mobile ?? data.user?.mobile,
      avatar: data.avatar ?? data.user?.avatar,
      introduction: data.introduction ?? data.user?.introduction,
      company: data.company ?? data.user?.company,
      ...data
    }
    return { user: user.value, roles: roleSet }
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      resetAuth()
    }
  }

  function fedLogout() {
    // 前端强制登出（如 token 失效 / profile 拉取失败）：必须清理
    // token、用户状态、权限状态，并重置动态路由 matcher，避免残留动态路由被直接解析。
    // resetRouter 内部会调用 resetRouterState（置 routesGenerated=false）与 permission.reset()。
    resetAuth()
    resetRouter()
  }

  function resetAuth() {
    token.value = undefined
    user.value = {}
    roles.value = {}
    menus.value = []
    permissions.value = []
    removeToken()
  }

  return {
    token, user, roles, menus, permissions,
    isLoggedIn, rolesLoaded,
    login, fetchProfile, logout, fedLogout, resetAuth
  }
})
