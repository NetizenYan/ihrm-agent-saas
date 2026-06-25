// 前端权限仅用于 UI 菜单/路由展示控制，不替代后端 RBAC。
// 真正的访问控制由后端接口与权限注解保障；此处采用 deny-by-default，
// 避免空权限用户在 UI 上越权看到全部业务菜单。
// 超级管理员在后端通过授予全部菜单 code 实现（menus 非空且含全部 code），
// 后端 ProfileResult 不会下发 "*" 通配符，故前端无需特例判断。

export interface RoleSet {
  menus?: string[]
  points?: string[]
}

// 判断当前角色集合是否可访问某条路由。
// 默认拒绝：roles.menus 为空/未定义/非数组，或路由无 name 时，一律返回 false。
// 仅当 route.name 在 roles.menus 中明确匹配（大小写不敏感）时返回 true。
export function hasPermission(roles: RoleSet, route: { name?: string | symbol }): boolean {
  const menus = roles?.menus
  if (!Array.isArray(menus) || menus.length === 0) return false
  if (!route.name) return false
  const name = String(route.name).toLowerCase()
  return menus.some((m) => String(m).toLowerCase() === name)
}

// 检查是否拥有某个功能权限点。同样 deny-by-default，无匹配则返回 false。
export function hasPermissionPoint(roles: RoleSet, point: string): boolean {
  const points = roles?.points
  if (!Array.isArray(points) || points.length === 0) return false
  return points.some((p) => String(p) === point)
}
