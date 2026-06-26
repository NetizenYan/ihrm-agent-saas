# iHRM Multi-Agent 架构设计文档

> 版本：1.0  
> 日期：2026-06-26  
> 分支：`phase4-backend-modern-full-replacement`  
> 状态：架构设计——仅文档，不涉及源码变更  
> 约定：**[现有]** 表示基于仓库代码的事实陈述，**[提议]** 表示新增设计

---

## 0. Current Framework Status / Implementation Boundary（实施边界）

> **本节为开源发布说明，优先级高于下文所有设计内容。**

- **v1 是「提议的架构 / 设计文档」，不是已实现的运行时。** 仓库中不存在 Agent Runtime、Agent 数据表、Memory 表、知识库表、MCP/Skills/Token-cost 运行时。文中出现的表结构、`Tool`、`Hook`、状态机、Python/TypeScript 代码片段均为**设计示意**，不代表已落库或已编码。
- **当前实施优先级是传统后端 / 前端 / 数据库的稳定化**，而非 Agent。详见 [traditional-frontend-backend-stabilization-plan.md](./traditional-frontend-backend-stabilization-plan.md)。在传统 API、合成/测试数据、权限与租户隔离稳定之前，**不应**开始实现 Agent Runtime。
- **`backend-modern`（Spring Boot）始终是权威的 HR 业务系统**——员工、考勤、薪资、社保、审批、文件、RBAC、租户隔离、审计均以它为准。Agent 设计层不替代、不绕过它。
- **Python 原型先行、未来 Node.js/TypeScript 生产运行时**属于**提议的未来阶段**，本仓库尚未实现。
- **敏感数据必须由 Data Guard、离线处理与审计共同守护。** 身份证、银行卡、薪资金额、社保基数、合同条款等高敏字段不得进入 Agent 长期记忆，也不得发送给外部 LLM。
- 本节之后的章节描述目标架构与权衡，**阅读时请始终以本边界为前提**。

---

## 目录

1. [现有系统理解](#1-现有系统理解)
2. [Multi-Agent 架构总览](#2-multi-agent-架构总览)
3. [Agent 执行模型](#3-agent-执行模型)
4. [Tool 架构](#4-tool-架构)
5. [数据与隐私模型](#5-数据与隐私模型)
6. [与现有系统的集成](#6-与现有系统的集成)
7. [前端 UX](#7-前端-ux)
8. [场景设计](#8-场景设计)
9. [安全威胁模型](#9-安全威胁模型)
10. [实施路线图](#10-实施路线图)
11. [交付物清单](#11-交付物清单)

---

## 1. 现有系统理解

### 1.1 backend-modern 架构

**[现有]** `backend-modern` 是一个 Maven 多模块 Spring Boot 3.x 应用（Jakarta EE），使用 PostgreSQL + Redis，包含以下模块：

| 模块 | 职责 | 关键类 |
|------|------|--------|
| `ihrm-app` | 主应用入口、安全配置、审计、文件存储、兼容性 API | `IhrmModernApplication`, `SecurityConfiguration`, `AuditLogService`, `BearerSessionAuthenticationFilter` |
| `ihrm-identity` | 用户账号、角色、权限、认证与授权 | `UserAccountEntity`, `RoleEntity`, `PermissionEntity`, `IdentityAuthenticationService`, `IdentityAuthorizationReadService` |
| `ihrm-organization` | 公司、部门、城市 | `CompanyEntity`, `DepartmentEntity`, `CityEntity`, `OrganizationReadService`, `OrganizationWriteService` |
| `ihrm-employee` | 员工档案 | `EmployeeEntity`, `EmployeeReadService` |
| `ihrm-attendance` | 考勤记录 | `AttendanceRecordEntity`, `AttendanceReadService` |
| `ihrm-payroll` | 薪资记录与设置 | `SalaryRecordEntity`, `SalaryCompanySettingEntity`, `PayrollReadService` |
| `ihrm-social-security` | 社保记录与设置 | `SocialSecurityRecordEntity`, `SocialSecurityReadService` |
| `ihrm-approval` | 审批案件、流程定义、任务历史 (Flowable) | `ApprovalCaseEntity`, `ApprovalProcessDefinitionEntity`, `ApprovalReadService` |
| `ihrm-tenant` | 租户访问策略 | `TenantAccessPolicy`, `TenantAccessDeniedException` |
| `ihrm-reporting` | 跨域报表 | `ReportingReadService`, `AttendanceReportRow`, `SalaryReportRow` |
| `ihrm-shared` | 公共 API 类型、安全上下文 | `Result<T>`, `PageResult`, `AuthenticatedPrincipal`, `TenantContext`, `DataScope` |
| `ihrm-migration` | Flyway 迁移 (V1–V6) | 15 张核心表 + RLS |
| `ihrm-worker` | 独立 Worker 应用 | `IhrmWorkerApplication` |

**安全体系 [现有]：**
- Bearer Token + Redis Session (`RedisSessionTokenService`)
- Spring Security Stateless + `BearerSessionAuthenticationFilter`
- `TenantContext` ThreadLocal 持有 `AuthenticatedPrincipal`(userId, tenantId, companyId, roleIds, permissionCodes, dataScopes)
- `TenantAccessPolicy` 支持 GROUP / SUBSIDIARY / COMPANY 三级数据范围
- PostgreSQL 所有 15 张表启用 Row Level Security
- `AuditLogService` 记录登录、薪资读取、文件操作、部门变更

**数据库 [现有]：** PostgreSQL，UUID 主键，15 张核心表：

```
tenant, company, department, user_account, role, permission,
user_role, role_permission, employee, attendance_record,
salary_record, social_security_record, approval_case,
file_object, audit_log
```

### 1.2 frontend-vue3 架构

**[现有]** Vue 3 + TypeScript + Vite + Element Plus + Pinia：

| 模块 | 路径 | 说明 |
|------|------|------|
| 登录 | `/login` | 用户名+密码认证 |
| 首页 | `/dashboard` | 概览面板 |
| 组织架构 | `/departments` | 公司 / 部门树 |
| 员工管理 | `/employees` | 列表 / 详情 / 导入 |
| 考勤管理 | `/attendances` | 考勤 / 归档 / 报表 |
| 薪资管理 | `/salarys` | 列表 / 详情 / 设置 |
| 社保管理 | `/social-securitys` | 列表 / 详情 |
| 审批管理 | `/approvals` | 列表 / 详情 |
| 系统管理 | `/sys-users`, `/sys-roles`, `/sys-permissions` | 用户 / 角色 / 权限 |
| Agent 对话 | `/agent/chat` | **已有** SSE 流式对话 UI |

**Agent Chat [现有]：** `frontend-vue3/src/features/agent-chat/` 已实现：
- `AgentChatPage.vue` — 独立对话页面
- `AgentChatDialog.vue` — 弹窗式对话
- `AgentChatButton.vue` — 全局悬浮按钮
- `useChat.ts` — 对话状态管理 composable
- `api.ts` — SSE 流式请求（`POST /agent/chat/stream`，Bearer Token 认证）
- `types.ts` — `ChatMessage`, `StreamEvent`, mock 模式支持
- `mock.ts` — 本地 mock 流式回复

### 1.3 现有领域模块汇总

| 领域 | 后端模块 | 前端页面 | 状态 |
|------|---------|---------|------|
| 租户 / 公司 / 部门 | `ihrm-tenant`, `ihrm-organization` | departments, saas-clients, settings | **[现有]** |
| 用户 / 角色 / 权限 | `ihrm-identity` | sys-users, sys-roles, sys-permissions | **[现有]** |
| 员工 | `ihrm-employee` | employees | **[现有]** |
| 考勤 | `ihrm-attendance` | attendances | **[现有]** |
| 薪资 | `ihrm-payroll` | salarys | **[现有]** |
| 社保 | `ihrm-social-security` | social-securitys | **[现有]** |
| 审批 (Flowable) | `ihrm-approval` | approvals | **[现有]** |
| 报表 | `ihrm-reporting` | — | **[现有]** |
| 文件存储 | `ihrm-app` (files) | — | **[现有]** |
| 审计 | `ihrm-app` (audit) | — | **[现有]** |
| 招聘 / 简历筛选 | — | — | **[提议]** |
| 合同 / 文档管理 | — | — | **[提议]** |
| 政策合规 | — | — | **[提议]** |

---

## 2. Multi-Agent 架构总览

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户 (Vue3 前端)                          │
│  AgentChatPage / AgentChatDialog / 专项助手页面                  │
└────────────────┬───────────────────────────────────────────┬─────┘
                 │ POST /agent/chat/stream (SSE)            │ REST API
                 ▼                                          ▼
┌────────────────────────────────────────────────────────────────┐
│                   Agent Gateway Layer                          │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ Auth Filter   │→│ Rate Limiter   │→│ Session Manager     │  │
│  │ (Bearer+Redis)│  │ (per-tenant)  │  │ (conversation ctx) │  │
│  └──────────────┘  └───────────────┘  └────────────────────┘  │
└────────────────┬──────────────────────────────────────────────┘
                 ▼
┌────────────────────────────────────────────────────────────────┐
│              Orchestrator Agent (编排层)                        │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ 1. 意图分类 → 2. 权限预检 → 3. Sub-Agent 选择       │     │
│  │ 4. Tool 选择 → 5. Data Guard → 6. 执行 → 7. 合成    │     │
│  └──────────────────────────────────────────────────────┘     │
│  状态机: CLASSIFY → GUARD → EXECUTE → SYNTHESIZE → REVIEW     │
└───┬───┬───┬───┬───┬───┬───┬───┬───┬──────────────────────────┘
    │   │   │   │   │   │   │   │   │
    ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼
┌─────┐┌──────┐┌─────┐┌──────┐┌──────┐┌─────┐┌──────┐┌──────┐┌──────┐
│ HR  ││Recruit││Atten││Payroll││Contract││Appro││Compli││Data  ││Audit │
│Serv ││Screen ││dance││Assist ││Doc    ││val  ││ance  ││Guard ││Trace │
│Agent││Agent  ││Agent││Agent  ││Agent  ││Agent││Agent ││Agent ││Agent │
└──┬──┘└──┬───┘└──┬──┘└──┬───┘└──┬───┘└──┬──┘└──┬───┘└──┬───┘└──┬───┘
   │      │       │      │       │       │      │       │       │
   └──────┴───────┴──────┴───────┴───────┴──────┴───────┘       │
                         │                                       │
                    ┌────▼──────────┐                    ┌───────▼──────┐
                    │ Tool Registry │                    │ audit_log /  │
                    │ + Adapters    │                    │ agent_audit  │
                    └────┬──────────┘                    └──────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌───────────┐  ┌──────────┐  ┌───────────┐
    │ PostgreSQL │  │  Redis   │  │ File Store│
    │ (ihrm DB) │  │ (session │  │ (local /  │
    │ + RLS     │  │  cache)  │  │  S3)      │
    └───────────┘  └──────────┘  └───────────┘
```

### 2.2 十个 Agent 定义

#### 2.2.1 Orchestrator Agent（编排 Agent）

- **职责：** 路由用户意图、维护任务状态、选择 Sub-Agent、执行工作流边界约束
- **输入：** 用户消息 + 会话上下文 + `AuthenticatedPrincipal`
- **输出：** 最终回复（文本 / 结构化卡片 / 确认请求）
- **关键能力：** 意图分类（HR 查询 / 招聘 / 考勤 / 薪资 / 合同 / 审批 / 合规 / 闲聊）、多轮对话状态管理、Sub-Agent 编排、错误恢复

#### 2.2.2 HR Service Agent（HR 服务 Agent）

- **职责：** 处理员工生命周期问题——入职、离职、部门调动、员工档案、组织结构查询
- **对接模块 [现有]：** `ihrm-employee`, `ihrm-organization`, `ihrm-identity`
- **工具：** `query_employee`, `query_department`, `query_org_tree`, `get_employee_detail`
- **敏感度：** 中——员工基本信息（脱敏手机号、证件号）

#### 2.2.3 Recruitment / Resume Screening Agent（招聘 / 简历筛选 Agent）

- **职责：** 简历收取（邮件 / 上传）、候选人信息提取、JD 匹配、面试推荐、人工审核队列
- **对接模块：** **[提议]** `ihrm-recruitment`（新模块）
- **工具：** `parse_resume`, `extract_candidate`, `match_jd`, `rank_candidates`, `create_interview_task`
- **敏感度：** 高——简历含个人身份信息；必须防范简历中的 prompt injection

#### 2.2.4 Attendance Agent（考勤 Agent）

- **职责：** 考勤异常检测（漏打卡、迟到、早退、加班）、月度考勤汇总、异常说明生成
- **对接模块 [现有]：** `ihrm-attendance`, `ihrm-reporting`
- **工具：** `query_attendance_records`, `detect_attendance_anomalies`, `get_attendance_summary`
- **敏感度：** 高——考勤数据直接影响薪资和员工考核

#### 2.2.5 Payroll Assistant Agent（薪资助手 Agent）

- **职责：** 薪资预检、计算说明、异常检测；**最终薪资确认必须人工审批**
- **对接模块 [现有]：** `ihrm-payroll`, `ihrm-attendance`, `ihrm-reporting`
- **工具：** `get_payroll_summary`, `detect_payroll_anomalies`, `explain_salary_calculation`, `request_payroll_approval`
- **敏感度：** 极高——薪资数据属于最高级别敏感信息
- **硬约束：** 任何金额变更操作必须经过 human-in-the-loop 确认

#### 2.2.6 Contract / Document Agent（合同 / 文档 Agent）

- **职责：** 员工合同管理、附件分类、文档访问、到期提醒
- **对接模块：** **[提议]** `ihrm-contract`（新模块）；**[现有]** `ihrm-app` (files) 提供文件存储基础
- **工具：** `list_contracts`, `get_contract_detail`, `detect_expiring_contracts`, `classify_document`
- **敏感度：** 高——合同包含薪资条款、竞业限制等敏感内容
- **隐私要求：** 合同文档本地处理，不上传至外部 LLM

#### 2.2.7 Approval Workflow Agent（审批流程 Agent）

- **职责：** 请假、加班、报销类 HR 审批的路由、状态说明、审计轨迹
- **对接模块 [现有]：** `ihrm-approval` (Flowable)
- **工具：** `list_my_approvals`, `get_approval_detail`, `explain_approval_status`, `list_pending_tasks`
- **敏感度：** 高——审批涉及流程状态变更
- **硬约束：** Agent 不自动审批，仅提供信息和路由

#### 2.2.8 Compliance / Policy Agent（合规 / 政策 Agent）

- **职责：** 公司政策 Q&A、劳动法规参考、内部 HR 政策检索、风险提醒
- **对接模块：** **[提议]** RAG 向量检索（政策文档库）
- **工具：** `search_policy`, `search_labor_law`, `get_policy_detail`
- **敏感度：** 中——但必须明确标注"仅供参考，不构成法律建议"
- **硬约束：** 所有合规回答必须附带免责声明

#### 2.2.9 Data Access Guard Agent（数据访问守卫 Agent）

- **职责：** 执行租户隔离、RBAC 权限检查、数据最小化、敏感字段脱敏、工具执行前的权限校验
- **对接模块 [现有]：** `ihrm-tenant` (`TenantAccessPolicy`), `ihrm-identity` (`AuthorizationSnapshot`)
- **执行位置：** 嵌入 Orchestrator 的 GUARD 阶段，在每个 Tool 调用前拦截
- **核心逻辑：**
  1. 验证 `tenantId` 一致性
  2. 验证 `companyId` 数据范围（GROUP / SUBSIDIARY / COMPANY）
  3. 验证用户 `permissionCodes` 是否包含工具所需权限
  4. 对返回数据执行字段级脱敏

#### 2.2.10 Audit / Trace Agent（审计 / 追踪 Agent）

- **职责：** 记录 Agent 决策、Tool 调用、敏感数据访问、审批节点、人工覆盖事件
- **对接模块 [现有]：** `ihrm-app` (`AuditLogService`, `audit_log` 表) ——扩展为 Agent 审计
- **执行位置：** 每个 Tool 调用完成后自动触发
- **记录内容：** agent_id, tool_name, input_summary (脱敏), output_summary (脱敏), risk_level, human_approval_required, human_decision, latency_ms, error

---

## 3. Agent 执行模型

### 3.1 主执行循环

```
用户请求
  │
  ▼
┌──────────────────┐
│ 1. Orchestrator   │ 接收用户消息 + 会话上下文
│    接收           │
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 2. 意图分类       │ LLM 意图识别 → hr_query / recruitment / attendance /
│    (Intent)      │ payroll / contract / approval / compliance / general
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 3. 权限预检       │ Data Access Guard 验证：
│    (Permission)  │   - 用户是否有权限使用目标 Agent
│                  │   - 租户/公司/数据范围校验
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 4. Tool 选择      │ Sub-Agent 根据意图选择具体 Tool
│    (Tool Select) │ Tool Registry 返回: schema + risk_level + approval_required
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 5. Sub-Agent     │ 执行具体业务逻辑：
│    执行           │   - 调用 Tool Adapter → Spring Service → Repository
│                  │   - Data Guard 校验每次数据访问
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 6. 数据守卫       │ 结果后处理：
│    (Data Guard)  │   - 敏感字段脱敏（手机号、证件号、薪资）
│                  │   - 结果行数限制
│                  │   - 租户数据边界校验
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 7. 结果合成       │ LLM 将 Tool 结果合成为自然语言回答
│    (Synthesize)  │ 附带数据来源引用
└──────┬───────────┘
       ▼
┌──────────────────────────────────┐
│ 8. 人工审批（如需要）              │ risk_level >= HIGH 的写操作
│    (Human Approval)              │ 向前端发送确认卡片，等待用户确认
│    ┌──────────┐  ┌──────────┐   │
│    │ 用户确认  │  │ 用户拒绝  │   │
│    └─────┬────┘  └─────┬────┘   │
│          ▼              ▼        │
│      执行写操作     取消并记录     │
└──────────┬──────────────────────┘
           ▼
┌──────────────────┐
│ 9. 审计日志       │ Audit Agent 写入 agent_audit_log
│    (Audit Log)   │ 包含完整调用链路
└──────┬───────────┘
       ▼
┌──────────────────┐
│ 10. 最终响应      │ SSE 流式返回给前端
│    (Response)    │
└──────────────────┘
```

### 3.2 同步 vs 异步任务

| 类型 | 场景 | 实现 |
|------|------|------|
| **同步** | 简单查询（员工信息、部门列表、考勤状态） | 在 SSE 流中直接返回，延迟 < 5s |
| **异步轮询** | 复杂分析（月度考勤异常检测、薪资预检） | 返回任务 ID，前端轮询 `/agent/task/{id}/status` |
| **异步回调** | 简历批量解析、合同到期扫描 | 任务完成后通过 WebSocket / SSE 推送通知 |

### 3.3 长时间运行任务

**[提议]** 引入 `agent_task` 表：

```sql
CREATE TABLE agent_task (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid NOT NULL REFERENCES company(id),
    initiator_user_id uuid NOT NULL REFERENCES user_account(id),
    agent_type varchar(64) NOT NULL,
    task_type varchar(128) NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'PENDING',  -- PENDING / RUNNING / AWAITING_APPROVAL / COMPLETED / FAILED / CANCELLED
    input_summary text,
    output_summary text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
```

### 3.4 重试 / 补偿策略

| 策略 | 适用场景 | 实现 |
|------|---------|------|
| **自动重试** | LLM API 超时、瞬时网络错误 | 最多 3 次，指数退避 (1s, 2s, 4s) |
| **幂等执行** | 所有写操作 Tool | 每次 Tool 调用携带 `idempotency_key = SHA256(tool_name + params + timestamp_minute)` |
| **补偿回滚** | 多步骤工作流中间步骤失败 | 记录已执行步骤的反向操作，按 LIFO 顺序补偿 |
| **人工介入** | 补偿失败或不可逆操作 | 创建 `NEEDS_REVIEW` 任务，通知管理员 |

### 3.5 Human-in-the-Loop 检查点

| 触发条件 | 行为 |
|---------|------|
| Tool `risk_level >= HIGH` 且为写操作 | 暂停执行，前端显示确认卡片 |
| 薪资相关的任何金额变更 | 强制人工确认 |
| 审批流程的提交/驳回 | 强制人工确认 |
| 批量操作（影响 > 10 条记录） | 强制人工确认 |
| Agent 对同一资源连续调用 > 3 次 | 告警并暂停 |

### 3.6 故障处理

```
Tool 调用失败
    │
    ├─ 可重试错误 (超时/网络) → 自动重试 (最多 3 次)
    │
    ├─ 权限拒绝 → 向用户说明权限不足，建议联系管理员
    │
    ├─ 数据不存在 → 向用户说明，建议修正查询条件
    │
    ├─ 业务规则违反 → 向用户解释规则限制
    │
    └─ 未知错误 → 记录完整堆栈到日志（不暴露给用户/LLM），返回通用错误消息
```

---

## 4. Tool 架构

### 4.1 Tool 分类总表

每个 Tool 定义包含：名称、输入 schema、输出 schema、所需权限、风险等级、是否需要人工审批。

#### 4.1.1 HR 领域工具

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `query_employee_list` | 查询员工列表 | `{companyId, departmentId?, status?, page, size}` | `PageResult<EmployeeListItem>` | `EMPLOYEE_READ` | 中 | 否 |
| `get_employee_detail` | 获取员工详情 | `{employeeId}` | `EmployeeDetailView` (脱敏) | `EMPLOYEE_READ` | 中 | 否 |
| `get_employee_jobs` | 获取员工岗位信息 | `{employeeId}` | `EmployeeJobsView` | `EMPLOYEE_READ` | 中 | 否 |
| `query_org_tree` | 查询组织树 | `{companyId}` | `DepartmentTree` | `DEPARTMENT_READ` | 低 | 否 |
| `get_profile` | 获取当前用户信息 | `{}` | `ProfileView` | — (自身) | 低 | 否 |

#### 4.1.2 考勤工具

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `query_attendance_records` | 查询考勤记录 | `{employeeId?, month, page, size}` | `PageResult<AttendanceListItem>` | `ATTENDANCE_READ` | 高 | 否 |
| `detect_attendance_anomalies` | 检测考勤异常 | `{companyId, month}` | `AnomalyReport` | `ATTENDANCE_READ` | 高 | 否 |
| `get_attendance_summary` | 月度考勤汇总 | `{companyId, month}` | `AttendanceSummary` | `ATTENDANCE_READ` | 高 | 否 |

#### 4.1.3 薪资 / 工资工具

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `get_payroll_summary` | 薪资月度汇总 | `{companyId, month}` | `PayrollSummary` (聚合数据) | `SALARY_READ` | 极高 | 否 |
| `detect_payroll_anomalies` | 薪资异常检测 | `{companyId, month}` | `PayrollAnomalyReport` | `SALARY_READ` | 极高 | 否 |
| `explain_salary_calculation` | 解释薪资计算 | `{employeeId, month}` | `SalaryExplanation` | `SALARY_READ` | 极高 | 否 |
| `request_payroll_approval` | 请求薪资审批 | `{companyId, month}` | `ApprovalRequest` | `SALARY_APPROVE` | 极高 | **是** |

#### 4.1.4 合同 / 文档工具 **[提议]**

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `list_contracts` | 列出合同 | `{employeeId?, status?, page, size}` | `PageResult<ContractListItem>` | `CONTRACT_READ` | 高 | 否 |
| `get_contract_detail` | 合同详情 | `{contractId}` | `ContractDetailView` | `CONTRACT_READ` | 高 | 否 |
| `detect_expiring_contracts` | 到期合同检测 | `{companyId, daysAhead}` | `ExpiringContractReport` | `CONTRACT_READ` | 高 | 否 |
| `classify_document` | 文档分类 | `{fileId}` | `DocumentClassification` | `FILE_READ` | 中 | 否 |

#### 4.1.5 审批工作流工具

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `list_my_approvals` | 我的审批列表 | `{status?, page, size}` | `PageResult<ApprovalListItem>` | `APPROVAL_READ` | 中 | 否 |
| `get_approval_detail` | 审批详情 | `{approvalId}` | `ApprovalDetailView` | `APPROVAL_READ` | 中 | 否 |
| `explain_approval_status` | 解释审批状态 | `{approvalId}` | `ApprovalStatusExplanation` | `APPROVAL_READ` | 中 | 否 |
| `list_pending_tasks` | 待审批任务 | `{page, size}` | `PageResult<PendingTaskItem>` | `APPROVAL_READ` | 中 | 否 |

#### 4.1.6 招聘 / 邮件摄入工具 **[提议]**

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `parse_resume` | 解析简历 | `{fileId}` | `ParsedResume` | `RECRUITMENT_WRITE` | 高 | 否 |
| `extract_candidate` | 提取候选人信息 | `{parsedResumeId}` | `CandidateInfo` | `RECRUITMENT_WRITE` | 高 | 否 |
| `match_jd` | JD 匹配打分 | `{candidateId, jobDescriptionId}` | `MatchResult` | `RECRUITMENT_READ` | 中 | 否 |
| `rank_candidates` | 候选人排名 | `{jobDescriptionId, topN}` | `RankedCandidateList` | `RECRUITMENT_READ` | 中 | 否 |
| `create_interview_task` | 创建面试任务 | `{candidateId, interviewerIds, scheduledAt}` | `InterviewTask` | `RECRUITMENT_WRITE` | 高 | **是** |

#### 4.1.7 RAG / 政策检索工具 **[提议]**

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `search_policy` | 搜索公司政策 | `{query, topK}` | `PolicySearchResult[]` | `POLICY_READ` | 低 | 否 |
| `search_labor_law` | 搜索劳动法规 | `{query, topK}` | `LawSearchResult[]` | — | 低 | 否 |
| `get_policy_detail` | 获取政策详情 | `{policyId}` | `PolicyDocument` | `POLICY_READ` | 低 | 否 |

**[提议]** 企业知识库的入库、chunking、表格/图片处理、版本过滤、RAG citation 和资产展示规则，详见 `docs/agent/v1/enterprise-knowledge-base-chunking-design.md`。政策检索工具只返回经过租户、公司、RBAC、版本和敏感度过滤的 chunk 与引用，不替代 backend-modern Tool 的权威业务事实查询。

#### 4.1.8 通知工具 **[提议]**

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `send_notification` | 站内通知 | `{recipientUserIds, title, content}` | `NotificationResult` | `NOTIFICATION_WRITE` | 中 | **是** (批量) |
| `send_email_notification` | 邮件通知 | `{recipientEmails, subject, body}` | `EmailResult` | `EMAIL_WRITE` | 高 | **是** |

#### 4.1.9 审计日志工具

| Tool 名称 | 用途 | 输入 | 输出 | 权限 | 风险 | 人工审批 |
|-----------|------|------|------|------|------|---------|
| `query_audit_trail` | 查询审计轨迹 | `{targetType?, targetId?, dateRange, page, size}` | `PageResult<AuditLogEntry>` | `AUDIT_READ` | 高 | 否 |
| `get_agent_audit_trail` | 查询 Agent 操作审计 | `{agentType?, dateRange, page, size}` | `PageResult<AgentAuditEntry>` | `AUDIT_READ` | 高 | 否 |

### 4.2 Tool Registry 设计

**[提议]** 所有 Tool 注册在 `ToolRegistry` 中，包含：

```java
public record ToolDefinition(
    String name,
    String description,
    String agentType,          // 所属 Agent
    String permissionCode,     // 所需权限码
    RiskLevel riskLevel,       // LOW / MEDIUM / HIGH / CRITICAL
    boolean humanApprovalRequired,
    boolean readOnly,
    Class<?> inputType,
    Class<?> outputType
) {}
```

Tool Adapter 的核心约束：
- **白名单执行：** 只有注册在 `ToolRegistry` 中的 Tool 可被调用
- **参数校验：** 所有输入参数经过 JSON Schema 校验，禁止路径穿越 (`../`)
- **分页限制：** 默认 `size ≤ 50`，最大 `size ≤ 200`
- **返回脱敏：** 敏感字段在 Adapter 层脱敏后再交给 LLM

---

## 5. 数据与隐私模型

### 5.1 租户隔离

**[现有]** 已有三层隔离机制：

1. **数据库级：** PostgreSQL Row Level Security 在所有 15 张表上启用
2. **应用级：** `TenantContext` ThreadLocal + `TenantAccessPolicy` (GROUP/SUBSIDIARY/COMPANY)
3. **API 级：** `BearerSessionAuthenticationFilter` 在每个请求中注入 `AuthenticatedPrincipal`

**[提议]** Agent 层新增：

4. **Tool 级：** Data Guard Agent 在每次 Tool 调用前验证 `tenantId` + `companyId`
5. **LLM 级：** 系统 Prompt 中注入 `"你只能访问租户 {tenantId} 的数据"`
6. **结果级：** Tool 返回结果中移除 `tenantId`，防止跨租户数据泄露到 LLM 上下文

### 5.2 公司级数据隔离

**[现有]** `TenantAccessPolicy.canReadCompany()` 已实现：

- `DataScope.GROUP` → 可读所有子公司
- `DataScope.SUBSIDIARY` → 可读本公司 + 指定子公司
- `DataScope.COMPANY` → 仅可读本公司

**[提议]** Agent 继承此策略，不创建特殊权限。

### 5.3 RBAC

**[现有]** `AuthenticatedPrincipal` 包含 `permissionCodes` 集合。

**[提议]** Tool 执行前的权限检查：

```java
// Data Guard 伪代码
void guardToolExecution(AuthenticatedPrincipal principal, ToolDefinition tool) {
    if (tool.permissionCode() != null
        && !principal.permissionCodes().contains(tool.permissionCode())) {
        throw new AgentPermissionDeniedException(tool.name(), tool.permissionCode());
    }
}
```

### 5.4 敏感字段分级

| 级别 | 字段 | 处理方式 |
|------|------|---------|
| **L1 (公开)** | 公司名称、部门名称、城市、职位名称 | 原文传给 LLM |
| **L2 (内部)** | 员工姓名、工号、入职日期、在职状态 | 原文传给 LLM，但不在日志中明文存储 |
| **L3 (机密)** | 手机号、邮箱、家庭住址 | 脱敏后传给 LLM（`138****5678`） |
| **L4 (绝密)** | 身份证号、银行卡号、薪资金额、社保基数、合同条款 | **不传给 LLM**；仅返回聚合统计或由 Agent 生成说明文本 |

### 5.5 本地文档处理

合同和简历包含 L3/L4 级数据，**不应上传至外部 LLM API**。

**[提议]** 处理流程：

```
文档上传 → 本地解析 (Apache Tika / PaddleOCR)
         → 结构化提取 (本地模型或规则引擎)
         → 提取结果 (脱敏后) → 传给 LLM 做语义分析
         → 原文件存储在本地 / 私有对象存储
```

### 5.6 Prompt Injection 防护

| 攻击面 | 防护措施 |
|--------|---------|
| 简历中嵌入 LLM 指令 | 简历内容作为 `user` 角色文本输入，不作为 `system` 指令；提取结果经过格式校验 |
| 合同中嵌入恶意指令 | 合同文本仅在本地解析，提取后的字段经过 schema 校验 |
| 邮件中嵌入指令 | 邮件正文隔离到独立上下文窗口，不与系统 Prompt 混合 |
| 用户直接尝试注入 | Orchestrator 意图分类阶段检测异常模式；Data Guard 拦截越权请求 |

### 5.7 数据留存边界

| 数据类型 | 留存策略 |
|---------|---------|
| Agent 会话消息 | 90 天后自动清理 |
| Agent 审计日志 | 保留 2 年（满足劳动法规要求） |
| 简历原文件 | 候选人拒绝后 30 天清理 |
| LLM 请求日志 | 不存储原始 prompt（仅存储 token 统计和 request_id） |

---

## 6. 与现有系统的集成

### 6.1 后端集成方案

**[提议]** 在 `backend-modern` 中新增 `ihrm-agent` 模块，作为 Agent 框架核心：

```
backend-modern/
├── ihrm-agent/                    ← [提议] 新增
│   ├── src/main/java/com/ihrm/modern/agent/
│   │   ├── orchestrator/
│   │   │   ├── OrchestratorAgent.java
│   │   │   ├── IntentClassifier.java
│   │   │   ├── AgentRouter.java
│   │   │   └── ConversationStateManager.java
│   │   ├── runtime/
│   │   │   ├── AgentExecutionLoop.java
│   │   │   ├── AgentTask.java
│   │   │   └── AgentTaskRepository.java
│   │   ├── tool/
│   │   │   ├── ToolRegistry.java
│   │   │   ├── ToolDefinition.java
│   │   │   ├── ToolAdapter.java
│   │   │   ├── ToolExecutionResult.java
│   │   │   └── adapters/
│   │   │       ├── EmployeeToolAdapter.java
│   │   │       ├── AttendanceToolAdapter.java
│   │   │       ├── PayrollToolAdapter.java
│   │   │       ├── ApprovalToolAdapter.java
│   │   │       └── OrganizationToolAdapter.java
│   │   ├── security/
│   │   │   ├── AgentDataGuard.java
│   │   │   ├── AgentPermissionChecker.java
│   │   │   ├── FieldMaskingService.java
│   │   │   └── PromptInjectionDetector.java
│   │   ├── audit/
│   │   │   ├── AgentAuditService.java
│   │   │   └── AgentAuditLogEntity.java
│   │   ├── memory/
│   │   │   ├── ConversationMemory.java
│   │   │   └── ConversationMemoryRepository.java
│   │   ├── rag/
│   │   │   ├── PolicyRagService.java
│   │   │   └── DocumentEmbeddingService.java
│   │   ├── llm/
│   │   │   ├── LlmClient.java
│   │   │   ├── LlmStreamResponse.java
│   │   │   └── LlmConfig.java
│   │   ├── workflow/
│   │   │   ├── HumanApprovalGate.java
│   │   │   └── AsyncTaskScheduler.java
│   │   ├── api/
│   │   │   ├── AgentChatController.java
│   │   │   ├── AgentTaskController.java
│   │   │   └── AgentChatRequest.java
│   │   └── dto/
│   │       ├── ChatMessageDto.java
│   │       ├── StreamEventDto.java
│   │       └── ToolCallDto.java
│   └── pom.xml
├── ihrm-contract/                 ← [提议] 新增
│   └── ...
├── ihrm-recruitment/              ← [提议] 新增
│   └── ...
├── ihrm-app/                      ← [现有]
├── ihrm-identity/                 ← [现有]
├── ihrm-organization/             ← [现有]
├── ihrm-employee/                 ← [现有]
├── ihrm-attendance/               ← [现有]
├── ihrm-payroll/                  ← [现有]
├── ihrm-social-security/          ← [现有]
├── ihrm-approval/                 ← [现有]
├── ihrm-tenant/                   ← [现有]
├── ihrm-reporting/                ← [现有]
├── ihrm-shared/                   ← [现有]
├── ihrm-migration/                ← [现有]
└── ihrm-worker/                   ← [现有]
```

### 6.2 Spring Boot 集成

```java
// [提议] AgentChatController.java
@RestController
@RequestMapping("/agent")
public class AgentChatController {

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<StreamEventDto> chat(
            @RequestBody AgentChatRequest request,
            @AuthenticationPrincipal AuthenticatedPrincipal principal) {
        // 1. 验证 principal
        // 2. 调用 OrchestratorAgent.execute(request, principal)
        // 3. 返回 SSE 流
    }

    @GetMapping("/task/{id}/status")
    public Result<AgentTaskStatusDto> taskStatus(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedPrincipal principal) {
        // 查询异步任务状态
    }
}
```

### 6.3 数据库集成

**[提议]** 新增 Flyway 迁移 `V7__agent_tables.sql`：

```sql
-- Agent 会话
CREATE TABLE agent_conversation (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid NOT NULL REFERENCES company(id),
    user_id uuid NOT NULL REFERENCES user_account(id),
    title varchar(256),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agent_conversation ENABLE ROW LEVEL SECURITY;

-- Agent 消息
CREATE TABLE agent_message (
    id uuid PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES agent_conversation(id),
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    role varchar(16) NOT NULL,  -- user / assistant / system / tool
    content text NOT NULL,
    tool_calls jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agent_message ENABLE ROW LEVEL SECURITY;

-- Agent 审计日志
CREATE TABLE agent_audit_log (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid REFERENCES company(id),
    user_id uuid REFERENCES user_account(id),
    conversation_id uuid REFERENCES agent_conversation(id),
    agent_type varchar(64) NOT NULL,
    tool_name varchar(128),
    input_summary text,
    output_summary text,
    risk_level varchar(16) NOT NULL,
    human_approval_required boolean NOT NULL DEFAULT false,
    human_decision varchar(16),  -- APPROVED / REJECTED / null
    latency_ms integer,
    error_message text,
    request_id varchar(128) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_audit_tenant_time ON agent_audit_log (tenant_id, created_at);
ALTER TABLE agent_audit_log ENABLE ROW LEVEL SECURITY;

-- Agent 异步任务
CREATE TABLE agent_task (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid NOT NULL REFERENCES company(id),
    user_id uuid NOT NULL REFERENCES user_account(id),
    conversation_id uuid REFERENCES agent_conversation(id),
    agent_type varchar(64) NOT NULL,
    task_type varchar(128) NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'PENDING',
    input_summary text,
    output_summary text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
CREATE INDEX idx_agent_task_tenant_status ON agent_task (tenant_id, status, created_at);
ALTER TABLE agent_task ENABLE ROW LEVEL SECURITY;
```

### 6.4 Redis 集成

| 用途 | Key 模式 | TTL |
|------|---------|-----|
| 会话 Token | `session:{token}` | 现有 |
| Agent 会话上下文缓存 | `agent:conv:{conversationId}:ctx` | 30 min |
| 工具调用限流 | `agent:ratelimit:{tenantId}:{toolName}` | 1 min |
| 异步任务状态 | `agent:task:{taskId}:status` | 24 h |

### 6.5 文件存储集成

**[现有]** `LocalFileObjectStorageService` + `file_object` 表。

**[提议]** 扩展 `file_object.purpose` 枚举：

```
AVATAR | EMPLOYEE_DOC | RESUME | CONTRACT | POLICY_DOC | AGENT_ATTACHMENT
```

### 6.6 邮件收件集成 **[提议]**

```
IMAP/POP3 Poller (ihrm-worker)
    → 新邮件到达
    → 附件提取 → file_object 存储
    → 元数据入库 → email_inbox 表
    → 触发 Recruitment Agent 的 parse_resume Tool
```

### 6.7 认证系统集成

Agent API 完全复用现有认证链路：
1. **[现有]** 前端 `getToken()` → `Authorization: Bearer {token}`
2. **[现有]** `BearerSessionAuthenticationFilter` → `RedisSessionTokenService` → `AuthenticatedPrincipal`
3. **[现有]** `TenantContext.set(principal)` → 所有 Service 可获取
4. **[提议]** Agent 层直接从 `TenantContext.requirePrincipal()` 获取用户上下文

---

## 7. 前端 UX

### 7.1 页面 / 组件规划

**[现有]** 已有的 Agent Chat 基础组件：

| 组件 | 文件 | 说明 |
|------|------|------|
| `AgentChatPage.vue` | `features/agent-chat/` | 独立全页对话 |
| `AgentChatDialog.vue` | `features/agent-chat/` | 弹窗对话 |
| `AgentChatButton.vue` | `features/agent-chat/` | 全局悬浮按钮 |

**[提议]** 新增专项助手页面和组件：

| 页面 / 组件 | 路由 | 说明 |
|------------|------|------|
| HR AI 助手对话面板 | `/agent/chat` | 增强现有页面：支持工具卡片、确认按钮、文件上传 |
| 简历筛选收件箱 | `/agent/recruitment` | **[提议]** 简历列表 + AI 评分 + 人工审核队列 |
| 考勤异常助手 | `/agent/attendance` | **[提议]** 月度异常报告 + AI 解释 + 一键确认 |
| 薪资预检助手 | `/agent/payroll` | **[提议]** 薪资对比表 + 异常高亮 + 人工审批按钮 |
| 合同 / 文档助手 | `/agent/contracts` | **[提议]** 合同列表 + 到期预警 + 续签工作流 |
| 审批助手 | `/agent/approvals` | **[提议]** 待审批队列 + AI 摘要 + 快速审批 |
| 审计追踪查看器 | `/agent/audit` | **[提议]** Agent 操作日志 + 筛选 + 导出 |
| 人工审核队列 | `/agent/review-queue` | **[提议]** 所有需要人工确认的 Agent 操作 |

### 7.2 对话界面增强

**[提议]** 在现有 `ChatMessage` 类型基础上扩展：

```typescript
// types.ts 扩展
export interface ToolCallCard {
  toolName: string
  toolDisplayName: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  inputSummary: string
  requiresApproval: boolean
  status: 'pending' | 'approved' | 'rejected' | 'executed'
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  error?: boolean
  streaming?: boolean
  toolCalls?: ToolCallCard[]     // [提议] 工具调用卡片
  approvalRequest?: ApprovalCard  // [提议] 人工确认请求
  dataSources?: string[]          // [提议] 数据来源引用
}
```

### 7.3 前端路由规划

```typescript
// [提议] routes.ts 新增
{
  path: '/agent', component: Layout, redirect: '/agent/chat',
  meta: { title: 'AI 助手', icon: 'ChatDotRound' },
  children: [
    { path: 'chat', name: 'agent-chat', ... },           // [现有]
    { path: 'recruitment', name: 'agent-recruitment', ... }, // [提议]
    { path: 'attendance', name: 'agent-attendance', ... },   // [提议]
    { path: 'payroll', name: 'agent-payroll', ... },         // [提议]
    { path: 'contracts', name: 'agent-contracts', ... },     // [提议]
    { path: 'approvals', name: 'agent-approvals', ... },     // [提议]
    { path: 'audit', name: 'agent-audit', ... },             // [提议]
    { path: 'review-queue', name: 'agent-review', ... }      // [提议]
  ]
}
```

---

## 8. 场景设计

### 场景 A：简历通过 AI 邮件到达

```
1. [ihrm-worker] IMAP Poller 检测到新邮件（来自 hr-inbox@company.com）
2. [ihrm-worker] 提取附件 → file_object 存储，元数据入 email_inbox 表
3. [Recruitment Agent] 自动触发 parse_resume Tool
   → 本地解析（Apache Tika）→ 结构化文本
4. [Recruitment Agent] 调用 extract_candidate Tool
   → LLM 提取：姓名、联系方式(L3 脱敏)、教育、工作经历、技能
5. [Recruitment Agent] 调用 match_jd Tool
   → 与活跃 JD 匹配打分（语义相似度 + 硬性条件过滤）
6. [Recruitment Agent] 调用 rank_candidates Tool
   → 输出排名列表，标注匹配度
7. [Data Guard] 验证所有操作在当前 tenant/company 范围内
8. [Audit Agent] 记录完整处理链路
9. [前端] 简历筛选收件箱显示新候选人，HR 可查看 AI 评分
10. [HR 确认] HR 点击"安排面试"
11. [Recruitment Agent] 调用 create_interview_task Tool（需人工确认）
    → 创建面试任务，通知面试官
```

### 场景 B：月度考勤检查

```
1. [HR 用户] 在 Agent 对话中输入："帮我检查本月考勤异常"
2. [Orchestrator] 意图分类 → attendance
3. [Attendance Agent] 调用 detect_attendance_anomalies Tool
   → 参数: companyId (来自 principal), month (当前月)
   → 查询 attendance_record 表，检测：
     - 漏打卡（有上班无下班、有下班无上班）
     - 迟到（打卡时间 > 规定上班时间）
     - 早退（打卡时间 < 规定下班时间）
     - 加班异常（连续加班 > 3 天）
4. [Data Guard] 验证 HR 有 ATTENDANCE_READ 权限
5. [Attendance Agent] 调用 LLM 合成异常报告
   → "本月共发现 12 条考勤异常：3 人漏打卡、5 人迟到、4 人加班超标..."
6. [前端] 显示异常报告 + 详情表格
7. [HR 确认] HR 核实后点击"确认修正"
8. [Attendance Agent] 生成修正建议（不自动执行）
9. [Audit Agent] 记录查询和确认操作
```

### 场景 C：薪资预检

```
1. [HR 用户] 在薪资预检助手页面点击"开始本月预检"
2. [Orchestrator] 意图分类 → payroll
3. [Payroll Agent] 调用 get_attendance_summary Tool（读取考勤汇总）
4. [Payroll Agent] 调用 get_payroll_summary Tool（读取薪资规则和历史）
5. [Data Guard] 验证 SALARY_READ 权限；薪资金额字段 L4 级别处理
   → 只传聚合统计给 LLM，不传个人明细
6. [Payroll Agent] 调用 detect_payroll_anomalies Tool
   → 检测：同比异常波动 > 20%、计算结果与考勤不匹配、缺勤未扣款
7. [Payroll Agent] 调用 explain_salary_calculation Tool（LLM 生成说明）
   → "本月应发工资总额 ¥1,234,567，较上月增长 3.2%；发现 2 条异常..."
8. [前端] 显示预检报告 + 异常明细 + "确认发放"按钮
9. [HR 点击"确认发放"]
10. [Payroll Agent] 调用 request_payroll_approval Tool
    → **强制人工确认**：显示确认卡片，包含金额、人数、异常项
11. [HR 最终确认] → 记录审计日志 → 标记薪资状态为 APPROVED
```

### 场景 D：合同到期提醒

```
1. [定时任务] 每日凌晨 2:00 触发合同到期扫描
2. [Contract Agent] 调用 detect_expiring_contracts Tool
   → 参数: companyId, daysAhead=30
   → 查询 contract 表，找到 30 天内到期的合同
3. [Contract Agent] 为每份到期合同生成风险摘要
   → "员工 张三 的劳动合同将于 2026-07-15 到期，建议尽快安排续签"
4. [Contract Agent] 调用 send_notification Tool（需人工确认批量发送）
   → 通知 HR 负责人
5. [前端] HR 登录后看到通知：N 份合同即将到期
6. [HR 操作] 进入合同助手页面，查看详情，发起续签工作流
7. [Audit Agent] 记录扫描和通知操作
```

### 场景 E：员工入职

```
1. [HR 用户] 在 Agent 对话中输入："帮新员工 李四 办理入职"
2. [Orchestrator] 意图分类 → hr_service
3. [HR Service Agent] 生成入职清单：
   a. 收集必要文档（身份证复印件、学历证明、体检报告）
   b. 创建员工档案
   c. 分配部门和岗位
   d. 生成入职 Checklist
4. [前端] 显示 Checklist 交互卡片，HR 逐项确认
5. [HR 确认] 选择部门、填写工号
6. [HR Service Agent] 调用相关 Tool（需确认）：
   → create_employee (写操作，需人工确认)
   → assign_department (写操作，需人工确认)
7. [Data Guard] 验证 HR 有 EMPLOYEE_WRITE 权限
8. [前端] 显示最终确认卡片："确认创建员工 李四，工号 EMP-2026-0042，部门：技术部？"
9. [HR 最终确认] → 执行创建 → 审计记录
```

---

## 9. 安全威胁模型

| 编号 | 威胁 | 风险等级 | 缓解措施 |
|------|------|---------|---------|
| T1 | **简历 / 合同 / 邮件中的 Prompt Injection** | 高 | 外部文档内容作为 `user` 角色输入而非 `system`；本地解析不传原文给 LLM；提取字段经 schema 校验 |
| T2 | **未授权薪资访问** | 极高 | L4 字段不传给 LLM；Tool 执行前 RBAC 校验 `SALARY_READ` 权限；所有薪资访问写入审计日志 |
| T3 | **跨租户数据泄露** | 极高 | PostgreSQL RLS；`TenantAccessPolicy`；Data Guard 双重校验 tenantId；LLM 上下文中移除 tenantId |
| T4 | **Agent Tool 越权执行** | 高 | Tool Registry 白名单；参数 schema 校验；Data Guard 权限预检；写操作强制人工确认 |
| T5 | **意外薪资修改** | 极高 | 所有薪资写操作标记 `humanApprovalRequired=true`；幂等 key 防重复执行；前端二次确认 |
| T6 | **恶意文档上传** | 高 | 文件类型白名单；文件大小限制；杀毒扫描；上传与 Agent 处理隔离在独立沙箱 |
| T7 | **审计日志篡改** | 中 | `audit_log` 和 `agent_audit_log` 仅 INSERT，应用层无 UPDATE/DELETE 权限；定期归档到冷存储 |
| T8 | **LLM 过度暴露数据** | 高 | 字段级脱敏 (L3/L4)；分页限制 (size ≤ 200)；返回结果摘要而非原始数据；不将完整数据库查询结果传给 LLM |
| T9 | **LLM 幻觉导致错误法律 / 政策建议** | 中 | 合规回答必须附免责声明；所有政策引用标注来源文档和段落；RAG 结果标注置信度 |

---

## 10. 实施路线图

### Phase A：架构骨架与文档

| 类别 | 任务 |
|------|------|
| **后端** | 创建 `ihrm-agent` 模块骨架；定义 `ToolRegistry`, `ToolDefinition`, `AgentDataGuard` 接口；`LlmClient` 抽象层 |
| **前端** | 扩展 `ChatMessage` 类型支持 `toolCalls` 和 `approvalRequest` |
| **数据库** | 编写 `V7__agent_tables.sql` 迁移脚本 |
| **测试** | 单元测试: `ToolRegistry` 注册 / 查询、`AgentDataGuard` 权限校验 |
| **验收** | 模块编译通过；迁移脚本在 PostgreSQL 上执行成功；`ToolRegistry` 可注册和查询 Tool 定义 |

### Phase B：只读 HR 助手

| 类别 | 任务 |
|------|------|
| **后端** | 实现 `AgentChatController` SSE 端点；`OrchestratorAgent` 基础意图分类；`EmployeeToolAdapter` + `OrganizationToolAdapter`（只读）；`FieldMaskingService` L2/L3 脱敏 |
| **前端** | 连接真实后端替换 mock 模式；显示工具调用卡片；显示数据来源引用 |
| **数据库** | `agent_conversation` + `agent_message` 表投入使用 |
| **测试** | 集成测试: 端到端对话流程（查员工 → 返回脱敏结果）；权限拒绝测试 |
| **验收** | 用户可通过对话查询员工信息和组织结构；敏感字段正确脱敏；跨租户请求被拒绝 |

### Phase C：简历筛选工作流

| 类别 | 任务 |
|------|------|
| **后端** | 创建 `ihrm-recruitment` 模块；实现 `parse_resume`, `extract_candidate`, `match_jd` Tool；邮件 IMAP Poller（ihrm-worker） |
| **前端** | 简历筛选收件箱页面；候选人卡片 + AI 评分；人工审核操作 |
| **数据库** | `V8__recruitment_tables.sql`：candidate, job_description, interview_task |
| **测试** | 简历解析准确率测试；Prompt Injection 防护测试（恶意简历样本） |
| **验收** | 简历上传 → AI 解析 → JD 匹配 → HR 审核 → 安排面试全流程可用 |

### Phase D：考勤异常助手

| 类别 | 任务 |
|------|------|
| **后端** | `AttendanceToolAdapter`（只读）；异常检测规则引擎；月度汇总聚合 |
| **前端** | 考勤异常助手页面；异常报告可视化；修正确认交互 |
| **数据库** | 无新表（复用 `attendance_record`） |
| **测试** | 异常检测规则覆盖率测试；边界条件（跨日打卡、弹性工时） |
| **验收** | 月度考勤异常自动检测 + AI 解释 + HR 确认 |

### Phase E：薪资预检助手

| 类别 | 任务 |
|------|------|
| **后端** | `PayrollToolAdapter`（只读 + 审批请求）；异常检测；`HumanApprovalGate` 实现 |
| **前端** | 薪资预检助手页面；异常高亮表格；人工审批确认流程 |
| **数据库** | 无新表（复用 `salary_record`） |
| **测试** | 薪资字段 L4 脱敏测试（确保 LLM 不接触个人薪资明细）；人工审批流程测试 |
| **验收** | 薪资预检 → 异常检测 → 人工审批 → 审计记录完整链路 |

### Phase F：合同 / 文档助手

| 类别 | 任务 |
|------|------|
| **后端** | 创建 `ihrm-contract` 模块；到期扫描定时任务；本地文档解析（Apache Tika） |
| **前端** | 合同助手页面；到期预警列表；续签工作流 |
| **数据库** | `V9__contract_tables.sql`：contract, contract_attachment |
| **测试** | 合同到期检测准确率；文档本地处理不外泄敏感内容 |
| **验收** | 合同到期自动检测 → 通知 HR → 续签工作流启动 |

### Phase G：审计 / 人工审批加固

| 类别 | 任务 |
|------|------|
| **后端** | `AgentAuditService` 完善（全量 Tool 调用审计）；审计日志查询 API；审计日志不可变策略 |
| **前端** | 审计追踪查看器页面；人工审核队列页面 |
| **数据库** | 审计日志索引优化；归档策略 |
| **测试** | 审计完整性测试（每次 Tool 调用必有审计记录）；日志不可篡改测试 |
| **验收** | 所有 Agent 操作可追溯；人工审核队列正常运作 |

### Phase H：生产安全审查

| 类别 | 任务 |
|------|------|
| **后端** | 渗透测试（重点：Prompt Injection、跨租户泄露）；性能压测（并发对话数、LLM API 限流） |
| **前端** | XSS 防护（Markdown 渲染安全）；CSP 头配置 |
| **数据库** | RLS 策略审查；敏感数据加密（字段级加密评估） |
| **测试** | 安全扫描报告；OWASP Top 10 逐项验证 |
| **验收** | 安全审查报告无高危项；压测通过（50 并发对话，p95 < 10s） |

---

## 11. 交付物清单

### 11.1 文档

| 交付物 | 路径 | 状态 |
|--------|------|------|
| Multi-Agent 架构设计文档 | `docs/agent/v1/multi-agent-architecture.md` | 本文档 |
| 生产就绪差距分析与路线图 | `docs/agent/v1/agent-production-readiness-gap-analysis.md` | **[提议]** 剩余设计主题、优先级、风险和验收地图 |

### 11.2 提议后端包结构

```
backend-modern/ihrm-agent/src/main/java/com/ihrm/modern/agent/
  ├── api/                  # REST 控制器
  ├── orchestrator/         # 编排层
  ├── runtime/              # 执行引擎、任务管理
  ├── tool/                 # Tool 注册表、适配器
  │   └── adapters/         # 各领域 Tool Adapter
  ├── security/             # Data Guard、权限、脱敏、注入检测
  ├── audit/                # Agent 审计
  ├── memory/               # 会话记忆
  ├── rag/                  # RAG 检索
  ├── llm/                  # LLM 客户端抽象
  ├── workflow/             # 人工审批、异步调度
  └── dto/                  # 数据传输对象
```

### 11.3 提议数据库表

| 表名 | 用途 | Phase |
|------|------|-------|
| `agent_conversation` | Agent 会话 | A |
| `agent_message` | 会话消息 | A |
| `agent_audit_log` | Agent 操作审计 | A |
| `agent_task` | 异步任务 | A |
| `candidate` | 候选人 | C |
| `job_description` | 岗位描述 | C |
| `interview_task` | 面试任务 | C |
| `contract` | 员工合同 | F |
| `contract_attachment` | 合同附件 | F |
| `policy_document` | 政策文档 | B+ |

### 11.4 提议 API 端点

| 方法 | 路径 | 说明 | Phase |
|------|------|------|-------|
| POST | `/agent/chat/stream` | SSE 流式对话 | B |
| GET | `/agent/task/{id}/status` | 异步任务状态 | B |
| POST | `/agent/task/{id}/approve` | 人工审批确认 | E |
| POST | `/agent/task/{id}/reject` | 人工审批拒绝 | E |
| GET | `/agent/conversations` | 会话列表 | B |
| GET | `/agent/conversations/{id}/messages` | 会话消息历史 | B |
| GET | `/agent/audit` | Agent 审计日志查询 | G |
| GET | `/agent/review-queue` | 人工审核队列 | G |

### 11.5 提议前端路由 / 组件

| 路由 | 组件 | Phase |
|------|------|-------|
| `/agent/chat` | `AgentChatPage.vue` (增强) | B |
| `/agent/recruitment` | `RecruitmentInbox.vue` | C |
| `/agent/attendance` | `AttendanceAssistant.vue` | D |
| `/agent/payroll` | `PayrollPrecheck.vue` | E |
| `/agent/contracts` | `ContractAssistant.vue` | F |
| `/agent/approvals` | `ApprovalAssistant.vue` | E |
| `/agent/audit` | `AgentAuditViewer.vue` | G |
| `/agent/review-queue` | `HumanReviewQueue.vue` | G |

### 11.6 风险清单

| 编号 | 风险 | 影响 | 可能性 | 缓解 |
|------|------|------|--------|------|
| R1 | LLM API 不稳定/延迟高 | 用户体验下降 | 中 | 降级为规则引擎回复；LLM 多供应商 failover |
| R2 | 跨租户数据泄露 | 法律/合规事故 | 低 | 四层隔离（RLS + 应用 + Tool + LLM） |
| R3 | Prompt Injection 绕过防护 | 数据泄露/错误操作 | 中 | 多层防护 + 定期红队测试 |
| R4 | 薪资/合同信息泄露给 LLM | 隐私合规风险 | 中 | L4 字段不传 LLM；本地文档处理 |
| R5 | Agent 自动执行破坏性操作 | 数据损坏 | 低 | 写操作白名单 + 人工确认 + 幂等性 |
| R6 | LLM 生成错误法律建议 | 法律风险 | 中 | 免责声明 + RAG 引用 + 置信度标注 |

### 11.7 分阶段实施检查表

```
Phase A: 架构骨架
  □ ihrm-agent 模块创建
  □ ToolRegistry + ToolDefinition 接口
  □ AgentDataGuard 接口
  □ LlmClient 抽象层
  □ V7 迁移脚本
  □ ChatMessage 类型扩展
  □ 单元测试通过

Phase B: 只读 HR 助手
  □ AgentChatController SSE 端点
  □ OrchestratorAgent 意图分类
  □ EmployeeToolAdapter
  □ OrganizationToolAdapter
  □ FieldMaskingService
  □ 前端连接真实后端
  □ 集成测试通过
  □ 跨租户拒绝测试

Phase C: 简历筛选
  □ ihrm-recruitment 模块
  □ 简历解析 Tool
  □ JD 匹配 Tool
  □ IMAP Poller
  □ 前端收件箱页面
  □ Prompt Injection 测试

Phase D: 考勤异常助手
  □ AttendanceToolAdapter
  □ 异常检测规则
  □ 前端异常报告页面
  □ 规则覆盖率测试

Phase E: 薪资预检
  □ PayrollToolAdapter
  □ HumanApprovalGate
  □ L4 脱敏验证
  □ 前端预检页面 + 审批
  □ 人工审批流程测试

Phase F: 合同/文档
  □ ihrm-contract 模块
  □ 到期扫描任务
  □ 本地文档解析
  □ 前端合同助手页面

Phase G: 审计加固
  □ AgentAuditService 全量审计
  □ 审计查询 API
  □ 前端审计查看器
  □ 人工审核队列

Phase H: 生产安全
  □ 渗透测试
  □ 性能压测
  □ OWASP Top 10 审查
  □ 安全审查报告
```
