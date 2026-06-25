# Vue3 渐进式升级计划

> 结论状态：静态分析前端目录、路由、组件、API 和 Vuex 模块，未实际启动前端。  
> 前端根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版`。  
> 后端根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版`。

## 1. 当前 Vue2 技术栈

| 项 | 当前情况 | 依据文件路径 |
|---|---|---|
| 框架 | Vue 2.5.x | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json` |
| UI | Element UI 2.2.x | 同上 |
| 路由 | Vue Router 3.x | 同上；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\router\index.js` |
| 状态管理 | Vuex 3.x | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\store\index.js`；各 `src\module-*\store\index.js` |
| 构建 | Webpack 3、webpack-dev-server 2 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`；`build\webpack.*.conf.js` |
| HTTP | Axios 0.18 | `package.json`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\utils\request.js` |
| 认证头 | `Authorization: Bearer <token>` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\utils\request.js` |

## 2. 路由、页面、组件、API、Vuex 模块梳理

| 模块 | 路由文件 | Vuex 文件 | 页面/组件数量 | API 引用量 | 关键页面 | 迁移难度 | 风险原因 |
|---|---|---|---:|---:|---|---|---|
| `module-saas-clients` | `src\module-saas-clients\router\index.js` | `src\module-saas-clients\store\index.js` | 2 | 2 | `pages\index.vue`、`pages\detail.vue` | 低 | 页面少，业务相对独立；后端公司接口仍需租户校验。 |
| `module-departments` | `src\module-departments\router\index.js` | `src\module-departments\store\index.js` | 2 | 2 | `pages\index.vue`、`components\add.vue` | 低到中 | 部门 CRUD 含删除，第一阶段建议只迁移只读能力。 |
| `module-dashboard` | `src\module-dashboard\router\index.js` | `src\module-dashboard\store\*.js` | 21 | 9 | `pages\dashboard.vue`、`pages\layout.vue`、`pages\login.vue` | 中 | 共享布局和登录链路影响面大，静态页面可先迁移。 |
| `module-settings` | `src\module-settings\router\index.js` | `src\module-settings\store\index.js` | 2 | 2 | `pages\index.vue`、`components\role-list.vue` | 中到高 | 角色设置属于 RBAC，高风险写操作。 |
| `module-permissions` | `src\module-permissions\router\index.js` | `src\module-permissions\store\index.js` | 2 | 2 | `pages\index.vue`、`components\menu-list.vue` | 高 | 权限树和 API 权限敏感，不建议第一阶段写入。 |
| `module-users` | `src\module-users\router\index.js` | `src\module-users\store\index.js` | 17 | 24 | `pages\index.vue`、`pages\myInfo.vue`、审批申请相关页面 | 高 | 用户、个人信息、审批申请混杂，权限和 PII 风险高。 |
| `module-employees` | `src\module-employees\router\index.js` | `src\module-employees\store\index.js` | 24 | 47 | 员工列表、详情、导入、打印、归档 | 高 | 页面多，含个人信息、导入导出、PDF、归档。 |
| `module-attendances` | `src\module-attendances\router\index.js` | `src\module-attendances\store\index.js` | 8 | 23 | 考勤列表、报表、历史归档、配置 | 高 | 考勤数据和规则配置敏感，写操作影响薪资。 |
| `module-approvals` | `src\module-approvals\router\index.js` | `src\module-approvals\store\index.js` | 9 | 12 | 审批列表、流程、离职、加班、请假、薪资审批 | 极高 | 审批流写操作和流程状态极高风险。 |
| `module-salarys` | `src\module-salarys\router\index.js` | `src\module-salarys\store\index.js` | 8 | 13 | 薪资列表、调薪、历史归档、月报、设置 | 极高 | 薪资数据极敏感，不建议第一阶段迁移写入。 |
| `module-social-securitys` | `src\module-social-securitys\router\index.js` | `src\module-social-securitys\store\index.js` | 7 | 11 | 社保列表、详情、导入、归档、月报 | 极高 | 社保与公积金数据极敏感，含导入和归档。 |

模块目录依据：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\module-*`。API 文件依据：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\api`。

## 3. 第一阶段适合迁移的页面

| 页面 | 迁移建议 | 依据文件路径 | 说明 |
|---|---|---|---|
| SaaS 客户列表 | 优先迁移为 Vue3 只读页面 | `src\module-saas-clients\pages\index.vue`；`src\api\saas-clients.js` | 页面少，适合作为 Vue3 工程、代理、鉴权联调样板。 |
| SaaS 客户详情 | 优先迁移为 Vue3 只读页面 | `src\module-saas-clients\pages\detail.vue`；`src\api\saas-clients.js` | 只读详情可验证老 API 兼容。 |
| 部门列表 | 优先迁移只读视图，新增/编辑/删除延后 | `src\module-departments\pages\index.vue`；`src\api\departments.js` | 部门数据低敏，但写操作仍需 RBAC 和审计。 |
| Dashboard 首页 | 可迁移只读指标壳 | `src\module-dashboard\pages\dashboard.vue`；`src\api\dashboard.js` | 部分 dashboard API 后端证据不足，应先接静态或低风险数据。 |
| 我的信息 | 条件迁移 | `src\module-users\pages\myInfo.vue`；`src\api\users.js` | 只展示当前用户资料可以迁移；涉及修改或敏感字段时延后。 |

## 4. 不建议第一阶段迁移的页面

| 页面或模块 | 不建议原因 | 依据文件路径 |
|---|---|---|
| 薪资模块全部页面 | 薪资读写、归档、设置均为极高风险 | `src\module-salarys\**`；`ihrm_salarys\src\main\java\com\ihrm\salarys\controller\*.java` |
| 社保模块全部页面 | 社保、公积金、归档和导入为极高风险 | `src\module-social-securitys\**`；`ihrm_social_securitys\src\main\java\com\ihrm\social\controller\SocialSecurityController.java` |
| 审批模块 | 流程提交、处理、部署、挂起涉及状态变更 | `src\module-approvals\**`；`ihrm_audit\src\main\java\com\ihrm\audit\controller\ProcessController.java` |
| 员工导入、打印、归档、详情编辑 | PII、文件导入导出和人事状态变更风险高 | `src\module-employees\**`；`ihrm_employee\src\main\java\com\ihrm\employee\controller\EmployeeController.java` |
| 权限和角色设置 | 直接影响 RBAC | `src\module-permissions\**`；`src\module-settings\**`；`ihrm_system\src\main\java\com\ihrm\system\controller\PermissionController.java`；`RoleController.java` |
| 人脸登录 | 前端存在 API，后端 Controller 证据不足 | `src\api\base\faceLogin.js`；`ihrm_system\src\main\java\com\ihrm\system\ShiroConfiguration.java` |

## 5. 高风险能力依赖清单

| 高风险能力 | 相关前端路径 | 相关后端路径 |
|---|---|---|
| RBAC 权限 | `src\module-permissions`、`src\module-settings`、`src\utils\permission.js` | `ihrm_system\src\main\java\com\ihrm\system\controller\PermissionController.java`；`RoleController.java`；`ihrm_common\src\main\java\com\ihrm\common\shiro\realm\IhrmRealm.java` |
| 审批 | `src\module-approvals`、`src\api\approvals.js` | `ihrm_audit\src\main\java\com\ihrm\audit\controller\ProcessController.java` |
| 薪资 | `src\module-salarys`、`src\api\salarys.js` | `ihrm_salarys\src\main\java\com\ihrm\salarys\controller\*.java` |
| 社保 | `src\module-social-securitys`、`src\api\social-securitys.js` | `ihrm_social_securitys\src\main\java\com\ihrm\social\controller\SocialSecurityController.java` |
| 考勤 | `src\module-attendances`、`src\api\attendances.js` | `ihrm_attendance\src\main\java\com\ihrm\atte\controller\*.java` |
| 员工 PII | `src\module-employees`、`src\api\employees.js` | `ihrm_employee\src\main\java\com\ihrm\employee\controller\EmployeeController.java` |

## 6. Vue3 新前端与旧后端 API 并存方案

| 阶段 | 方案 | 依据文件路径 |
|---|---|---|
| 阶段 0 | 保留 Vue2 项目不动，新建 Vue3 项目独立运行，例如本地端口 5173；代理到旧网关 9090 | `config\index.js`；`ihrm_gate\src\main\resources\application.yml` |
| 阶段 1 | 迁移低风险只读页面，复用旧接口和旧 Session Header | `src\utils\request.js`；`ihrm_common\src\main\java\com\ihrm\common\shiro\session\CustomSessionManager.java` |
| 阶段 2 | 抽象 Vue3 API Adapter，按模块复制旧 `src\api\*.js` 的请求契约，不改 Java API | `src\api` 目录；后端各 Controller |
| 阶段 3 | 对高风险模块引入确认弹窗、审计日志、字段脱敏和后端权限补强后再迁移 | `ihrm_salarys`、`ihrm_social_securitys`、`ihrm_audit`、`ihrm_system` Controller |
| 阶段 4 | 逐步替换导航入口，Vue2 和 Vue3 在同一登录态下并存 | `src\router\index.js`；`src\utils\auth.js` |

技术建议：

| 建议 | 依据文件路径 |
|---|---|
| Vue3 使用 Vite、TypeScript、Pinia 或 Vuex 4 兼容层，先不要动旧 Webpack 3 工程。 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json` |
| API Adapter 保持返回结构兼容旧 `Result`，避免一开始改 Java 返回协议。 | 后端各 Controller 返回 `Result`，详见 `docs\api-inventory-for-agent.md` |
| 鉴权 Header 继续使用 `Authorization: Bearer <sessionId>`。 | `src\utils\request.js`；`CustomSessionManager.java` |
| 高风险写接口迁移前，先补后端权限注解或统一权限拦截。 | `UserController.java` 中仅扫描到少量明确权限注解；多数 Controller 证据不足 |

