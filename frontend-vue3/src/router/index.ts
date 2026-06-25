import { createRouter, createWebHistory, type Router } from 'vue-router'
import { constantRoutes, whiteList } from './routes'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'

const router: Router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

let routesGenerated = false

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (auth.isLoggedIn) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }
    if (!routesGenerated && !auth.rolesLoaded) {
      try {
        const { roles } = await auth.fetchProfile()
        const permission = usePermissionStore()
        const accessible = permission.generateRoutes(roles)
        accessible.forEach((r) => router.addRoute(r))
        routesGenerated = true
        next({ ...to, replace: true })
        return
      } catch (e) {
        // fedLogout 内部会清理 token/用户/权限状态，并调用 resetRouter 重建 matcher
        // （同时置 routesGenerated=false），无需在此重复置位。
        auth.fedLogout()
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    }
    next()
    return
  }

  if (whiteList.includes(to.path)) {
    next()
    return
  }
  next({ path: '/login', query: { redirect: to.fullPath } })
})

export function resetRouterState() {
  routesGenerated = false
  const permission = usePermissionStore()
  permission.reset()
}

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: constantRoutes
  })
  ;(router as any).matcher = (newRouter as any).matcher
  resetRouterState()
}

export default router
