import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { asyncRoutes } from '@/router/routes'
import { hasPermission, type RoleSet } from '@/utils/permission'

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const addRouters = ref<RouteRecordRaw[]>([])

  function filterAsyncRoutes(source: RouteRecordRaw[], roles: RoleSet): RouteRecordRaw[] {
    const result: RouteRecordRaw[] = []
    for (const route of source) {
      const clone: RouteRecordRaw = { ...route }
      const wildcard = clone.meta && (clone.meta as any).roles?.includes('*')
      if (wildcard || hasPermission(roles, clone)) {
        if (clone.children) {
          clone.children = filterAsyncRoutes(clone.children, roles)
        }
        result.push(clone)
      }
    }
    return result
  }

  function generateRoutes(roles: RoleSet): RouteRecordRaw[] {
    const accessible = filterAsyncRoutes(asyncRoutes, roles)
    routes.value = accessible
    addRouters.value = accessible
    return accessible
  }

  function reset() {
    routes.value = []
    addRouters.value = []
  }

  return { routes, addRouters, generateRoutes, reset }
})
