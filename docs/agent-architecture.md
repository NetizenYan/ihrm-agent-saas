# Agent 架构说明（设计中 / Designing）

> **当前状态：Designing。** 本文件描述 `ihrm-agent-saas` 的 **Agent 层目标架构**，它**尚未实现、尚未部署**。下文凡涉及 Agent 运行时的部分均为设计意图（planned / TODO），不代表仓库中已有可运行的 Agent。现有可运行代码只是被 Agent 复用的传统 HRM SaaS 后端与前端。
>
> 详细的接入设计与逐接口风险评估见 [agent-integration-design.md](agent-integration-design.md) 与 [api-inventory-for-agent.md](api-inventory-for-agent.md)；权限与租户证据见 [rbac-auth-flow.md](rbac-auth-flow.md)、[database-field-and-tenant-audit.md](database-field-and-tenant-audit.md)。

## 1. 当前状态

- Agent 总体架构：**Designing**，仅有设计文档与接口清单，无运行时实现。
- 现有可运行系统：传统 Spring Cloud HRM SaaS（后端）+ Vue2/Vue3（前端），见 [README](../README.md) 与下文"现有代码基础"。
- 待补充：**晚上将上传更完整的 Agent 架构说明**，本文件第 11 节留有占位，届时替换/补全。

## 2. 现有代码基础（Agent 将复用，而非重写）

| 现有能力 | 代码位置 | Agent 层如何复用 |
| --- | --- | --- |
| 微服务后端 | `backend-legacy/ihrm_*`（system / company / employee / salarys / social_securitys / attendance / audit） | Agent 仅通过 HTTP API 复用，不直接访问其 DB |
| 网关与认证边界 | `backend-legacy/ihrm_gate`、`ihrm_common` 的 Shiro Session / `CustomSessionManager` | Agent 复用现有 `Authorization` 登录态，不另建特权账号 |
| 服务注册 | `backend-legacy/ihrm_eureka` | 旧系统内部调用，Agent 不介入 |
| 业务数据 | 当前 MySQL `ihrm` 业务库 + Activiti `act` 工作流库（`database/`、各 `application.yml`）；**规划迁移至 PostgreSQL**（冒烟测试已通过，安全审查进行中，尚未切换） | Agent 只读优先，敏感字段脱敏后再交给模型 |
| 前端 | `frontend-vue3`（Vue3 + Vite + TS，**Vue2→Vue3 迁移已完成**，含 Agent Chat mock stream 实验）；`frontend-legacy-vue2` 旧版保留 | 计划接入旁路 Agent Server 的流式响应 |

> 说明：仓库内已存在 Vue3 的 **Agent Chat 前端 mock stream 实验**（`docs/vue3-migration-agent-chat-report.md`），这是前端交互占位，**不代表后端 Agent 已实现**。

## 3. 计划中的 Agent 层（Planned）

推荐采用**旁路 Agent Server**，不侵入旧 Java 服务（依据 [agent-integration-design.md](agent-integration-design.md)）：

```text
用户浏览器 (Vue2 / Vue3)
  -> Agent Server (Node.js + TypeScript)   [planned]
       ├─ Agent Orchestrator     对话编排、流式响应、审计串联
       ├─ Profile / RBAC Guard   复用 /sys/profile，按角色+风险放行
       ├─ Tenant Guard           强制 companyId 租户隔离
       ├─ Tool Registry          固定 HTTP 方法/路径/参数 schema/风险等级
       ├─ Tool Adapter           映射到旧 Java API，禁止模型自由拼 URL
       ├─ Audit Logger           记录调用人/工具/参数摘要/结果摘要
       └─ (旁路) Python RAG/文档 Worker   文档解析与向量化  [planned]
  -> 旧系统 Gateway 9090 -> Java 微服务 -> MySQL / Redis
```

所有 Agent 层组件状态均为 **planned / TODO**。

## 4. 安全边界（设计原则）

- Agent **只能复用当前用户权限**，不得绕过 Shiro / RBAC，不得直接访问数据库或敏感数据。
- Tool Adapter 只允许调用**白名单 URL**，模型不能输出任意 URL 直接执行。
- 返回值默认脱敏（手机号、证件号、薪资、社保基数、银行卡等不返回模型），并限制行数/分页上限。
- 错误处理不回显后端堆栈、SQL、敏感配置。

## 5. 租户隔离（Tenant Guard, planned）

- 现有系统以 `companyId` 区分租户（见 `database-field-and-tenant-audit.md` 与社保租户修复报告 `phase2b-social-security-tenant-fix-verification.md`）。
- Agent 层须在工具调用前强制注入/校验当前用户的 `companyId`，禁止跨租户读取；任何缺少租户约束的工具不予注册。

## 6. 权限控制（RBAC Guard, planned）

- 执行前调用 `POST /sys/profile` 识别当前用户、公司、角色（`ihrm_system/.../UserController.java`）。
- 在工具层按"工具风险等级 × 用户角色"做白名单放行；高风险接口默认拒绝。
- 复用现有 Shiro Session，不使用超级管理员服务账号。RBAC 流程现状见 [rbac-auth-flow.md](rbac-auth-flow.md)。

## 7. 审计日志（Audit Logger, planned）

- 记录：用户 ID、公司 ID、工具名、目标接口、参数摘要、风险等级、人工确认记录、结果摘要。
- 现状：业务库有 `sys_mail_record`、`co_transaction_record` 等记录表，但**未发现专用 Agent 审计表**（证据不足），需新增独立审计表或日志服务。

## 8. 只读工具优先原则（Read-only first）

第一阶段只读 Agent MVP 仅开放低敏感、只读能力（依据 `agent-integration-design.md` 第 4 节）：

- 当前用户信息问答（`/sys/profile`）。
- 组织架构 / 部门查询。
- 城市字典查询。
- 脱敏后的简单用户检索（管理员场景）。
- 基于导入文档 / 静态报告的 HRM 帮助问答。

第一阶段**明确不开放**：薪资、社保、审批/流程、权限/角色分配、删除/导入/导出/上传。

## 9. 写操作审批流（TODO）

写操作在 MVP 阶段不开放。后续开放前必须具备：

- **人工确认（Human-in-the-loop）**：执行前展示动作、对象、关键字段、影响范围，二次确认。
- **审批工作流（Approval Workflow）**：写操作进入审批链路，可结合现有 Activiti `act` 流程能力评估。
- **审计 + RBAC + 工具白名单 + 字段脱敏**：见上文。
- **幂等与回滚**：写工具需幂等 key 或补偿方案；旧 Controller 未见统一幂等设计（证据不足），未达标前不开放。

> 状态：以上写操作机制全部为 **TODO**，尚未实现。

## 10. 当前限制

- Agent 运行时**未实现、未部署**；本文件为设计文档。
- 旧后端多数高风险接口缺少明确方法级权限注解证据，Agent 侧必须额外加一层工具白名单与风险控制。
- 项目整体处于安全补强与迁移演示阶段，不建议直接作为生产系统使用。

## 11. 待补充的架构说明（占位 / 晚上上传）

> **【占位 — 待补充】** 本节预留给晚上将上传的更完整 Agent 架构说明，预计补充：
> - Agent Orchestrator 的对话状态机与流式协议细节；
> - Tool Registry 的完整工具 schema 与风险分级表；
> - Tenant Guard / RBAC Guard 的具体校验实现方案；
> - Audit Logger 的表结构设计；
> - 写操作审批流与 Activiti 的衔接方案；
> - 部署拓扑与环境变量清单（参见 [open-source-env-vars.md](open-source-env-vars.md)）。
>
> 在该说明上传前，本文件内容以"设计意图"为准，不代表已实现。
