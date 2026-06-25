# Phase 3-B：Vue3 前端小修复报告

> 本轮仅修改 `frontend-vue3/` 内文件与本报告；未修改 `backend-legacy/`、`database/`、`frontend-legacy-vue2/`；未提交、未打 tag、未做 Agent 后端 / PostgreSQL / Gateway 认证 / 权限注解修复。

## 1. 当前分支

- 仓库路径：`/home/linux/projects/ihrm-agent-saas`（唯一正确仓库，未读取 `/mnt/d` 旧副本）
- 当前分支：`phase3b-vue3-frontend-polish`
- 起点：从 `integration-b2-vue3-ok` / `phase3-vue3-agent-chat` 指向的 HEAD `10197aa4` 创建分支（`git checkout -b`，**无 commit、无 tag**）
- 基线 HEAD：`10197aa4`（创建分支后 HEAD 未变，未产生新提交）
- working tree：含本轮 5 个已修改文件 + 1 个新增 `.env.example`（均为 `frontend-vue3/` 内，允许范围），以及上一轮 Phase 3-A 遗留的未跟踪报告 `docs/phase3-vue3-ux-review-report.md`（本轮未修改）

## 2. 修复范围

仅 Phase 3-A 报告中标注的 P1/P2/P3 三项，未触碰 P4–P8：

- P1 → Fix A：`hasPermission` 空 `roles.menus` 全放行 → deny-by-default
- P2 → Fix B：登录页硬编码默认凭证 → env 驱动、默认留空
- P3 → Fix C：`fedLogout()` 未重置动态路由 → 调用 `resetRouter()`

## 3. hasPermission 修复说明（Fix A / P1）

- 文件：`frontend-vue3/src/utils/permission.ts`
- 问题：原实现在 `route.name && roles.menus && roles.menus.length` 不满足时 `return true`，导致空菜单用户在 UI 上看到全部异步路由（菜单结构越权暴露）。
- 根因核对：读取旧 Vue2 `frontend-legacy-vue2/src/utils/permission.js`（只读，未改）确认原始语义即 deny-by-default（`else { return false }`），Vue3 迁移时误改为 `return true`，属回归。
- 后端语义核对：只读 `backend-legacy/.../ProfileResult.java`，确认 `roles.menus` 为 `type==1` 菜单权限 `code` 集合，**后端不下发 `*` 通配符**；超级管理员通过被授予全部菜单 code 实现，无需前端特例。
- 修复后行为（deny-by-default）：
  - `roles.menus` 为空 / undefined / 非数组 → `return false`
  - 路由无 `name` → `return false`
  - 仅当 `route.name` 在 `roles.menus` 中明确匹配（大小写不敏感）→ `return true`
  - `hasPermissionPoint` 同步收敛为 `Array.isArray` 守卫 + deny-by-default
- 注释：按 P1 修复要求明确写入「前端权限仅用于 UI 展示，不替代后端 RBAC」。
- 影响面：仅 `stores/permission.ts:16` 调用 `hasPermission`；`hasPermissionPoint` 当前无调用方。修复仅改变空菜单分支（`true→false`），对非空菜单用户的精确匹配逻辑无影响，不引入新的锁出风险。
- 超级管理员：由 `filterAsyncRoutes` 中 `meta.roles?.includes('*')` 的路由级通配（如 Agent 对话路由）与「后端授予全部菜单 code」共同保障，未受本修复影响。

## 4. 登录默认凭证修复说明（Fix B / P2）

- 文件：`frontend-vue3/src/views/login/index.vue`、`frontend-vue3/src/env.d.ts`、新增 `frontend-vue3/.env.example`
- 问题：原 `form` 硬编码 `mobile:'<redacted-mobile>'` / `password:'<redacted-password>'`，dev/prod 不分，prod 构建同样预填真实测试账号。
- 修复方式：
  - `login/index.vue`：`form` 初值改为 env 驱动。仅当 `VITE_USE_DEMO_LOGIN` 为 `'true'`/`'1'` 时，从 `VITE_DEMO_MOBILE` / `VITE_DEMO_PASSWORD` 读取；否则表单默认留空。源码中**不再出现任何真实账号 / 密码原文**。
  - `env.d.ts`：`ImportMetaEnv` 新增 `VITE_USE_DEMO_LOGIN / VITE_DEMO_MOBILE / VITE_DEMO_PASSWORD` 三个 `string` 类型声明，保证 `import.meta.env` 访问类型安全。
  - `.env.example`（新增）：仅占位值。`VITE_USE_DEMO_LOGIN=false`，`VITE_DEMO_MOBILE=`（空），`VITE_DEMO_PASSWORD=`（空），并附说明：真实演示账号请填入本地 gitignored 的 `.env.*.local`。
  - UI：当 demo 开启时在登录卡底部显示一行黄字提示「演示账号已预填（来自本地 env，仅限开发环境）」。
- env 文件策略核对：
  - `frontend-vue3/.gitignore` 含 `.env` / `.env.*` / `!.env.example`，故 `.env.development`、`.env.production`、`.env.local`、`.env.development.local` 均被忽略、未跟踪；`.env.example` 允许跟踪。
  - 本轮**未修改**已存在于磁盘（gitignored）的 `.env.development` / `.env.production`；未提交任何 `.env*` 文件。
  - 安全 grep 复核：`<redacted-mobile>|<redacted-password>|password.*123` 在 `frontend-vue3/src` 与 `frontend-vue3/.env*` 中**无真实凭证命中**，仅 `VITE_DEMO_PASSWORD` 变量名出现（无值）。

## 5. fedLogout / resetRouter 修复说明（Fix C / P3）

- 文件：`frontend-vue3/src/stores/auth.ts`、`frontend-vue3/src/router/index.ts`
- 问题：`fedLogout()`（token 失效 / profile 拉取失败时的前端强制登出）仅调用 `resetAuth()` 清理 auth store，未重置动态路由 matcher；`router/index.ts` 守卫 catch 块只手动置 `routesGenerated=false`，未清 permission store、未重建 matcher，残留动态路由仍可被直接解析。对比：正常登出路径（`Navbar.vue` 调 `logout()` 后显式 `resetRouter()`）是正确的。
- 修复方式：
  - `auth.ts`：新增 `import { resetRouter } from '@/router'`；`fedLogout()` 改为 `resetAuth()` 后调用 `resetRouter()`，使前端强制登出自包含：清理 token / 用户状态（`resetAuth`）+ 清理权限状态与重建 matcher（`resetRouter` → 内部 `resetRouterState` 置 `routesGenerated=false` 并 `permission.reset()`）。
  - `router/index.ts`：守卫 catch 块简化为仅 `auth.fedLogout()` + 重定向 `/login`，移除冗余的 `routesGenerated=false`（现由 `resetRouter` 负责），并加注释说明职责。
  - 登出路径不变：`logout()` 仍为 `resetAuth()`，`Navbar.vue` 登出后显式 `resetRouter()`（既有正确行为，未改）。
- 循环依赖处理：`auth.ts` ↔ `router/index.ts` 形成循环引用（router 导入 `useAuthStore`，auth 导入 `resetRouter`）。该循环在 ESM live binding + 仅运行时引用下安全：`resetRouter` 为 hoisted function declaration，`useAuthStore` 仅在 `beforeEach` 运行时调用。**已通过 build 与 typecheck 实测验证无运行期/类型错误**。
- 不重构原则：未改动路由表、未改动 matcher 重置的非公开 API 写法（`router.matcher = newRouter.matcher`，Phase 3-A P8 未在本轮范围）、未影响 `/login` 与 401/404（均属 constantRoutes/whiteList，重定向后正常解析，无回环）。

## 6. build / typecheck 结果

环境：Node `v20.20.2` / npm `10.8.2`（WSL nvm）。

| 步骤 | 结果 |
| --- | --- |
| `npm install` | 通过（`up to date in 577ms`，`INSTALL_EXIT=0`） |
| `npm run build` | 通过（`✓ built in 3.48s`，`BUILD_EXIT=0`） |
| `npm run typecheck` | 通过（`vue-tsc --noEmit`，`TYPECHECK_EXIT=0`，0 错误，含 auth↔router 循环依赖） |
| `npm run lint` | 不适用——`package.json` 未定义 `lint` 脚本 |

## 7. 安全边界检查结果

- 硬编码凭证：`grep "<redacted-mobile>\|<redacted-password>\|password.*123\|VITE_DEMO_PASSWORD"` 在 `frontend-vue3/src` 与 `frontend-vue3/.env*` 中**无真实账号/密码命中**；仅 `VITE_DEMO_PASSWORD` 变量名（无值）出现。
- `.env` 提交检查：`git ls-files frontend-vue3/ | grep '\.env'` 无输出——`.env.development`/`.env.production` 仍被忽略、未跟踪；仅 `.env.example` 为新增未跟踪文件（允许）。
- Agent Chat 敏感接口：`features/agent-chat/` 内未发现对薪资/社保/考勤/审批/权限/上传/导入/导出的直接调用；唯一网络出口仍为 `mockStreamChat` 或 `streamChat → /api/agent/chat/stream`。`src` 全量 grep 命中的 HRM 业务 API 模块（socialSecuritys/attendances/salarysApi/approvalsApi 等）属页面级迁移范围，非 Agent Chat 调用。
- 范围合规：`git status` 仅 5 个已修改（皆在 `frontend-vue3/src`）+ 1 个新增 `.env.example` + Phase 3-A 遗留报告；`backend-legacy`/`frontend-legacy-vue2`/`database` **0 改动**。

## 8. 未修复事项（不在本轮范围）

- P4 主 chunk 体积优化（≈1381.8 kB / gzip 467 kB）——需引入 `unplugin-vue-components` + `unplugin-auto-import` 对 Element Plus 与图标按需导入，属较大改动，本轮未做。
- P5 混合页 `catch {}` 静默吞错与空/错态区分。
- P6 Markdown 外链缺少 `target=_blank` + `rel="noopener noreferrer"`。
- P7 缺少 ESLint/Prettier 与 `lint` 脚本。
- P8 `resetRouter()` 使用非公开 `matcher` 赋值，vue-router 升级兼容风险。
- 第 8 节骨架页（员工详情、权限菜单树、社保/考勤/工资详情与 xlsx 导出、审批流等）迁移——按业务优先级后续推进。

## 9. 是否建议提交

**建议提交**，但本轮按约束**未提交、未打 tag**。建议后续提交内容：
- 修改文件：`frontend-vue3/src/utils/permission.ts`、`frontend-vue3/src/views/login/index.vue`、`frontend-vue3/src/env.d.ts`、`frontend-vue3/src/stores/auth.ts`、`frontend-vue3/src/router/index.ts`
- 新增文件：`frontend-vue3/.env.example`
- 建议提交信息（风格参考仓库 history）：`fix: vue3 frontend polish - deny-by-default perms, env-driven demo login, fedLogout router reset`
- 提交前注意：`docs/phase3-vue3-ux-review-report.md`（Phase 3-A 遗留）是否一并纳入由决策方决定；`.env.*`（含 `.env.development`/`.env.production`）保持忽略、不要 `git add`。

## 10. 最终结论

**Phase 3-B frontend polish: PASS**

三项修复（P1/P2/P3）全部完成；`npm run build` 与 `npm run typecheck` 均通过；无硬编码真实凭证；`.env` 未被提交；Agent Chat 未调用敏感接口；未改动后端 / 旧 Vue2 / 数据库；未提交、未打 tag。

---

## 最终输出

1. 是否完成修复：**是**
2. 修改文件清单：
   - `frontend-vue3/src/utils/permission.ts`（Fix A）
   - `frontend-vue3/src/views/login/index.vue`（Fix B）
   - `frontend-vue3/src/env.d.ts`（Fix B 类型声明）
   - `frontend-vue3/src/stores/auth.ts`（Fix C）
   - `frontend-vue3/src/router/index.ts`（Fix C）
   - `frontend-vue3/.env.example`（Fix B，新增）
3. 是否修改后端：**否**
4. 是否修改旧 Vue2：**否**
5. 是否修改数据库：**否**
6. npm build 是否通过：**是**（3.48s，0 错误）
7. typecheck 是否通过：**是**（`vue-tsc --noEmit`，0 错误）
8. 是否仍有硬编码真实默认密码：**否**（源码无 `<redacted-mobile>` / `<redacted-password>` / 任何密码原文）
9. Agent Chat 是否调用敏感接口：**否**
10. 报告路径：`docs/phase3b-vue3-frontend-polish-report.md`
11. 是否建议提交：**是**（建议提交，见第 9 节）
12. 是否已经提交：**否**（未提交、未打 tag）
