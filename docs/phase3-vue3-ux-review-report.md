# Phase 3-A：Vue3 前端只读复核与运行体验检查报告

> 本报告为纯只读复核产物。除本报告自身外，未修改任何业务代码、后端、数据库、旧 Vue2 前端；未提交、未打 tag、未启动或停止后端服务（仅临时启动/停止 Vue3 dev server 做本地运行验证）。

## 1. 当前分支

- 仓库路径：`/home/linux/projects/ihrm-agent-saas`（唯一正确仓库，未读取 `/mnt/d` 旧副本）
- 当前分支：`phase3-vue3-ux-review`
- 基线 tag：`integration-b2-vue3-ok`（`integration-b2-vue3` 同一指向）
- working tree 状态：**CLEAN**（`git status --short` 无输出）

## 2. 当前 commit

- HEAD：`10197aa4`（`phase3-vue3-ux-review` / `integration-b2-vue3-ok` / `integration-b2-vue3` 共指）
- 提交信息：`docs: verify integration of phase2b and vue3 frontend`
- 其下：`657e4180`（merge: integrate phase2b tenant fix and vue3 frontend）、`65bbcdca`（feat: add vue3 frontend with agent chat mock stream）
- 自 `integration-b2-vue3-ok` 至 HEAD 无代码改动（`git diff --stat` 为空），HEAD 即基线。
- 后端 Java、`frontend-legacy-vue2` 自基线起 0 改动。
- 现场存在一处环境观察（非前端缺陷）：dev 代理 `/api/sys/profile` 经转发后由 `127.0.0.1:9090` 返回 `302 → http://10.255.255.254:9002/autherror?code=1` 并下发 `JSESSIONID`，说明 9090 上已有具备认证过滤的服务在运行（未由本项目启动/停止），对未携带凭证的探针请求做认证拦截，属预期行为。

## 3. Vue3 目录结构检查

- 根配置：`package.json`、`vite.config.ts`、`tsconfig.json`、`tsconfig.node.json`、`index.html`、`.nvmrc`（==20）、`.env.development`、`.env.production`、`package-lock.json`（已跟踪）；`node_modules/` 已被 git 忽略。
- `src/` 结构（共 69 文件）：
  - 入口：`main.ts`、`App.vue`、`env.d.ts`、`styles/global.css`
  - `router/`：`index.ts`（守卫 + matcher 重置）、`routes.ts`（constant + async 路由）
  - `stores/`：`auth.ts`、`permission.ts`、`app.ts`（Pinia）
  - `api/`：`request.ts`（axios 实例 + `createAPI`/`createFormAPI`/`createDownload`）、`auth.ts`、`base/{frame,users,role,permissions,menus,dept,employees,saasClient,baseApi}.ts`、`hrm/{socialSecuritys,attendances,salarysApi,approvalsApi,usersApi,noticesApi}.ts`
  - `features/agent-chat/`：9 文件（见第 9 节）
  - `layouts/`：`default.vue` + `components/{Sidebar,Navbar,Breadcrumb,AppMain}.vue`
  - `components/PagePlaceholder.vue`
  - `utils/`：`auth.ts`（cookie token，key `Admin-Token-HRM`）、`permission.ts`
  - `views/`：26 个视图文件
- 文档交叉核对：`docs/integration-b2-vue3-report.md`、`docs/vue3-migration-agent-chat-report.md` 均存在，结论与本复核一致。

## 4. 构建/typecheck 结果

环境：Node `v20.20.2` / npm `10.8.2`（WSL 内 nvm）。

| 步骤 | 结果 |
| --- | --- |
| `npm install` | 通过（`up to date in 566ms`，`INSTALL_EXIT=0`） |
| `npm run build` | 通过（`✓ built in 3.52s`，`BUILD_EXIT=0`） |
| `npm run typecheck` | 通过（`vue-tsc --noEmit`，`TYPECHECK_EXIT=0`，0 错误） |
| `npm run lint` | 不适用——`package.json` 未定义 `lint` 脚本 |

构建后 `git status --short` 仍为空（`package-lock.json` 未被改动，无新增 tracked 文件）。

构建产物体积提示（非错误）：主 chunk `index-O1WMYOa7.js` ≈ 1381.8 kB（gzip 467.46 kB），源于 Element Plus 与 `@element-plus/icons-vue` 全量全局注册（见第 11 节 P6）。

## 5. 运行检查结果

- dev server 启动命令：`npm run dev -- --host 127.0.0.1 --port 8081`
- `vite.config.ts` 已固定 `host: 127.0.0.1`、`port: 8081`、`strictPort: true`。
- 启动结果：`VITE v5.4.21 ready in 145 ms`，`Local: http://127.0.0.1:8081/`。
- `curl -i http://127.0.0.1:8081` → `HTTP/1.1 200 OK`，正确返回注入 `/@vite/client` 的 `index.html`（`<title>IHRM 管理系统 - Vue3</title>`）。
- 代理验证：`curl /api/sys/profile` → `302 → 10.255.255.254:9002/autherror?code=1` + `JSESSIONID`，证明 `/api` 已被转发并由后端认证过滤拦截（见第 2、6 节）。
- 验证结束后已 `kill` dev 进程并 `pkill -f vite`，确认 `8081` 端口已释放、无残留 vite 进程；git tree 仍 clean。本步骤未启动/停止任何后端服务。

## 6. 代理配置检查

`frontend-vue3/vite.config.ts`：
- `/api` → `target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:9090'`，`changeOrigin: true`
- `rewrite: (path) => path.replace(/^\/api/, '')`（正确剥离 `/api` 前缀）
- 实测转发生效（见第 5 节）

环境变量（`.env.development` / `.env.production`）：
- `VITE_PROXY_TARGET=http://127.0.0.1:9090`（仅 dev）
- `VITE_API_BASE_URL=/api`
- `VITE_AGENT_CHAT_ENDPOINT=/agent/chat/stream`
- `VITE_AGENT_CHAT_MOCK=true`（dev 与 prod 均为 mock）

业务代码绑定检查（`grep "127.0.0.1:9090\|/api\|agent/chat/stream"`）：
- `127.0.0.1:9090` 仅出现在 `vite.config.ts` 与 `.env.development`，**未**硬编码进 `src/`。
- 业务 API 全部经 `request.ts` 的 `baseURL=VITE_API_BASE_URL||'/api'`，未写死 9090。
- Agent 流式仅在 `types.ts`（`agentChatEndpoint` → `/api/agent/chat/stream`）与 `mock.ts`（说明文案）出现，无旁路硬编码。

## 7. 页面迁移完成度

路由清单（`router/routes.ts`）：
- 常驻路由（constantRoutes）：`/login`、`/401`、`/404`、`/`（→`/dashboard`）、`/agent/chat`
- 异步路由（asyncRoutes，按角色过滤）：`/departments`、`/saas-clients`(+`details/:id`)、`/settings`、`/sys-users`、`/sys-roles`、`/sys-permissions`、`/employees`(+`details/:id`、`import`)、`/social-securitys`(+`list`、`detail/:id`)、`/attendances`(+`archiving`、`report`)、`/salarys`(+`list`、`details/:yearMonth/:id`、`setting`)、`/approvals`(+`approval/:id`)、通配 `/:pathMatch(.*)*`→`/404`

页面分类（26 视图文件）：

**A. 已接真实接口且功能完整（8）**
- `login/index.vue` — `/sys/login` + token 写 cookie
- `dashboard/index.vue` — 读取 auth store 展示用户/权限计数
- `company/departments.vue` — 组织架构 CRUD（`/sys/dept`）
- `company/saas-clients.vue` — SAAS 企业列表（`/sys/clients`）
- `company/saas-client-detail.vue` — 企业详情
- `system/users.vue` — 用户 CRUD（`/sys/user`）
- `system/roles.vue` — 角色 CRUD（`/sys/role`）；**注：权限分配树为骨架**（页面内 `el-alert` 标注）
- `employees/index.vue` — 员工列表（`/sys/user/...`）

**B. 混合页（骨架横幅 + 实时列表接口，2）**
- `social/index.vue` — PagePlaceholder + 实时 `/social_securitys/list`
- `attendance/index.vue` — PagePlaceholder + 实时 `/attendances/{month}`

**C. 纯骨架页（PagePlaceholder 占位 + 已封装 API，14）** — 详见第 8 节

**D. 静态错误页（2）**：`error/401.vue`、`error/404.vue`

API 模块清单（已封装，供骨架页后续接入）：base 下 `frame/users/role/permissions/menus/dept/employees/saasClient/baseApi`；hrm 下 `socialSecuritys/attendances/salarysApi/approvalsApi/usersApi/noticesApi`。

## 8. 骨架页面清单

纯骨架（14，仅 `PagePlaceholder`，未渲染真实业务数据）：
1. `company/settings.vue`（公司设置）
2. `system/permissions.vue`（权限设置）
3. `employees/detail.vue`（员工详情多 Tab）
4. `employees/import.vue`（Excel 模板下载 + 上传导入）
5. `social/list.vue`、`social/detail.vue`
6. `attendance/archiving.vue`、`attendance/report.vue`（含 xlsx 导出）
7. `salary/index.vue`、`salary/list.vue`、`salary/detail.vue`、`salary/setting.vue`
8. `approvals/index.vue`、`approvals/approval-detail.vue`

外加 1 处部分骨架：`system/roles.vue` 的权限点分配树（角色 CRUD 本身已接真实接口）。

## 9. Agent Chat 功能检查

组件清单（`src/features/agent-chat/`，9 文件）：
- `types.ts` — `ChatRole`/`ChatMessage`/`ChatStreamOptions`/`StreamEvent`；`isMockMode()`、`agentChatEndpoint()`
- `api.ts` — `streamChat()`：`fetch` + `ReadableStream` reader + `AbortController` 中止 + SSE/JSON 双协议解析（`parseEvent` 支持 `data:`/`[DONE]`/`{type}`）
- `mock.ts` — `mockStreamChat()`：本地 token 流，24ms/帧，监听 abort
- `useChat.ts` — composable：`send/stop/clear/copyAnswer`，消息流式追加，多轮历史组装
- `markdown.ts` — `renderMarkdownSafe()`：`markdown-it`(`html:false`)+`DOMPurify` 净化（见第 10 节）
- `AgentChatDialog.vue` — 对话主体（输入/流式光标/停止/清空/复制/错误提示/Mock 横幅）
- `AgentChatPage.vue` — 路由页（page 模式）
- `AgentChatButton.vue` — 全局悬浮 FAB + 弹层（含 `aria-label`）
- `index.ts` — 全局挂载（独立子 app）+ 命名导出

功能完成度（对照要求）：输入对话、流式展示、停止生成、清空会话、复制回答、错误提示——**全部具备**；回车发送 / Shift+Enter 换行；Mock 模式横幅显著提示「不具备真实业务 Tool 调用能力」。默认 `VITE_AGENT_CHAT_MOCK=true`，真实接口就绪后置 `false` 即切 `POST /api/agent/chat/stream`。

## 10. Agent Chat 安全边界检查

- 敏感接口调用检查：`grep "salary|social_securitys|attendance|audit|permission|role|upload|export|import|sys/user|sys/role|sys/permission"` 在 `features/agent-chat/` 内仅匹配到 `msg.role`、`import` 语句、`User` 图标等非业务字面量——**未发现**对薪资/社保/考勤/审批/权限/上传/导入/导出的直接调用。
- 唯一网络出口：`mockStreamChat`（本地）或 `streamChat` → `agentChatEndpoint()` = `/api/agent/chat/stream`。**无数据库访问、无旁路业务 API**。
- Token 处理：`streamChat` 仅在非 mock 时附加 `Authorization: Bearer ${token}`；`features/agent-chat/` 内 `console.*` 全无（**未记录**任何 token/Authorization/明文凭证）。
- XSS 防护：`markdown.ts` `html:false` 关闭内联 HTML，`DOMPurify.sanitize` 使用 `ALLOWED_TAGS/ALLOWED_ATTR` 白名单 + `FORBID_TAGS:[script,style,iframe,form,input,object,embed]` + `FORBID_ATTR:[onerror,onload,onclick,onmouseover]` + `ALLOW_DATA_ATTR:false`；`v-html` 仅作用于净化后字符串。**满足 XSS 防护要求**。
- 其它业务 API 模块（`src/api/hrm/*`、`src/api/base/*`）属 Vue3 渐进迁移页面范围，非 Agent Chat 调用，不构成越界。

结论：Agent Chat 安全边界**合规**，未发现敏感接口直连或越权风险。

## 11. 发现的问题

| ID | 严重度 | 类别 | 描述 | 位置 |
| --- | --- | --- | --- | --- |
| P1 | 中 | 权限/UX | 菜单过滤在 `roles.menus` 为空时降级为「全部可见」。`hasPermission` 仅在 `route.name && roles.menus && roles.menus.length` 时做严格匹配，否则 `return true`；空菜单用户将看到全部异步路由（实际数据仍受后端 API 权限约束，但 UI 菜单结构泄露） | `utils/permission.ts:6-12`、`stores/permission.ts:11-24` |
| P2 | 中 | 安全/UX | 登录页源码硬编码默认凭证 `mobile:<redacted-mobile> / password:<redacted-password>` 且未按 dev/prod 区分，prod 构建同样预填 | `views/login/index.vue:63-66` |
| P3 | 低 | 路由一致性 | 强制登出 `fedLogout()`（profile 拉取失败/token 失效）仅置 `routesGenerated=false`，未调用 `resetRouter()` 重置 matcher；此前动态路由残留在 matcher 直至刷新。侧边栏因取自 `permissionStore.routes`（重新赋值）正确，但残留路由仍可被直接解析。正常退出路径（Navbar）已正确调用 `resetRouter()` | `router/index.ts:32-34`、`stores/auth.ts:74-76` |
| P4 | 低-中 | 性能/UX | 主 chunk ≈ 1381.8 kB（gzip 467 kB）。`main.ts` 全量 `app.component` 注册所有 `@element-plus/icons-vue` 图标，且 Element Plus 整包引入，未做按需/自动导入与图标 tree-shaking，首屏加载偏重 | `main.ts:15-17`、`package.json` 依赖 |
| P5 | 低 | UX | 混合页（`social/index`、`attendance/index`）`catch {}` 静默吞错，空数据与接口错误在表格层无差异区分（仅依赖拦截器 `ElMessage` 提示） | `views/social/index.vue:21`、`views/attendance/index.vue:22-23` |
| P6 | 低 | 安全加固 | Markdown 外链未强制 `target=_blank`+`rel="noopener noreferrer"`，`linkify:true` 自动链接在同标签打开，存在轻微反向 tabnabbing 面与体验问题 | `features/agent-chat/markdown.ts:4` |
| P7 | 低 | 工程规范 | 无 `lint` 脚本与 ESLint/Prettier 配置，仅 `typecheck` 守门，代码风格未自动化约束 | `package.json` |
| P8 | 信息 | 工程 | `resetRouter()` 使用非公开 API `(router as any).matcher = (newRouter as any).matcher`，vue-router 升级存在兼容风险（当前 4.4.5 可用） | `router/index.ts:55-62` |
| P9 | 信息 | UX | 全局悬浮 Agent 与 `/agent/chat` 路由页为两个独立 Vue app/composable 实例，消息历史互不共享（设计如此，非缺陷） | `features/agent-chat/index.ts`、`useChat.ts` |

未发现：后端 Java 改动、数据库改动、旧 Vue2 改动、Agent Chat 敏感接口调用、明文 token/凭证日志记录。

## 12. 建议修复优先级

1. **P1（建议优先）**：收敛 `hasPermission` 空菜单语义——空 `roles.menus` 应视为「无权限」而非「全放行」，避免 UI 菜单越权暴露。
2. **P2（建议优先）**：登录默认凭证改为 dev 专属（如 `import.meta.env.DEV` 判定）或留空，prod 构建不预填。
3. **P3**：`fedLogout()` 路径补 `resetRouter()` 调用，与 Navbar 退出行为对齐。
4. **P4**：引入 `unplugin-vue-components` + `unplugin-auto-import` 对 Element Plus 与图标按需导入，降低首屏体积。
5. **P5–P8**：补错误态/空态区分、外链 `rel`、新增 ESLint+Prettier、评估 matcher 重置的官方替代写法——按迭代推进。
6. **骨架页（第 8 节）**：按业务优先级逐页迁移接入已封装 API（建议顺序：员工详情多 Tab → 权限菜单树 →社保/考勤/工资详情与导出 → 审批流）。

## 13. 是否建议进入 Phase 3-B 前端细化修复

**建议进入 Phase 3-B**，聚焦前端细化修复，范围建议限定为：P1（权限降级语义）、P2（登录默认凭证）、P3（fedLogout 路由重置）三项安全/一致性修复 + P4 首屏体积优化，并按需迁移高优先级骨架页。Phase 3-B 仍应遵守：不动后端 Java、不动数据库、不动旧 Vue2、不做真实 Agent 后端、不提交/不打 tag（除非另行授权）。

---

## 复核最终结论

1. 是否完成只读复核：**是**
2. 报告路径：`docs/phase3-vue3-ux-review-report.md`
3. build 是否通过：**是**（`vite build` 3.52s，0 错误）
4. typecheck 是否通过：**是**（`vue-tsc --noEmit`，0 错误）
5. dev server 是否能启动：**是**（8081 端口 HTTP 200；验证后已停止并释放端口）
6. 是否发现后端改动：**否**（自基线 0 改动）
7. 是否发现旧 Vue2 改动：**否**（自基线 0 改动）
8. 是否发现 Agent Chat 敏感接口调用：**否**
9. 是否建议进入 Phase 3-B：**是**（见第 13 节）
10. 是否修改了除报告外的任何文件：**否**（仅新增本报告；构建/运行产物在 git 忽略范围内，`git status --short` 复核后为空）
