# iHRM Agent SaaS

## 项目定位

iHRM Agent SaaS 是一个基于 Java + Vue 的前后端分离 SaaS 管理系统，聚焦企业 HRM 业务场景，包含组织架构、员工、薪资、社保、考勤、审批、权限与租户安全等模块。项目当前用于演示传统 Spring Cloud 后端的本地化部署、安全边界补强、Vue3 渐进式迁移，以及面向企业系统的 Agent Chat 前端实验。

## 当前进度

* **Vue2 → Vue3 前端迁移：已完成。** 新前端见 `frontend-vue3/`（Vue3 + Vite + TypeScript），`frontend-legacy-vue2/` 作为旧版参照保留。
* **JDK / 后端 Java 改造：已完成。** 本仓库 `backend-legacy/` 保留升级前的 Java 8 / Spring Boot 2.0.5 / Spring Cloud Finchley.SR1 基线作为参照；现代化后端模块单独维护【待确认是否并入本仓库】。
* **数据库 MySQL → PostgreSQL 迁移：进行中。** PostgreSQL 冒烟测试已跑通，当前正在进行完整的代码安全性审查；业务库当前仍以 MySQL 为基线，PG 尚未正式切换。
* **Agent 架构：设计中（Designing）。** 见下文与 [docs/agent-architecture.md](docs/agent-architecture.md)。

## 现有系统架构

* 后端（升级前基线，`backend-legacy/`）：Java 8 + Spring Boot 2.0.5 + Spring Cloud Finchley.SR1
* 前端：Vue3 + Vite + TypeScript（`frontend-vue3/`，迁移已完成）；Vue2 + Element UI + Webpack3 旧版保留（`frontend-legacy-vue2/`）
* 数据库：当前 MySQL `ihrm` 业务库 + Activiti `act` 工作流库；规划迁移至 PostgreSQL（冒烟测试已通过，安全审查进行中）
* 微服务架构：Eureka 注册中心 + Gateway 路由 + OpenFeign + Redis + MySQL（PG 迁移规划中）
* 权限与租户：Shiro Session、Gateway 认证边界、`companyId` 租户隔离、敏感接口收敛

## 目录结构

| 目录 | 作用 |
| --- | --- |
| `backend-legacy/` | Java / Spring Cloud 后端服务代码。 |
| `frontend-legacy-vue2/` | 保留的 Vue2 + Element UI + Webpack 前端。 |
| `frontend-vue3/` | Vue3 + Vite + TypeScript 新前端实验。 |
| `database/` | MySQL 初始化与业务数据脚本。 |
| `docs/` | 架构、数据库、权限、WSL2、Agent、Vue3 等分析报告。 |
| `scripts/` | 本地启动、验证与工程辅助脚本。 |
| `docker/` | 本地基础设施容器配置。 |
| `archive/` | 原始资料归档。 |

## 模块摘要

| 维度 | 说明 |
| --- | --- |
| 后端服务 | `ihrm_system`（用户/权限/角色/城市字典）、`ihrm_company`（组织/部门）、`ihrm_employee`、`ihrm_salarys`、`ihrm_social_securitys`、`ihrm_attendance`、`ihrm_audit`（Activiti 流程）、`ihrm_gate`（网关）、`ihrm_eureka`（注册中心） |
| 前端 | `frontend-vue3/`（Vue3 + Vite + TS，迁移已完成，含 Agent Chat 前端 mock stream 交互实验）；`frontend-legacy-vue2/`（旧版保留） |
| 数据库 / 迁移 | 当前 MySQL `ihrm` 业务库 + Activiti `act` 工作流库（初始化脚本见 `database/`）；**规划迁移至 PostgreSQL**：PG 冒烟测试已跑通，正在做完整代码安全性审查，尚未正式切换 |
| 权限 | Shiro Session + Gateway 认证边界，敏感接口收敛；现状见 [docs/rbac-auth-flow.md](docs/rbac-auth-flow.md) |
| 租户 | 以 `companyId` 区分租户，社保等模块租户过滤修复见 `docs/phase2b-social-security-tenant-fix-verification.md`；字段/租户审计见 `docs/database-field-and-tenant-audit.md` |
| 工程辅助 | WSL2 本地启动验证与脚本化检查（`scripts/`、`docs/phase1-wsl2-*`） |

## Agent 架构（设计中 / Designing）

> **当前 Agent 层尚未实现、尚未部署。** 仓库内现有可运行代码是传统 HRM SaaS 后端与前端；Agent 能力目前只有设计文档与接口清单，处于 **Designing** 阶段，请勿当作已完成功能。
>
> 完整设计见 [docs/agent-architecture.md](docs/agent-architecture.md)、[docs/agent-integration-design.md](docs/agent-integration-design.md) 与 [docs/api-inventory-for-agent.md](docs/api-inventory-for-agent.md)。

设计原则：Agent 只能复用当前用户权限，不得绕过 Shiro/RBAC，不得直接访问数据库或敏感数据；采用**旁路 Agent Server**，不侵入旧 Java 服务；只读工具优先，写操作需人工确认与审批。

### 未来 Agent 方向（Planned / TODO）

1. **Agent Orchestrator** — 对话编排、工具调度、流式响应、审计串联。
2. **Tool Registry** — 固定 HTTP 方法/路径/参数 schema 与风险等级的工具白名单。
3. **Tenant Guard** — 强制 `companyId` 租户隔离，禁止跨租户读取。
4. **RBAC Guard** — 复用 `/sys/profile` 与 Shiro Session，按角色 × 风险放行。
5. **Audit Logger** — 记录调用人、工具、参数摘要、风险等级、结果摘要。
6. **Read-only HR Query Tools** — 第一阶段只开放脱敏只读查询（用户/组织/字典/文档问答）。
7. **Approval Workflow for write actions** — 写操作进入审批链路（可结合 Activiti）。
8. **Human-in-the-loop** — 写操作执行前展示动作、对象、影响范围，二次确认。

> **晚上待补充：** 更完整的 Agent 架构说明将于晚上上传，届时补全 [docs/agent-architecture.md](docs/agent-architecture.md) 第 11 节占位（Orchestrator 状态机、工具 schema、Guard 实现、审计表结构、审批流衔接、部署拓扑等）。

## 安全说明

当前项目仍处于安全补强与迁移演示阶段，不建议直接作为生产系统使用。真实 Agent 不应直接查询数据库，也不应开放薪资、社保、考勤、审批、权限、上传、导入、导出等敏感写操作能力。

## License

MIT License.