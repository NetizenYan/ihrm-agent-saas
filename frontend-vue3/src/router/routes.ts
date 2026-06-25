import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/layouts/default.vue')

export const whiteList = ['/login', '/401', '/404']

export const constantRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('@/views/login/index.vue'), meta: { hidden: true } },
  { path: '/401', name: 'error-401', component: () => import('@/views/error/401.vue'), meta: { hidden: true } },
  { path: '/404', name: 'error-404', component: () => import('@/views/error/404.vue'), meta: { hidden: true } },
  {
    path: '/', component: Layout, redirect: '/dashboard',
    children: [{ path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '首页', icon: 'Odometer', affix: true } }]
  },
  {
    path: '/agent', component: Layout, redirect: '/agent/chat',
    meta: { title: 'Agent 对话', icon: 'ChatDotRound', roles: ['*'] },
    children: [{ path: 'chat', name: 'agent-chat', component: () => import('@/features/agent-chat/AgentChatPage.vue'), meta: { title: 'Agent 对话', icon: 'ChatDotRound' } }]
  }
]

export const asyncRoutes: RouteRecordRaw[] = [
  { path: '/departments', component: Layout, redirect: '/departments/index', name: 'departments', meta: { title: '组织架构', icon: 'OfficeBuilding' },
    children: [{ path: 'index', name: 'organizations-index', component: () => import('@/views/company/departments.vue'), meta: { title: '组织架构', icon: 'OfficeBuilding' } }] },
  { path: '/saas-clients', component: Layout, redirect: '/saas-clients/index', name: 'saas-clients', meta: { title: '企业管理', icon: 'Briefcase' },
    children: [
      { path: 'index', name: 'saas-clients-index', component: () => import('@/views/company/saas-clients.vue'), meta: { title: 'SAAS企业', icon: 'Briefcase' } },
      { path: 'details/:id', name: 'saas-clients-detail', component: () => import('@/views/company/saas-client-detail.vue'), meta: { title: '企业详情', hidden: true, activeMenu: '/saas-clients/index' } }
    ] },
  { path: '/settings', component: Layout, redirect: '/settings/index', name: 'settings', meta: { title: '公司设置', icon: 'Setting' },
    children: [{ path: 'index', name: 'settings-index', component: () => import('@/views/company/settings.vue'), meta: { title: '公司设置', icon: 'Setting' } }] },
  { path: '/sys-users', component: Layout, redirect: '/sys-users/index', name: 'sys-users', meta: { title: '用户管理', icon: 'User' },
    children: [{ path: 'index', name: 'sys-users-index', component: () => import('@/views/system/users.vue'), meta: { title: '用户', icon: 'User' } }] },
  { path: '/sys-roles', component: Layout, redirect: '/sys-roles/index', name: 'sys-roles', meta: { title: '角色管理', icon: 'UserFilled' },
    children: [{ path: 'index', name: 'sys-roles-index', component: () => import('@/views/system/roles.vue'), meta: { title: '角色', icon: 'UserFilled' } }] },
  { path: '/sys-permissions', component: Layout, redirect: '/sys-permissions/index', name: 'sys-permissions', meta: { title: '权限设置', icon: 'Key' },
    children: [{ path: 'index', name: 'sys-permissions-index', component: () => import('@/views/system/permissions.vue'), meta: { title: '权限', icon: 'Key' } }] },
  { path: '/employees', component: Layout, redirect: '/employees/index', name: 'employees', meta: { title: '员工管理', icon: 'Avatar' },
    children: [
      { path: 'index', name: 'employees-index', component: () => import('@/views/employees/index.vue'), meta: { title: '员工列表', icon: 'Avatar' } },
      { path: 'details/:id', name: 'employees-detail', component: () => import('@/views/employees/detail.vue'), meta: { title: '员工详情', hidden: true, activeMenu: '/employees/index' } },
      { path: 'import', name: 'employees-import', component: () => import('@/views/employees/import.vue'), meta: { title: '员工导入', hidden: true, activeMenu: '/employees/index' } }
    ] },
  { path: '/social-securitys', component: Layout, redirect: '/social-securitys/index', name: 'social_securitys', meta: { title: '社保管理', icon: 'Wallet' },
    children: [
      { path: 'index', name: 'social-securitys-index', component: () => import('@/views/social/index.vue'), meta: { title: '社保', icon: 'Wallet' } },
      { path: 'list', name: 'social-securitys-list', component: () => import('@/views/social/list.vue'), meta: { title: '社保列表', hidden: true } },
      { path: 'detail/:id', name: 'social-securitys-detail', component: () => import('@/views/social/detail.vue'), meta: { title: '社保详情', hidden: true } }
    ] },
  { path: '/attendances', component: Layout, redirect: '/attendances/index', name: 'attendances', meta: { title: '考勤管理', icon: 'Calendar' },
    children: [
      { path: 'index', name: 'attendances-index', component: () => import('@/views/attendance/index.vue'), meta: { title: '考勤', icon: 'Calendar' } },
      { path: 'archiving', name: 'attendances-archiving', component: () => import('@/views/attendance/archiving.vue'), meta: { title: '考勤归档', hidden: true } },
      { path: 'report', name: 'attendances-report', component: () => import('@/views/attendance/report.vue'), meta: { title: '考勤报表', hidden: true } }
    ] },
  { path: '/salarys', component: Layout, redirect: '/salarys/index', name: 'salarys', meta: { title: '工资管理', icon: 'Money' },
    children: [
      { path: 'index', name: 'salarys-index', component: () => import('@/views/salary/index.vue'), meta: { title: '工资', icon: 'Money' } },
      { path: 'list', name: 'salarys-list', component: () => import('@/views/salary/list.vue'), meta: { title: '工资列表', hidden: true } },
      { path: 'details/:yearMonth/:id', name: 'salarysDetails', component: () => import('@/views/salary/detail.vue'), meta: { title: '工资详情', hidden: true } },
      { path: 'setting', name: 'salarysSetting', component: () => import('@/views/salary/setting.vue'), meta: { title: '工资设置', hidden: true } }
    ] },
  { path: '/approvals', component: Layout, redirect: '/approvals/index', name: 'approvals', meta: { title: '审批管理', icon: 'DocumentChecked' },
    children: [
      { path: 'index', name: 'approvals-index', component: () => import('@/views/approvals/index.vue'), meta: { title: '审批', icon: 'DocumentChecked' } },
      { path: 'approval/:id', name: 'approvals-detail', component: () => import('@/views/approvals/approval-detail.vue'), meta: { title: '审批详情', hidden: true, activeMenu: '/approvals/index' } }
    ] },
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/404', meta: { hidden: true } }
]
