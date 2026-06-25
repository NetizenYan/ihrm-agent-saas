# Vue3 迁移 + Agent 流式对话框报告（Phase 3）

> 当前分支：`phase2b-social-security-tenant-fix`（HEAD `2dee43f6`），未提交、未打 tag
> frontend-vue3 目录通过 .git/info/exclude 本地排除，保持 working tree clean
> Phase 2-B 改动已在本分支提交；临时文档保存在 stash@{21}（phase2b-artifacts-wip）
> 旧前端：`frontend-legacy-vue2`（保留，未改动，作为回滚基线）
> 新前端：`frontend-vue3`

---

## 1. 迁移目标

将旧 Vue2 前端（webpack 3 + Vue 2.5 + Element-UI + Vuex）完整迁移到 Vue3 技术栈，并新增一个流式 Agent 对话框 UI。

迁移原则：不破坏旧 Vue2 目录、先建新目录、API 继续走 `/api` 前缀、不修改后端、不修改数据库、不实现真实 Agent 后端。

## 2. 新目录结构

```
frontend-vue3/
  .nvmrc                      # Node 20
  package.json                # Vite + Vue3 + TS + Element Plus + Pinia
  vite.config.ts              # dev 端口 8081，proxy /api -> 127.0.0.1:9090（去掉 /api）
  tsconfig.json
  tsconfig.node.json
  index.html
  .env.development            # VITE_PROXY_TARGET / VITE_AGENT_CHAT_MOCK=true
  .env.production
  .gitignore
  src/
    main.ts                   # 入口：Pinia + Router + Element Plus + 全局 Agent 按钮
    App.vue
    env.d.ts
    styles/global.css
    utils/
      auth.ts                 # token cookie：Admin-Token-HRM（兼容旧前端）
      permission.ts           # hasPermission / hasPermissionPoint
    api/
      request.ts              # axios 实例 + 拦截器 + createAPI/createFormAPI/createDownload
      auth.ts                 # login / profile / logout 聚合
      base/
        frame.ts              # /sys/login /sys/profile /frame/logout 等
        users.ts              # /sys/user CRUD
        role.ts               # /sys/role CRUD
        permissions.ts        # /sys/permission CRUD
        menus.ts              # /base/menus CRUD
        dept.ts               # /company/department + /cfg/* 考勤请假配置
        employees.ts          # /employees 全套
        saasClient.ts         # /company 企业
        baseApi.ts            # /system/upfile /sys/city
      hrm/
        socialSecuritys.ts    # /social_securitys 全套
        attendances.ts        # /attendances 全套
        salarysApi.ts         # /salarys 全套
        approvalsApi.ts       # /user/process/* + /approvals/*
        usersApi.ts           # /user 自助
        noticesApi.ts         # /notices
    stores/
      auth.ts                 # Pinia：token / user / roles / menus / permissions
      app.ts                  # Pinia：sidebar / language
      permission.ts           # Pinia：基于 roles 生成路由
    router/
      index.ts                # 路由 + 守卫（白名单 / 拉取 profile / 生成路由）
      routes.ts               # 静态路由 + 异步业务路由
    layouts/
      default.vue             # 主布局（aside + header + main）
      components/
        Sidebar.vue           # 侧边菜单（由 permission.routes 驱动）
        Navbar.vue            # 顶部栏（折叠 + 用户下拉 + 退出）
        Breadcrumb.vue
        AppMain.vue           # keep-alive router-view
    components/
      PagePlaceholder.vue     # 骨架页占位组件（TODO + API 清单）
    views/
      login/index.vue
      dashboard/index.vue
      error/401.vue error/404.vue
      company/    departments.vue saas-clients.vue saas-client-detail.vue settings.vue
      system/     users.vue roles.vue permissions.vue
      employees/  index.vue detail.vue import.vue
      social/     index.vue list.vue detail.vue
      attendance/ index.vue archiving.vue report.vue
      salary/     index.vue list.vue detail.vue setting.vue
      approvals/  index.vue approval-detail.vue
    features/
      agent-chat/
        types.ts              # 消息类型 + mock 开关 + endpoint 解析
        markdown.ts           # markdown-it + DOMPurify（XSS 防护）
        api.ts                # fetch + ReadableStream 流式请求
        mock.ts               # mockStreamChat 本地模拟流式
        useChat.ts            # 对话状态 composable
        AgentChatDialog.vue   # 对话框 UI
        AgentChatPage.vue     # /agent/chat 页面入口
        AgentChatButton.vue   # 全局悬浮按钮 + 面板
        index.ts              # registerAgentChatGlobal
```

## 3. 旧 Vue2 与新 Vue3 对照表

| 能力 | 旧 Vue2 | 新 Vue3 |
|---|---|---|
| 构建工具 | webpack 3 | Vite 5 |
| 框架 | Vue 2.5 | Vue 3.5 |
| 路由 | vue-router 3 | vue-router 4 |
| 状态管理 | Vuex 3（仅 5 个核心模块实际注册） | Pinia 2（auth / app / permission） |
| UI 库 | Element-UI 2 | Element Plus 2.8 |
| HTTP | axios 0.18 | axios 1.7 |
| token 存储 | js-cookie `Admin-Token-HRM` | js-cookie `Admin-Token-HRM`（同名兼容） |
| 请求头 | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` |
| 成功码 | `10000` | `10000` |
| dev 端口 | 8080 | 8081（不冲突） |
| 代理 | `/api -> 9090` 去前缀 | `/api -> 9090` 去前缀 |
| 语言 | i18n（vue-i18n 7） | Element Plus zh-cn locale |
| Markdown | 无 | markdown-it + DOMPurify（Agent 用） |

## 4. 已完成页面（接真实 API）

| 页面 | 路由 | 说明 |
|---|---|---|
| 登录 | `/login` | POST /sys/login，保存 sessionId |
| 首页 Dashboard | `/dashboard` | 展示用户/菜单/权限统计 |
| 组织架构 | `/departments/index` | 部门树 CRUD，接 /company/department |
| SAAS 企业列表 | `/saas-clients/index` | 接 /company |
| 企业详情 | `/saas-clients/details/:id` | 接 /company/:id |
| 系统用户 | `/sys-users/index` | CRUD，接 /sys/user |
| 角色管理 | `/sys-roles/index` | CRUD，接 /sys/role |
| 员工列表 | `/employees/index` | 接 /employees |
| 社保主页 | `/social-securitys/index` | 骨架 + 实时列表，接 /social_securitys/list |
| 考勤主页 | `/attendances/index` | 骨架 + 实时列表，接 /attendances/:month |
| Agent 对话页 | `/agent/chat` | 全页对话，Mock 流式 |
| 404 / 401 | `/404` `/401` | 错误页 |

## 5. 骨架化页面（PagePlaceholder，API 已封装，待完整迁移）

| 页面 | 路由 | 已封装 API |
|---|---|---|
| 公司设置 | `/settings/index` | /sys/role |
| 权限设置 | `/sys-permissions/index` | /sys/permission, /base/menus |
| 员工详情 | `/employees/details/:id` | /employees/:id/* |
| 员工导入 | `/employees/import` | /employees/export, /employees/import |
| 社保列表(详细) | `/social-securitys/list` | /social_securitys/list |
| 社保个人详情 | `/social-securitys/detail/:id` | /social_securitys/:userId |
| 考勤归档 | `/attendances/archiving` | /attendances/reports/year |
| 考勤报表 | `/attendances/report` | /attendances/reports |
| 工资主页 | `/salarys/index` | /salarys/* |
| 工资列表 | `/salarys/list` | /salarys/list |
| 工资详情 | `/salarys/details/:yearMonth/:id` | /salarys/modify/:userId |
| 工资设置 | `/salarys/setting` | /salarys/settings |
| 审批主页 | `/approvals/index` | /user/process/* |
| 审批详情 | `/approvals/approval/:id` | /user/process/instance/:id |

## 6. API 迁移说明

- 全部 API 调用走 `/api` 前缀（`baseURL = VITE_API_BASE_URL = /api`），不写死 9090。
- Vite dev proxy 将 `/api` 转发到 `http://127.0.0.1:9090` 并去掉 `/api` 前缀，与旧前端行为一致。
- `request.ts` 拦截器：请求自动注入 `Authorization: Bearer <sessionId>`；响应按 `code` 判断，成功码 `10000`，token 失效码 `50008/50012/50014` 触发登出。
- 保留 `createAPI`（JSON）/ `createFormAPI`（urlencoded）/ `createDownload`（blob）三类助手，对应旧 `createAPI/createFormAPI/createFileAPI/createDown`。
- 后端接口协议未做任何改动。
- 旧前端若干接口存在字面量 `:id`/`:month` 未替换的 bug，Vue3 封装中已修正为模板字符串插值。

## 7. 登录与权限链路说明

1. 登录页提交 `mobile + password` → `POST /sys/login`，返回 Shiro sessionId。
2. sessionId 写入 cookie `Admin-Token-HRM`（与旧前端同名，互通）。
3. 路由守卫：有 token 且未加载角色 → `POST /sys/profile` 拉取 `{ user, roles: { menus, points } }`。
4. `permission` store 根据 `roles.menus` 过滤 `asyncRoutes`，`router.addRoute` 动态注册。
5. 菜单由 `permission.routes` + dashboard 壳路由驱动渲染。
6. 退出：调用 `POST /frame/logout`（失败则前端清 token）→ 重置路由 → 跳登录页。
7. 白名单：`/login`、`/401`、`/404`。

## 8. Agent 流式对话框说明

- 入口：页面 `/agent/chat` + 全局右下角悬浮按钮（`AgentChatButton`，挂载在 body，所有页面可见）。
- 网络层 `api.ts`：`POST /api/agent/chat/stream`，使用 `fetch + ReadableStream` 读取流式响应，按行解析（兼容 JSON `{type,content}` 与纯文本与 SSE `data:` 前缀）。
- 停止生成：`AbortController.abort()`，中断 fetch 与流读取。
- UI 能力：多轮消息列表、流式打字光标、停止生成、清空会话、复制回答、错误提示、loading 状态、Mock 模式标签。
- 系统提示：Mock 模式下显示“当前 Agent UI 仅为前端演示，不具备真实业务 Tool 调用能力。”
- Markdown 渲染：`markdown-it`（`html:false`，不透传原始 HTML）+ `DOMPurify`（白名单标签/属性，禁用 script/iframe/form 等），防 XSS。

## 9. Mock 模式说明

- 环境变量 `VITE_AGENT_CHAT_MOCK=true` 时启用本地 mock，不发起真实请求。
- `mock.ts` 的 `mockStreamChat()` 逐 token 分片输出预设回复，支持 `AbortSignal` 停止。
- 后端流式接口就绪后，将 `.env.development` 的 `VITE_AGENT_CHAT_MOCK` 改为 `false` 即可切换到真实 `POST /api/agent/chat/stream`。
- 当前后端未实现 Agent 服务，默认 Mock，不阻塞前端构建与演示。

## 10. 如何启动 Vue3 前端

```bash
cd frontend-vue3
nvm use 20          # .nvmrc 指定 Node 20
npm install
npm run dev         # http://127.0.0.1:8081
```

> 构建验证：`npm run build`（vite build）通过；`npm run typecheck`（vue-tsc --noEmit）通过。
> WSL 环境无 Node 时，可在 Windows 侧用 Node 18+/20+ 构建；node_modules 已 gitignore。

## 11. 如何回滚到 Vue2

- 旧前端 `frontend-legacy-vue2` 完整保留，未做任何改动。
- 回滚：直接使用 `frontend-legacy-vue2`（`npm run dev`，端口 8080）。
- Vue3 目录 `frontend-vue3` 为新增，删除即可完全回滚，不影响后端与旧前端。
- 如需恢复 Phase 2-B 的 stash：`git stash pop stash@{0}`（名为 `phase2b-artifacts-wip`）。

## 12. 未完成事项

- 员工详情多 Tab 表单（个人/岗位/转正/调岗 + 图片上传）尚未迁移，仅骨架。
- 权限设置菜单树、公司设置角色列表尚未迁移，仅骨架。
- 社保/考勤/薪资的归档与月报表（xlsx 导出）尚未迁移，仅骨架（属敏感导出能力）。
- 审批各类流程表单与 BPMN 流程部署上传尚未迁移，仅骨架。
- 旧前端 echarts dashboard 图表未迁移（dashboard 暂用统计卡片替代）。
- i18n 多语言未迁移（当前固定 zh-cn）。
- 真实 Agent 后端流式接口未实现（按约束，仅前端 + Mock）。
- 单元测试 / e2e 测试未新增（旧前端测试为 jest+nightwatch 脚手架，未迁移）。

## 13. 不允许 Agent 调用的敏感能力清单

Agent 对话框严格不调用以下接口（仅做对话输入/流式展示/停止/清空/复制）：

- 薪资：`/salarys/*`（列表/详情/修改/归档/导出/设置）
- 社保：`/social_securitys/*`（列表/详情/归档/导出/导入）
- 考勤：`/attendances/*`（列表/修改/归档/报表/导出）
- 审批：`/approvals/*` 与 `/user/process/*`（流程提交/审批/部署）
- 权限：`/sys/permission`、`/base/menus`、`/sys/role/assignPrem`
- 用户管理：`/sys/user` 增删改
- 导入：`/employees/import`、`/social_securitys/import`、`/approvals/import`
- 导出：所有 `*/export`、`createDownload` 类接口
- 上传：`/system/upfile`、`/sys/user/upload`、`/frame/facelogin/checkFace`
- 不直接查数据库，不输出完整 Authorization，不保存敏感 token 到日志。
