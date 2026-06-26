# iHRM Multi-Agent 架构补遗：Case-Driven 设计与运行时修正

> 版本：1.0  
> 日期：2026-06-27  
> 依赖文档：`docs/agent/v1/multi-agent-architecture.md` (v1)  
> 分支：`phase4-backend-modern-full-replacement`  
> 状态：架构设计——仅文档，不涉及源码变更  
> 约定：**[v1 原文]** 引用 v1 设计，**[修正]** 表示对 v1 的纠正，**[新增]** 表示本文档新增内容

---

## 目录

1. [运行时边界](#1-运行时边界)
2. [Case-Driven Multi-Agent 模型](#2-case-driven-multi-agent-模型)
3. [PayrollCase 状态机](#3-payrollcase-状态机)
4. [AttendanceAnomalyCase 状态机](#4-attendanceanomalycase-状态机)
5. [Hook 生命周期设计](#5-hook-生命周期设计)
6. [Agent Run / Event / Audit 数据模型](#6-agent-run--event--audit-数据模型)
7. [Email Ingress Provider](#7-email-ingress-provider)
8. [确定性规则边界](#8-确定性规则边界)
9. [前端 Case Workbench](#9-前端-case-workbench)
10. [修订实施路线图](#10-修订实施路线图)

---

## 1. 运行时边界

### 1.1 v1 修正说明

**[v1 原文]** v1 将 Agent 框架设计为 `ihrm-agent` Spring Boot 模块，以 Java 实现编排层和 Tool Adapter。

**[修正]** 实际实施方向为：

1. **Python 原型先行**——快速验证编排逻辑、Tool 调用链路和 Hook 机制
2. **Node.js / TypeScript 生产 Agent Runtime**——长期生产运行时
3. **Spring Boot backend-modern 保持不变**——作为权威业务系统，Agent 通过 HTTP API 调用它，不在其中嵌入 Agent 逻辑
4. **Python Tool Service 可长期保留**——简历解析、OCR、向量检索等 Python 生态更成熟的能力作为独立微服务

### 1.2 组件职责矩阵

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Vue3 frontend-vue3                          │
│  Agent Chat · Case Workbench · Human Approval · Audit Viewer         │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ SSE / REST / WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│            Agent Runtime (Phase 1: Python → Phase 6: Node.js/TS)     │
│  Orchestrator · Case FSM · Hook Engine · LLM Client · Audit Writer   │
│  Intent Classifier · Conversation Memory · Rate Limiter              │
└───────┬──────────────────────────┬──────────────────┬────────────────┘
        │ HTTP API (bearer token   │ gRPC / HTTP      │ SQL / Redis
        │ passthrough)             │                  │
        ▼                          ▼                  ▼
┌───────────────────┐  ┌─────────────────────┐  ┌──────────────┐
│ Spring Boot       │  │ Python Tool Service  │  │ PostgreSQL   │
│ backend-modern    │  │ (optional, long-term)│  │ + Redis / MQ │
│                   │  │                      │  │              │
│ 权威业务系统：      │  │ 简历解析 (Tika/OCR)  │  │ agent_case   │
│ · Employee CRUD   │  │ 文档分类             │  │ agent_run    │
│ · Attendance R/W  │  │ 向量嵌入/检索         │  │ agent_event  │
│ · Payroll R/W     │  │ 政策 RAG             │  │ agent_step   │
│ · Approval (Flow) │  │ 邮件解析             │  │ ...          │
│ · RBAC / Tenant   │  │                      │  │              │
│ · Audit Log       │  │                      │  │              │
│ · File Storage    │  │                      │  │              │
└───────────────────┘  └─────────────────────┘  └──────────────┘
```

### 1.3 各组件详细职责

#### Spring Boot backend-modern **[现有，不修改]**

| 职责 | 说明 |
|------|------|
| HR 业务数据 CRUD | employee, attendance_record, salary_record, social_security_record, approval_case |
| 租户隔离 | `TenantAccessPolicy` + PostgreSQL RLS |
| RBAC | `AuthenticatedPrincipal` + permissionCodes + DataScope (SELF/DEPARTMENT/COMPANY/SUBSIDIARY/GROUP) |
| 认证 | `BearerSessionAuthenticationFilter` + `RedisSessionTokenService` |
| 审计 | `AuditLogService` → `audit_log` 表 |
| 文件存储 | `LocalFileObjectStorageService` → `file_object` 表 |
| 审批引擎 | `ApprovalCaseEntity` + Flowable (`process_definition_key`, `process_instance_id`) |
| 报表 | `ReportingReadService` (attendance/salary cross-domain) |

Agent Runtime 不在 backend-modern 中添加任何代码。Agent 通过 backend-modern 暴露的 REST API 进行数据读写，复用用户的 Bearer Token 进行鉴权。

#### Node.js / TypeScript Agent Runtime **[新增，生产目标]**

| 职责 | 说明 |
|------|------|
| Case 编排 | Case FSM 状态机驱动，非自由对话 |
| Agent 调度 | Orchestrator → Sub-Agent → Tool 调用链路 |
| Hook 引擎 | 16 个生命周期 Hook，权限预检 / 审计 / 审批门控 |
| LLM 客户端 | 意图分类、摘要生成、解释生成（不做业务决策） |
| 会话管理 | 对话上下文、Case 上下文 |
| SSE 流式响应 | `POST /agent/chat/stream`, `POST /agent/case/{id}/stream` |
| 限流 / 重试 | 每租户限流、LLM API 重试 |

#### Python Prototype **[新增，Phase 1–5]**

| 职责 | 说明 |
|------|------|
| 快速验证 | 编排逻辑、状态机转换、Hook 机制、Tool 调用链路 |
| 技术选型验证 | LLM SDK 集成、SSE 流、邮件解析 |
| 测试用例驱动 | 先写 Case 场景测试，再实现编排逻辑 |
| 生命周期 | Phase 1–5 为主力运行时；Phase 6 起逐步迁移到 Node.js/TS |

#### Python Tool Service **[新增，可长期保留]**

| 职责 | 说明 |
|------|------|
| 简历解析 | Apache Tika / PaddleOCR / pdfplumber |
| 文档分类 | 规则 + 轻量 ML 模型 |
| 向量嵌入与检索 | sentence-transformers / Qdrant |
| 政策 RAG | 公司政策文档的向量化检索 |
| 邮件解析 | email/imaplib 解析附件 |

**[提议]** 企业知识库摄取与切分细节见 `docs/agent/v1/enterprise-knowledge-base-chunking-design.md`。Python Tool Service 可承担 OCR、版面解析、表格抽取、图片 caption、embedding 生成和原型检索；生产 TS Runtime 负责队列编排、权限过滤、Context Pack 装配和 Vue3 进度推送。

即使生产运行时迁移到 Node.js/TS，这些 Python 工具仍作为独立 HTTP 微服务保留——Python 生态在 NLP/CV/ML 领域的库成熟度远高于 Node.js。

#### PostgreSQL **[现有 + 扩展]**

- **[现有]** 15 张业务表 + RLS
- **[新增]** Agent 专属表（`agent_case`, `agent_run`, `agent_step`, `agent_event` 等——见 §6）
- Agent 表也启用 RLS，复用 `tenant_id` 隔离

#### Redis / MQ **[现有 + 扩展]**

- **[现有]** Session Token 存储
- **[新增]** Case 状态缓存、限流计数器、异步任务队列
- MQ 可选 Redis Streams 或 RabbitMQ，用于 Case 事件发布和 Python Tool Service 异步调用

#### Vue3 frontend-vue3 **[现有 + 扩展]**

- **[现有]** Agent Chat UI (`features/agent-chat/`)
- **[新增]** Case Workbench（见 §9）

---

## 2. Case-Driven Multi-Agent 模型

### 2.1 v1 修正说明

**[v1 原文]** v1 设计以"对话消息"为核心交互单位——用户发消息，Orchestrator 意图分类，Sub-Agent 执行 Tool，返回回复。这是 free-form agent chatting 模式。

**[修正]** Multi-Agent 必须是 **Case-Driven（案件驱动）+ State-Machine-Driven（状态机驱动）**：

- **Case** 是核心工作单元，具有明确的生命周期（创建 → 状态转换 → 完成/取消）
- 每个 Case 类型有自己的**有限状态机（FSM）**，定义合法的状态转换路径
- Agent 对话是 Case 的**交互界面**，不是 Case 本身
- 状态转换由**确定性规则**驱动，LLM 只负责摘要和解释（见 §8）

### 2.2 Case 定义

```
Case = {
    id:          UUID
    case_type:   CaseType           -- 枚举，14 种
    tenant_id:   UUID               -- 租户隔离
    company_id:  UUID               -- 公司隔离
    state:       string             -- 当前 FSM 状态
    priority:    LOW | NORMAL | HIGH | URGENT
    created_by:  UUID               -- 创建者 user_id
    assigned_to: UUID?              -- 当前负责人
    subject_id:  UUID?              -- 关联主体（employee_id / candidate_id）
    payload:     JSONB              -- Case 类型特有的数据
    parent_case_id: UUID?           -- 父 Case（级联场景）
    created_at:  timestamptz
    updated_at:  timestamptz
    closed_at:   timestamptz?
}
```

### 2.3 14 种 Case 类型

| 编号 | Case 类型 | 触发方式 | 核心状态流 | 关联 Agent |
|------|----------|---------|-----------|-----------|
| C01 | **RecruitmentCase** | 邮件到达 / HR 手动创建 | RECEIVED → PARSED → MATCHED → HR_REVIEW → INTERVIEW_SCHEDULED → OFFER → CLOSED | Recruitment Agent |
| C02 | **AttendanceAnomalyCase** | 每日定时检测 / 设备同步 | DETECTED → PENDING_DEVICE_SYNC → EMPLOYEE_APPEAL → EVIDENCE_COLLECTION → HR_REVIEW → MANAGER_REVIEW → CORRECTED / CONFIRMED → LOCKED | Attendance Agent |
| C03 | **PayrollCase** | 月度定时触发（公司级） | TRIGGERED → ATTENDANCE_SNAPSHOT → HR_REVIEW → LEADER_REVIEW → FINANCE_FUND_CHECK → FINANCE_APPROVAL → FINAL_APPROVAL → LOCKED → PAYSLIP_GENERATED → READY_FOR_PAYMENT → DONE | Payroll Agent |
| C04 | **ContractCase** | 到期扫描 / HR 手动 | EXPIRING_DETECTED → HR_NOTIFIED → RENEWAL_INITIATED → NEGOTIATION → SIGNED → ARCHIVED | Contract Agent |
| C05 | **OnboardingCase** | HR 创建新员工 | INITIATED → DOCS_COLLECTION → PROFILE_CREATED → DEPARTMENT_ASSIGNED → CHECKLIST_PENDING → HR_CONFIRMED → COMPLETED | HR Service Agent |
| C06 | **ProbationCase** | 入职后自动创建 | STARTED → MIDTERM_REVIEW → FINAL_REVIEW → PASS / EXTEND / TERMINATE | HR Service Agent |
| C07 | **EmployeeChangeCase** | HR / 员工发起 | REQUESTED → HR_REVIEW → APPROVAL_PENDING → APPROVED → EXECUTED → COMPLETED | HR Service + Approval Agent |
| C08 | **LeaveOvertimeCase** | 员工申请 | SUBMITTED → MANAGER_REVIEW → HR_REVIEW → APPROVED / REJECTED → RECORDED | Approval Agent |
| C09 | **OffboardingCase** | HR 发起 | INITIATED → HANDOVER_PENDING → ASSET_RETURN → FINAL_SETTLEMENT → EXIT_INTERVIEW → COMPLETED | HR Service Agent |
| C10 | **DocumentRequestCase** | 员工 / HR 请求 | REQUESTED → GENERATED → HR_REVIEW → DELIVERED | Contract/Document Agent |
| C11 | **AccessReviewCase** | 定时 / 安全事件 | TRIGGERED → DATA_COLLECTED → ANOMALIES_DETECTED → REVIEW_PENDING → REMEDIATED → CLOSED | Data Guard Agent |
| C12 | **DataQualityCase** | 定时扫描 | SCANNED → ISSUES_FOUND → HR_REVIEW → CORRECTED → VERIFIED | HR Service Agent |
| C13 | **EscalationCase** | Agent 或人工触发 | ESCALATED → ASSIGNED → INVESTIGATING → RESOLVED / CANCELLED | Orchestrator |
| C14 | **PolicyVersionCase** | 管理员上传新政策 | UPLOADED → PARSED → INDEXED → REVIEW → PUBLISHED → SUPERSEDED | Compliance Agent |

### 2.4 Case 与对话的关系

```
Conversation (对话)           Case (案件)
┌──────────┐               ┌──────────────┐
│ msg_1    │──creates──→   │ PayrollCase  │
│ msg_2    │──observes──→  │  state: ...  │
│ msg_3    │──triggers──→  │  transition  │
│ ...      │               │  ...         │
└──────────┘               └──────────────┘
     ↑                           │
     └───── SSE updates ─────────┘
```

- 一次对话可以创建多个 Case
- 一个 Case 可以跨越多次对话
- 对话中的 Agent 回复是基于 Case 状态的摘要/解释
- Case 状态转换独立于对话——定时任务也能推进 Case

### 2.5 Case 优先级与 SLA

| 优先级 | SLA (响应) | SLA (解决) | 示例 |
|--------|----------|----------|------|
| URGENT | 15 min | 4 h | 薪资发放异常、数据泄露 |
| HIGH | 1 h | 24 h | 合同到期、考勤异常 |
| NORMAL | 4 h | 72 h | 入职办理、文档请求 |
| LOW | 24 h | 1 week | 政策更新、数据质量扫描 |

---

## 3. PayrollCase 状态机

### 3.1 设计原则

> **硬约束：自动触发只启动薪资准备流程，绝不自动支付薪资。**
> 所有金额计算由确定性规则引擎执行，LLM 仅生成解释文本。

### 3.2 状态机图

```
                              ┌─────────────────────────────────────┐
                              │ company payroll_cycle_config        │
                              │ (day_of_month, cutoff_day, tz)     │
                              └────────────┬────────────────────────┘
                                           │ cron trigger (每月 cutoff_day)
                                           ▼
                              ┌────────────────────┐
                              │   TRIGGERED         │
                              │   创建 PayrollCase   │
                              └─────────┬──────────┘
                                        │ auto
                                        ▼
                              ┌────────────────────┐
                              │ ATTENDANCE_SNAPSHOT │
                              │ 冻结考勤快照         │
                              │ 检测未结算异常       │
                              └─────────┬──────────┘
                                ┌───────┴───────┐
                          异常存在│               │ 无异常
                                ▼               ▼
                   ┌──────────────────┐  ┌──────────────────┐
                   │ ATTENDANCE_HOLD  │  │ HR_REVIEW        │
                   │ 等待异常处理完成   │  │ HR 审核薪资表     │
                   └───────┬──────────┘  └──────┬───────────┘
                           │ 异常全部解决         │ HR 确认
                           └───────┬─────────────┘
                                   ▼
                          ┌──────────────────┐
                          │ LEADER_REVIEW    │
                          │ 部门领导审核       │
                          └──────┬───────────┘
                                 │ 领导确认
                                 ▼
                          ┌──────────────────┐
                          │ FINANCE_FUND_CHECK│
                          │ 财务检查资金状况   │
                          └──────┬───────────┘
                          ┌──────┴───────────┐
                     资金就绪│                │ 资金不足
                          ▼                  ▼
                 ┌──────────────┐   ┌────────────────────┐
                 │FINANCE_APPR  │   │FUND_ALLOCATION_REQ │
                 │财务审批        │   │请求资金划拨          │
                 └──────┬───────┘   └────────┬───────────┘
                        │                    │ 资金到位
                        │                    ▼
                        │           ┌──────────────────┐
                        │           │ FUNDS_NOT_READY   │
                        │           │ 等待资金确认        │
                        │           └────────┬──────────┘
                        │                    │ 资金确认
                        └────────┬───────────┘
                                 ▼
                          ┌──────────────────┐
                          │ FINAL_APPROVAL   │
                          │ 最终人工审批       │
                          │ (不可跳过)        │
                          └──────┬───────────┘
                                 │ 最终确认
                                 ▼
                          ┌──────────────────┐
                          │ LOCKED           │
                          │ 薪资锁定          │
                          │ (不可修改)        │
                          └──────┬───────────┘
                                 │ auto
                                 ▼
                          ┌──────────────────┐
                          │ PAYSLIP_GENERATED│
                          │ 工资条生成         │
                          └──────┬───────────┘
                                 │ auto
                                 ▼
                          ┌──────────────────┐
                          │READY_FOR_PAYMENT │
                          │ 等待付款执行       │
                          │ (Agent 不执行付款) │
                          └──────┬───────────┘
                                 │ 外部支付系统回调
                                 ▼
                          ┌──────────────────┐
                          │ DONE             │
                          │ 本月薪资结算完成   │
                          └──────────────────┘
```

### 3.3 状态转换表

| 当前状态 | 事件 | 下一状态 | 执行者 | 确定性/LLM |
|---------|------|---------|--------|-----------|
| — | cron 触发 | TRIGGERED | 系统定时 | 确定性 |
| TRIGGERED | 开始考勤快照 | ATTENDANCE_SNAPSHOT | Agent (auto) | 确定性 |
| ATTENDANCE_SNAPSHOT | 存在未结算异常 | ATTENDANCE_HOLD | 规则引擎 | 确定性 |
| ATTENDANCE_SNAPSHOT | 无异常 | HR_REVIEW | 规则引擎 | 确定性 |
| ATTENDANCE_HOLD | 所有异常已解决 | HR_REVIEW | 系统检测 | 确定性 |
| HR_REVIEW | HR 确认 | LEADER_REVIEW | HR 人工 | 人工决策 |
| HR_REVIEW | HR 驳回 | ATTENDANCE_SNAPSHOT | HR 人工 | 人工决策 |
| LEADER_REVIEW | 领导确认 | FINANCE_FUND_CHECK | 领导人工 | 人工决策 |
| LEADER_REVIEW | 领导驳回 | HR_REVIEW | 领导人工 | 人工决策 |
| FINANCE_FUND_CHECK | 资金就绪 | FINANCE_APPROVAL | 规则引擎 | 确定性 |
| FINANCE_FUND_CHECK | 资金不足 | FUND_ALLOCATION_REQ | 规则引擎 | 确定性 |
| FUND_ALLOCATION_REQ | 划拨完成 | FINANCE_APPROVAL | 财务人工 | 人工决策 |
| FUND_ALLOCATION_REQ | 划拨失败 | FUNDS_NOT_READY | 系统 | 确定性 |
| FUNDS_NOT_READY | 资金到位确认 | FINANCE_APPROVAL | 财务人工 | 人工决策 |
| FINANCE_APPROVAL | 财务审批通过 | FINAL_APPROVAL | 财务人工 | 人工决策 |
| FINANCE_APPROVAL | 财务驳回 | HR_REVIEW | 财务人工 | 人工决策 |
| FINAL_APPROVAL | 最终确认 | LOCKED | 授权审批人 | 人工决策 |
| LOCKED | 自动 | PAYSLIP_GENERATED | Agent (auto) | 确定性 |
| PAYSLIP_GENERATED | 自动 | READY_FOR_PAYMENT | Agent (auto) | 确定性 |
| READY_FOR_PAYMENT | 支付系统回调 | DONE | 外部系统 | 确定性 |

### 3.4 公司级薪资周期配置

**[新增]** `payroll_cycle_config` 表：

```sql
CREATE TABLE payroll_cycle_config (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid NOT NULL REFERENCES company(id),
    cutoff_day smallint NOT NULL DEFAULT 25,   -- 考勤截止日（每月 N 号）
    pay_day smallint NOT NULL DEFAULT 10,       -- 发薪日（次月 N 号）
    timezone varchar(64) NOT NULL DEFAULT 'Asia/Shanghai',
    auto_trigger_enabled boolean NOT NULL DEFAULT true,
    require_leader_review boolean NOT NULL DEFAULT true,
    require_finance_approval boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, company_id)
);
ALTER TABLE payroll_cycle_config ENABLE ROW LEVEL SECURITY;
```

### 3.5 LLM 在 PayrollCase 中的角色

| LLM 可以做 | LLM 不可以做 |
|-----------|-------------|
| 解释薪资计算过程（文字说明） | 计算或修改任何金额 |
| 汇总异常检测结果为自然语言 | 决定异常是否需要修正 |
| 生成 HR 审核摘要 | 自动审批或驳回 |
| 回答 HR 关于薪资规则的问题 | 执行薪资锁定或解锁 |
| 生成工资条的文字描述 | 触发支付 |

---

## 4. AttendanceAnomalyCase 状态机

### 4.1 设计原则

> **硬约束：考勤责任判定（迟到 / 旷工 / 正常）由确定性规则引擎执行，LLM 仅生成异常说明文本。**
> 设备同步延迟必须有缓冲期，不能因为数据延迟误判员工。

### 4.2 时间线模型

```
source_punch_time    设备端记录的实际打卡时间（由考勤设备写入）
ingested_at          系统收到打卡记录的时间（可能因设备离线而延迟）
detection_window     异常检测窗口（check-in 后 30 min / check-out 后 60 min）
device_sync_grace    设备同步宽限期（默认 4 小时，可配置）
appeal_deadline      员工申诉截止时间（次日 18:00）
```

### 4.3 状态机图

```
                    定时检测（每日 check-in/check-out 窗口后）
                              │
                              ▼
                    ┌──────────────────┐
                    │ DETECTED          │ 规则引擎检测到异常
                    │ anomaly_type:     │ (LATE / MISSING_PUNCH / EARLY_LEAVE /
                    │                   │  OVERTIME_ANOMALY / LEAVE_CONFLICT)
                    └─────────┬────────┘
                              │
                     ┌────────┴──────────┐
                     │                   │
              ingested_at -             ingested_at -
              source_punch_time         source_punch_time
              > device_sync_grace       ≤ device_sync_grace
                     │                   │
                     ▼                   ▼
          ┌────────────────────┐  ┌──────────────────┐
          │ CONFIRMED_ANOMALY  │  │ PENDING_DEVICE_   │
          │ 确认为真实异常       │  │ SYNC              │
          │                    │  │ 等待设备数据补充    │
          └────────┬───────────┘  └────────┬─────────┘
                   │                       │
                   │              ┌────────┴──────────┐
                   │         补充数据到达│            超时(24h)│
                   │              ▼                   ▼
                   │    ┌──────────────┐   ┌──────────────┐
                   │    │ RE_EVALUATE  │   │ CONFIRMED_   │
                   │    │ 重新评估      │   │ ANOMALY      │
                   │    └──────┬───────┘   └──────┬───────┘
                   │      ┌────┴────┐             │
                   │  正常 │        │ 仍异常        │
                   │      ▼        ▼              │
                   │   AUTO_      ┌───────────────┘
                   │   RESOLVED   │
                   │      │       │
                   │      ▼       ▼
                   │    CLOSED  ┌──────────────────┐
                   │           │ EMPLOYEE_APPEAL   │
                   │           │ 员工申诉窗口       │
                   │           │ (次日 18:00 截止)  │
                   └──────→    └────────┬─────────┘
                                ┌───────┴──────────┐
                          员工申诉│                 │ 无申诉 / 超时
                                ▼                  ▼
                     ┌─────────────────┐  ┌──────────────────┐
                     │EVIDENCE_COLLECT │  │ HR_REVIEW         │
                     │证据收集          │  │ HR 直接审核        │
                     │(截图/说明/审批单)│  └──────┬───────────┘
                     └────────┬────────┘         │
                              │ 证据齐全          │
                              ▼                   │
                     ┌──────────────────┐         │
                     │ HR_REVIEW        │◄────────┘
                     │ HR 审核异常       │
                     └────────┬─────────┘
                       ┌──────┴──────────┐
                  接受申诉│               │ 维持异常
                       ▼               ▼
              ┌──────────────┐  ┌──────────────────┐
              │ CORRECTED    │  │ MANAGER_REVIEW   │
              │ 异常已修正    │  │ 部门经理复核      │
              └──────┬───────┘  └────────┬─────────┘
                     │              ┌────┴────┐
                     │         确认异│常      │ 同意修正
                     │              ▼        ▼
                     │       CONFIRMED   CORRECTED
                     │           │          │
                     └─────┬─────┴──────────┘
                           ▼
                    ┌──────────────────┐
                    │ LOCKED_FOR_      │ 薪资结算前锁定
                    │ PAYROLL          │ (不可再修改)
                    └──────┬───────────┘
                           │ PayrollCase 引用
                           ▼
                        CLOSED
```

### 4.4 状态转换表

| 当前状态 | 事件 | 下一状态 | 执行者 | 确定性/LLM |
|---------|------|---------|--------|-----------|
| — | 定时检测发现异常 | DETECTED | 规则引擎 | 确定性 |
| DETECTED | `ingested_at - source_punch_time ≤ grace` | PENDING_DEVICE_SYNC | 规则引擎 | 确定性 |
| DETECTED | `ingested_at - source_punch_time > grace` | CONFIRMED_ANOMALY | 规则引擎 | 确定性 |
| PENDING_DEVICE_SYNC | 补充数据到达 | RE_EVALUATE | 系统 | 确定性 |
| PENDING_DEVICE_SYNC | 超时 (24h) | CONFIRMED_ANOMALY | 系统 | 确定性 |
| RE_EVALUATE | 重评结果正常 | AUTO_RESOLVED → CLOSED | 规则引擎 | 确定性 |
| RE_EVALUATE | 重评仍异常 | CONFIRMED_ANOMALY | 规则引擎 | 确定性 |
| CONFIRMED_ANOMALY | 进入申诉窗口 | EMPLOYEE_APPEAL | 系统 | 确定性 |
| EMPLOYEE_APPEAL | 员工提交申诉+证据 | EVIDENCE_COLLECTION | 员工 | 人工 |
| EMPLOYEE_APPEAL | 无申诉 / 超时 | HR_REVIEW | 系统 | 确定性 |
| EVIDENCE_COLLECTION | 证据齐全 | HR_REVIEW | 系统 | 确定性 |
| HR_REVIEW | HR 接受申诉 | CORRECTED | HR | 人工决策 |
| HR_REVIEW | HR 维持异常 | MANAGER_REVIEW | HR | 人工决策 |
| MANAGER_REVIEW | 经理确认异常 | CONFIRMED → LOCKED_FOR_PAYROLL | 经理 | 人工决策 |
| MANAGER_REVIEW | 经理同意修正 | CORRECTED → LOCKED_FOR_PAYROLL | 经理 | 人工决策 |
| LOCKED_FOR_PAYROLL | PayrollCase 完成 | CLOSED | 系统 | 确定性 |

### 4.5 异常类型枚举

| 类型 | 检测规则 | 说明 |
|------|---------|------|
| `LATE_ARRIVAL` | `check_in_time > scheduled_start + tolerance` | 迟到 |
| `MISSING_PUNCH` | 有上班无下班，或有下班无上班 | 漏打卡 |
| `EARLY_LEAVE` | `check_out_time < scheduled_end - tolerance` | 早退 |
| `OVERTIME_ANOMALY` | 加班时长异常（> 法定上限 or 连续 > N 天） | 加班异常 |
| `LEAVE_CONFLICT` | 打卡记录与已批准的请假/出差时段重叠 | 请假/出差冲突 |
| `DEVICE_SYNC_DELAY` | `ingested_at - source_punch_time > threshold` | 设备同步延迟 |

---

## 5. Hook 生命周期设计

### 5.1 概述

**[新增]** Hook 引擎是 Agent Runtime 的核心安全和审计机制。每个 Hook 在执行链路的特定阶段被调用，可以观察、记录、拦截或修改执行流程。

### 5.2 Hook 定义

```
Hook = {
    name:           string
    phase:          'before' | 'after' | 'on_error' | 'on_cancel'
    context_input:  object       -- Hook 接收的上下文
    decision_output: object?     -- Hook 返回的决策（可选）
    can_block:      boolean      -- 是否可以阻止执行继续
    audit_mandatory: boolean     -- 是否必须写审计日志
}
```

### 5.3 16 个 Hook 详细定义

#### H01: `before_run`

| 属性 | 值 |
|------|---|
| **目的** | Agent Run 开始前的全局预检：认证验证、租户上下文注入、限流检查 |
| **上下文输入** | `{user_id, tenant_id, company_id, conversation_id, input_message, ip_address}` |
| **决策输出** | `{allow: boolean, reject_reason?: string, rate_limit_remaining?: number}` |
| **可阻止执行** | 是——认证失败或限流超限时阻止 |
| **审计必须** | 是——所有 Run 启动/拒绝均需记录 |
| **HR SaaS 用例** | 拦截未认证请求；每租户每分钟最多 60 次 Agent 调用；检测异常高频调用模式 |

#### H02: `after_run`

| 属性 | 值 |
|------|---|
| **目的** | Agent Run 完成后的收尾：统计记录、资源清理、会话摘要更新 |
| **上下文输入** | `{run_id, duration_ms, steps_count, tools_called, tokens_used, final_state}` |
| **决策输出** | 无（观察者模式） |
| **可阻止执行** | 否 |
| **审计必须** | 是——Run 完成/失败的最终状态 |
| **HR SaaS 用例** | 统计每月 Agent 使用量（按租户/公司计费）；慢查询告警 |

#### H03: `before_agent_call`

| 属性 | 值 |
|------|---|
| **目的** | Orchestrator 调用 Sub-Agent 前的权限和资源预检 |
| **上下文输入** | `{agent_type, case_id, case_state, user_permissions, intended_tools}` |
| **决策输出** | `{allow: boolean, filtered_tools?: string[], reject_reason?: string}` |
| **可阻止执行** | 是——用户无权使用目标 Agent 时阻止 |
| **审计必须** | 是 |
| **HR SaaS 用例** | 普通员工不可调用 Payroll Agent；实习生不可调用 Compliance Agent |

#### H04: `after_agent_call`

| 属性 | 值 |
|------|---|
| **目的** | Sub-Agent 执行完成后的结果验证和清理 |
| **上下文输入** | `{agent_type, case_id, result_summary, errors, duration_ms}` |
| **决策输出** | `{accept_result: boolean, override_result?: object}` |
| **可阻止执行** | 否（已执行完成） |
| **审计必须** | 是 |
| **HR SaaS 用例** | 检测 Agent 返回结果中是否意外包含 L4 级敏感数据 |

#### H05: `before_tool_call`

| 属性 | 值 |
|------|---|
| **目的** | Tool 调用前的参数校验、权限检查、幂等性检查 |
| **上下文输入** | `{tool_name, tool_params, risk_level, user_permissions, idempotency_key, case_id}` |
| **决策输出** | `{allow: boolean, sanitized_params?: object, reject_reason?: string, cached_result?: object}` |
| **可阻止执行** | 是——权限不足、参数非法、幂等重复时阻止 |
| **审计必须** | 是 |
| **HR SaaS 用例** | 校验 `SALARY_READ` 权限；验证 employee_id 属于当前 tenant；防止同一分钟内重复调用薪资计算 |

#### H06: `after_tool_call`

| 属性 | 值 |
|------|---|
| **目的** | Tool 返回结果的脱敏、行数限制、格式标准化 |
| **上下文输入** | `{tool_name, raw_result, result_row_count, duration_ms, case_id}` |
| **决策输出** | `{masked_result: object, warnings?: string[]}` |
| **可阻止执行** | 否（结果已产生，但可修改后再传给 LLM） |
| **审计必须** | 是 |
| **HR SaaS 用例** | 手机号脱敏 `138****5678`；薪资金额替换为 `[REDACTED]`；结果行数 > 200 时截断并标注 |

#### H07: `on_tool_error`

| 属性 | 值 |
|------|---|
| **目的** | Tool 调用失败时的错误分类、重试判定、用户通知 |
| **上下文输入** | `{tool_name, error_type, error_message, retry_count, case_id}` |
| **决策输出** | `{retry: boolean, fallback_tool?: string, user_message: string}` |
| **可阻止执行** | 否（已失败） |
| **审计必须** | 是 |
| **HR SaaS 用例** | backend-modern 超时 → 重试 1 次；认证过期 → 提示重新登录；数据不存在 → 友好提示 |

#### H08: `before_sensitive_data_access`

| 属性 | 值 |
|------|---|
| **目的** | 访问 L3/L4 级敏感数据前的额外权限验证和记录 |
| **上下文输入** | `{data_type, sensitivity_level, target_employee_id, requesting_user_id, purpose}` |
| **决策输出** | `{allow: boolean, masking_rules: MaskingRule[], reject_reason?: string}` |
| **可阻止执行** | 是——无权访问敏感数据时阻止 |
| **审计必须** | 是——所有敏感数据访问必须记录 |
| **HR SaaS 用例** | 薪资数据仅 HR 主管 + 财务可见；员工个人身份证号仅本人和 HR 可见 |

#### H09: `before_evidence_access`

| 属性 | 值 |
|------|---|
| **目的** | 访问 Case 相关证据（申诉截图、考勤原始数据、合同扫描件）前的权限和完整性检查 |
| **上下文输入** | `{case_id, evidence_type, evidence_file_id, requesting_user_id}` |
| **决策输出** | `{allow: boolean, integrity_verified: boolean}` |
| **可阻止执行** | 是 |
| **审计必须** | 是 |
| **HR SaaS 用例** | 考勤申诉证据仅当事员工、HR、经理可见；合同文件仅 HR 和法务可见 |

#### H10: `before_human_approval`

| 属性 | 值 |
|------|---|
| **目的** | 向人工发送审批请求前的完整性检查——确保审批上下文充分 |
| **上下文输入** | `{case_id, case_type, approval_type, approver_user_id, action_summary, affected_records_count}` |
| **决策输出** | `{ready: boolean, missing_context?: string[]}` |
| **可阻止执行** | 是——上下文不完整时阻止（防止审批人收到信息不全的请求） |
| **审计必须** | 是 |
| **HR SaaS 用例** | 薪资审批必须附带考勤快照摘要；合同续签审批必须附带到期日和当前条款 |

#### H11: `after_human_approval`

| 属性 | 值 |
|------|---|
| **目的** | 人工审批完成后的决策记录和后续动作触发 |
| **上下文输入** | `{case_id, approval_id, decision (APPROVED/REJECTED), approver_user_id, comment, decision_at}` |
| **决策输出** | `{next_state: string, notify_users?: UUID[]}` |
| **可阻止执行** | 否 |
| **审计必须** | 是——审批决策不可篡改 |
| **HR SaaS 用例** | 薪资审批通过 → 状态转 LOCKED；考勤异常驳回 → 通知员工 |

#### H12: `before_case_transition`

| 属性 | 值 |
|------|---|
| **目的** | Case FSM 状态转换前的合法性验证——确保转换符合状态机定义 |
| **上下文输入** | `{case_id, case_type, current_state, target_state, trigger_event, trigger_user_id}` |
| **决策输出** | `{allow: boolean, reject_reason?: string}` |
| **可阻止执行** | 是——非法状态转换被拒绝 |
| **审计必须** | 是——所有状态转换（成功和失败）均需记录 |
| **HR SaaS 用例** | 阻止从 LOCKED 回退到 HR_REVIEW（薪资锁定后不可逆）；阻止跳过 FINAL_APPROVAL |

#### H13: `after_case_transition`

| 属性 | 值 |
|------|---|
| **目的** | 状态转换完成后的通知、关联 Case 更新、定时器设置 |
| **上下文输入** | `{case_id, case_type, old_state, new_state, transition_at}` |
| **决策输出** | `{notifications?: Notification[], timers?: Timer[], child_cases?: CaseCreate[]}` |
| **可阻止执行** | 否 |
| **审计必须** | 是 |
| **HR SaaS 用例** | 考勤异常 → EMPLOYEE_APPEAL 时设置 24h 超时定时器；PayrollCase → LOCKED 时触发工资条生成 |

#### H14: `before_final_response`

| 属性 | 值 |
|------|---|
| **目的** | Agent 最终回复发送给用户前的内容安全检查 |
| **上下文输入** | `{response_text, tool_results_included, case_references, sensitivity_level}` |
| **决策输出** | `{allow: boolean, redacted_text?: string}` |
| **可阻止执行** | 是——检测到敏感数据泄露时阻止 |
| **审计必须** | 否（仅异常时） |
| **HR SaaS 用例** | 检测回复中是否意外包含身份证号/银行卡号格式；检测 LLM 幻觉的政策/法律条款 |

#### H15: `on_audit_log`

| 属性 | 值 |
|------|---|
| **目的** | 审计日志写入时的格式标准化和外部告警 |
| **上下文输入** | `{audit_entry, severity, category}` |
| **决策输出** | `{external_alert?: boolean, alert_channel?: string}` |
| **可阻止执行** | 否（审计日志本身不可阻止） |
| **审计必须** | N/A（自身就是审计） |
| **HR SaaS 用例** | `severity=CRITICAL` 时触发 Slack/钉钉告警；薪资操作日志同步到合规系统 |

#### H16: `on_run_cancelled`

| 属性 | 值 |
|------|---|
| **目的** | Agent Run 被取消时的资源清理和补偿 |
| **上下文输入** | `{run_id, cancel_reason, steps_completed, pending_tool_calls}` |
| **决策输出** | `{compensate_actions?: Action[]}` |
| **可阻止执行** | 否 |
| **审计必须** | 是 |
| **HR SaaS 用例** | 取消时释放挂起的审批请求；回滚未完成的 Case 状态转换 |

### 5.4 Hook 执行顺序

```
before_run
  │
  ├─ before_agent_call
  │    │
  │    ├─ before_tool_call
  │    │    ├─ [before_sensitive_data_access]  (如涉及 L3/L4 数据)
  │    │    ├─ [before_evidence_access]         (如涉及证据文件)
  │    │    └─ Tool 执行
  │    │         ├─ after_tool_call             (成功)
  │    │         └─ on_tool_error               (失败)
  │    │
  │    ├─ [before_human_approval]              (如需人工审批)
  │    │    └─ [after_human_approval]
  │    │
  │    ├─ [before_case_transition]
  │    │    └─ [after_case_transition]
  │    │
  │    └─ after_agent_call
  │
  ├─ before_final_response
  │
  ├─ on_audit_log                              (贯穿全程)
  │
  └─ after_run
       └─ [on_run_cancelled]                   (如被取消)
```

---

## 6. Agent Run / Event / Audit 数据模型

### 6.1 v1 修正说明

**[v1 原文]** v1 定义了 `agent_conversation`, `agent_message`, `agent_audit_log`, `agent_task` 四张表。

**[修正]** 扩展为 8 张表，支持完整的 Case-Driven 执行追踪。

### 6.2 数据模型

#### T01: `agent_case`

```sql
CREATE TABLE agent_case (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid NOT NULL REFERENCES company(id),
    case_type varchar(64) NOT NULL,         -- RecruitmentCase, PayrollCase, etc.
    state varchar(64) NOT NULL,             -- FSM 当前状态
    priority varchar(16) NOT NULL DEFAULT 'NORMAL',
    created_by uuid NOT NULL REFERENCES user_account(id),
    assigned_to uuid REFERENCES user_account(id),
    subject_id uuid,                        -- employee_id / candidate_id
    parent_case_id uuid REFERENCES agent_case(id),
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz
);
CREATE INDEX idx_agent_case_tenant_type_state ON agent_case (tenant_id, case_type, state);
CREATE INDEX idx_agent_case_assigned ON agent_case (assigned_to, state) WHERE assigned_to IS NOT NULL;
ALTER TABLE agent_case ENABLE ROW LEVEL SECURITY;
```

#### T02: `agent_run`

每次 Agent 执行（一轮对话或一次定时触发）对应一个 Run。

```sql
CREATE TABLE agent_run (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    company_id uuid NOT NULL REFERENCES company(id),
    user_id uuid NOT NULL REFERENCES user_account(id),
    case_id uuid REFERENCES agent_case(id),
    conversation_id uuid,                   -- 关联对话（可选）
    trigger_type varchar(32) NOT NULL,      -- USER_MESSAGE / CRON / WEBHOOK / SYSTEM
    status varchar(32) NOT NULL DEFAULT 'RUNNING',  -- RUNNING / COMPLETED / FAILED / CANCELLED
    input_summary text,
    output_summary text,
    tokens_prompt integer,
    tokens_completion integer,
    duration_ms integer,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
CREATE INDEX idx_agent_run_tenant_time ON agent_run (tenant_id, created_at);
ALTER TABLE agent_run ENABLE ROW LEVEL SECURITY;
```

#### T03: `agent_step`

Run 内的每一步执行（意图分类、Agent 调用、Tool 调用、LLM 调用等）。

```sql
CREATE TABLE agent_step (
    id uuid PRIMARY KEY,
    run_id uuid NOT NULL REFERENCES agent_run(id),
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    sequence_number smallint NOT NULL,       -- Run 内的执行顺序
    step_type varchar(32) NOT NULL,          -- INTENT_CLASSIFY / AGENT_CALL / TOOL_CALL / LLM_CALL / HUMAN_WAIT / STATE_TRANSITION
    agent_type varchar(64),
    tool_name varchar(128),
    input_summary text,
    output_summary text,
    duration_ms integer,
    status varchar(32) NOT NULL DEFAULT 'RUNNING',
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_step_run ON agent_step (run_id, sequence_number);
ALTER TABLE agent_step ENABLE ROW LEVEL SECURITY;
```

#### T04: `agent_event`

Case 和 Run 的生命周期事件流——不可变事件日志。

```sql
CREATE TABLE agent_event (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    case_id uuid REFERENCES agent_case(id),
    run_id uuid REFERENCES agent_run(id),
    event_type varchar(64) NOT NULL,         -- CASE_CREATED / STATE_CHANGED / TOOL_CALLED / APPROVAL_REQUESTED / APPROVAL_DECIDED / ERROR / ...
    event_data jsonb NOT NULL DEFAULT '{}',
    actor_user_id uuid,
    actor_type varchar(16) NOT NULL,         -- USER / AGENT / SYSTEM / CRON
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_event_case ON agent_event (case_id, created_at);
CREATE INDEX idx_agent_event_tenant_time ON agent_event (tenant_id, created_at);
ALTER TABLE agent_event ENABLE ROW LEVEL SECURITY;
```

#### T05: `agent_tool_invocation`

详细的 Tool 调用记录，供调试和审计使用。

```sql
CREATE TABLE agent_tool_invocation (
    id uuid PRIMARY KEY,
    step_id uuid NOT NULL REFERENCES agent_step(id),
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    tool_name varchar(128) NOT NULL,
    tool_params_hash varchar(64) NOT NULL,   -- SHA256(params)，不存储原始参数（可能含敏感数据）
    risk_level varchar(16) NOT NULL,
    target_service varchar(32) NOT NULL,     -- SPRING_BOOT / PYTHON_TOOL / INTERNAL
    http_method varchar(8),
    http_path varchar(256),
    http_status smallint,
    result_row_count integer,
    duration_ms integer NOT NULL,
    idempotency_key varchar(128),
    error_type varchar(64),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tool_invocation_step ON agent_tool_invocation (step_id);
ALTER TABLE agent_tool_invocation ENABLE ROW LEVEL SECURITY;
```

#### T06: `agent_human_approval`

人工审批记录。

```sql
CREATE TABLE agent_human_approval (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    case_id uuid NOT NULL REFERENCES agent_case(id),
    run_id uuid REFERENCES agent_run(id),
    approval_type varchar(64) NOT NULL,      -- PAYROLL_FINAL / ATTENDANCE_CORRECTION / CONTRACT_RENEWAL / ...
    approver_user_id uuid NOT NULL REFERENCES user_account(id),
    action_summary text NOT NULL,
    affected_records_count integer,
    decision varchar(16),                    -- PENDING / APPROVED / REJECTED
    comment text,
    requested_at timestamptz NOT NULL DEFAULT now(),
    decided_at timestamptz
);
CREATE INDEX idx_human_approval_pending ON agent_human_approval (approver_user_id, decision) WHERE decision = 'PENDING';
ALTER TABLE agent_human_approval ENABLE ROW LEVEL SECURITY;
```

#### T07: `agent_checkpoint`

Case 状态快照，用于状态恢复和回滚审计。

```sql
CREATE TABLE agent_checkpoint (
    id uuid PRIMARY KEY,
    case_id uuid NOT NULL REFERENCES agent_case(id),
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    state_before varchar(64) NOT NULL,
    state_after varchar(64) NOT NULL,
    trigger_event varchar(128) NOT NULL,
    trigger_user_id uuid,
    payload_snapshot jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_checkpoint_case ON agent_checkpoint (case_id, created_at);
ALTER TABLE agent_checkpoint ENABLE ROW LEVEL SECURITY;
```

#### T08: `agent_idempotency_ledger`

幂等性台账，防止 Tool 重复执行。

```sql
CREATE TABLE agent_idempotency_ledger (
    idempotency_key varchar(128) PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    tool_name varchar(128) NOT NULL,
    result_hash varchar(64),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_idempotency_expires ON agent_idempotency_ledger (expires_at);
```

#### T09: `agent_outbox_event`

Transactional Outbox 模式——确保 Case 状态变更与事件发布的原子性。

```sql
CREATE TABLE agent_outbox_event (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES tenant(id),
    event_type varchar(64) NOT NULL,
    event_payload jsonb NOT NULL,
    destination varchar(128) NOT NULL,       -- REDIS_STREAM / WEBHOOK / EMAIL
    status varchar(16) NOT NULL DEFAULT 'PENDING',  -- PENDING / PUBLISHED / FAILED
    retry_count smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz
);
CREATE INDEX idx_outbox_pending ON agent_outbox_event (status, created_at) WHERE status = 'PENDING';
```

### 6.3 ER 关系概览

```
agent_case ─┬─< agent_run ─── < agent_step ─── < agent_tool_invocation
            │        │
            ├─< agent_event
            ├─< agent_human_approval
            ├─< agent_checkpoint
            │
            └──── (via case_id) ──── agent_outbox_event
```

---

## 7. Email Ingress Provider

### 7.1 Provider 架构

**[新增]** 邮件接入采用 Provider 抽象模式，支持多种邮件源：

```
┌───────────────────────────────────────────────────────┐
│                  EmailIngressManager                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Dedup Check  │→│ Virus Scan   │→│ Sandbox Parse│ │
│  └─────────────┘  └──────────────┘  └──────┬───────┘ │
│                                            │         │
│  ┌──────────────────────────────────────────▼───────┐ │
│  │            Prompt Injection Isolation             │ │
│  │  邮件正文/附件 → 独立沙箱上下文 → 结构化提取       │ │
│  └──────────────────────────────────────────────────┘ │
└───────────┬───────────────────────────────────────────┘
            │ EmailIngressEvent
            ▼
    RecruitmentCase (RECEIVED)
```

### 7.2 四种 Provider

#### P1: `TencentAgentMailProvider`

| 属性 | 说明 |
|------|------|
| **集成方式** | 腾讯企业邮/Agent 邮箱 SDK |
| **触发** | Webhook 推送 |
| **认证** | API Key + Secret |
| **附件** | SDK 直接获取 |
| **适用** | 腾讯云生态深度集成场景 |

#### P2: `TencentCloudEmailWebhookProvider`

| 属性 | 说明 |
|------|------|
| **集成方式** | 腾讯云 SES 收信 Webhook |
| **触发** | HTTP POST 回调（SNS 签名验证） |
| **认证** | Webhook 签名验证 + Replay Protection (timestamp + nonce) |
| **附件** | 从 COS 下载 |
| **重放保护** | `message_id + timestamp` 去重；拒绝 > 5 分钟的旧消息 |

#### P3: `IMAPProvider`

| 属性 | 说明 |
|------|------|
| **集成方式** | 标准 IMAP 协议轮询 |
| **触发** | 定时轮询（可配置间隔，默认 60s） |
| **认证** | IMAP 用户名 + 密码 / OAuth2 |
| **附件** | MIME 解析提取 |
| **适用** | 通用邮箱集成 |

#### P4: `MockEmailProvider`

| 属性 | 说明 |
|------|------|
| **集成方式** | 本地文件目录 / API 接口注入 |
| **触发** | 手动 / 测试脚本 |
| **适用** | 开发和测试环境 |

### 7.3 安全防护层

| 防护 | 实现 |
|------|------|
| **去重** | `SHA256(message_id + sender + subject + date)` → `agent_idempotency_ledger` |
| **附件沙箱** | 附件在隔离的临时目录中解析，解析完毕后删除临时文件；仅保留结构化提取结果 |
| **Prompt Injection 隔离** | 邮件正文和附件内容作为 `user` 角色输入，独立于 Agent 的 `system` Prompt；提取字段经 JSON Schema 校验 |
| **病毒扫描** | ClamAV 或云端扫描 API；扫描未通过的附件直接丢弃并记录 |
| **文件大小限制** | 单附件 ≤ 20MB；单封邮件总附件 ≤ 50MB |
| **Webhook 重放保护** | 验证签名 + 时间窗口 (5 min) + nonce 去重 |
| **审计日志** | 每封邮件的接收、解析、分类、异常均写入 `agent_event` |

### 7.4 文件类型白名单

```
允许: .pdf, .doc, .docx, .jpg, .jpeg, .png, .txt, .rtf
拒绝: .exe, .bat, .sh, .ps1, .js, .vbs, .msi, .dll, .scr, .zip (内嵌可执行文件)
```

---

## 8. 确定性规则边界

### 8.1 核心原则

> **LLM 是摘要和解释工具，不是决策引擎。**  
> 涉及金额、责任判定、审批决策、状态锁定的操作，必须由确定性规则引擎（代码逻辑/SQL 查询/规则表达式）执行。

### 8.2 职责分界表

| 决策类型 | 执行者 | LLM 角色 | 示例 |
|---------|--------|---------|------|
| 薪资金额计算 | 规则引擎 (backend-modern `PayrollReadService`) | 生成计算过程的自然语言解释 | "基本工资 8000 + 岗位津贴 2000 - 社保 1200 = 应发 8800" |
| 薪资异常检测 | 规则引擎 (阈值比较 / SQL) | 汇总异常为人类可读报告 | "检测到 3 名员工薪资同比波动 > 20%" |
| 薪资锁定/支付 | 人工审批 → 确定性状态转换 | 不参与 | — |
| 考勤异常判定 | 规则引擎 (打卡时间 vs 排班规则) | 为员工和 HR 生成异常说明文本 | "您 6/25 上午打卡时间 09:32，晚于排班 09:00" |
| 考勤责任归属 | HR / 经理人工决定 | 不参与最终判定 | — |
| 审批通过/驳回 | 人工决定 | 可以生成审批摘要供审批人参考 | "该员工本月请假 3 次，总计 5 天" |
| 合同到期检测 | SQL 查询 (`expiry_date ≤ now() + interval`) | 生成到期风险摘要 | "合同将于 30 天后到期" |
| 简历 JD 匹配 | 向量相似度 + 规则过滤 (Python Tool) | 生成匹配分析报告 | "候选人具备 3/5 项核心技能" |
| 意图分类 | LLM | — (LLM 是执行者) | 判断用户查询类型 |
| 多步骤 Tool 编排 | Orchestrator (确定性路由) | LLM 辅助复杂意图理解 | 根据 Case 类型和状态确定下一步 |
| 数据摘要 | LLM | — (LLM 是执行者) | 将查询结果转化为自然语言 |
| 政策/法规 Q&A | RAG + LLM | — (LLM 是执行者，但必须附免责声明) | "根据《劳动合同法》第 XXX 条..." |

### 8.3 禁止 LLM 操作清单

LLM 在任何情况下**不得**执行以下操作：

| 禁止操作 | 原因 | 替代方案 |
|---------|------|---------|
| 计算或修改薪资金额 | 金额错误直接导致劳动纠纷 | backend-modern 规则引擎计算 |
| 判定考勤最终责任 | 涉及员工劳动权益 | HR + 经理人工判定 |
| 自动审批或驳回任何流程 | 审批是人工决策 | 仅生成审批参考信息 |
| 执行薪资锁定或解锁 | 不可逆操作 | 人工确认 + `before_case_transition` Hook |
| 触发支付 | 资金操作 | 外部支付系统 + 人工确认 |
| 修改员工状态（入职/离职/调岗） | 影响劳动关系 | 人工确认 + backend-modern API |
| 分配或修改 RBAC 权限 | 安全操作 | 系统管理员手动 |
| 删除任何数据 | 不可逆 | 软删除 + 管理员审批 |

### 8.4 LLM 调用的安全包装

```python
# 伪代码：所有 LLM 调用都经过安全包装
class SafeLlmClient:
    def summarize(self, structured_data: dict, purpose: str) -> str:
        """LLM 可以：将结构化数据总结为自然语言"""
        prompt = build_summary_prompt(structured_data, purpose)
        response = self.llm.complete(prompt)
        return sanitize_response(response)  # 移除意外生成的数字/金额

    def explain(self, calculation_result: dict) -> str:
        """LLM 可以：解释已完成的计算过程"""
        ...

    def classify_intent(self, user_message: str) -> IntentResult:
        """LLM 可以：分类用户意图"""
        ...

    def decide_payroll(self, ...):
        """LLM 不可以：薪资决策"""
        raise ForbiddenLlmOperation("payroll decisions must use rule engine")

    def approve(self, ...):
        """LLM 不可以：审批决策"""
        raise ForbiddenLlmOperation("approvals require human decision")
```

---

## 9. 前端 Case Workbench

### 9.1 v1 扩展

**[v1 原文]** v1 设计了 8 个 Agent 专项页面。

**[新增]** 增加统一的 Case Workbench 入口和通用 Case 组件。

### 9.2 路由规划

```typescript
// [新增] routes.ts 扩展
{
  path: '/agent', component: Layout,
  children: [
    // [v1 原文] 已有
    { path: 'chat', name: 'agent-chat', ... },

    // [新增] Case Workbench
    { path: 'cases', name: 'agent-cases', component: CaseListPage },
    { path: 'cases/:id', name: 'agent-case-detail', component: CaseDetailPage },
    { path: 'cases/:id/timeline', name: 'case-timeline', component: CaseTimelinePage },
    { path: 'cases/:id/approval', name: 'case-approval', component: HumanApprovalPanel },
    { path: 'cases/:id/audit', name: 'case-audit', component: CaseAuditTrail },

    // [v1 原文] 专项页面（保留，作为 Case 类型的快捷入口）
    { path: 'recruitment', ... },
    { path: 'attendance', ... },
    { path: 'payroll', ... },
    { path: 'contracts', ... },
  ]
}
```

### 9.3 核心组件

#### `/agent/cases` — Case 列表页

| 功能 | 说明 |
|------|------|
| 筛选 | 按 Case 类型、状态、优先级、负责人筛选 |
| 排序 | 按创建时间、优先级、SLA 剩余时间 |
| 看板视图 | 按状态分列（类 Kanban） |
| 列表视图 | 表格展示 |
| 快速操作 | 认领 Case、转交、设置优先级 |

#### Case Timeline（时间线）

| 功能 | 说明 |
|------|------|
| 状态转换历史 | 按时间顺序展示所有 `agent_checkpoint` 记录 |
| 事件流 | 穿插展示 `agent_event`（Tool 调用、人工操作、系统事件） |
| 状态机可视化 | 当前状态在 FSM 图中高亮，已完成状态标绿 |

#### State Transition Viewer（状态转换查看器）

| 功能 | 说明 |
|------|------|
| FSM 图 | 根据 Case 类型渲染对应的状态机图 |
| 当前位置 | 高亮当前状态和可用转换 |
| 转换历史 | 点击状态节点查看历史转换记录 |

#### Human Approval Panel（人工审批面板）

| 功能 | 说明 |
|------|------|
| 待审批队列 | 当前用户的所有 PENDING 审批请求 |
| 审批上下文 | 展示 Case 摘要、关联数据、影响范围 |
| 审批操作 | 通过 / 驳回 + 必填评论 |
| 批量审批 | 同类型低风险审批支持批量操作 |

#### Tool Call Trace（工具调用追踪）

| 功能 | 说明 |
|------|------|
| 调用链路 | 展示 `agent_step` → `agent_tool_invocation` 链路 |
| 请求/响应 | 展示脱敏后的 Tool 参数和结果摘要 |
| 耗时 | 每个 Step 和 Tool 调用的时长 |
| 错误 | 高亮失败的调用，展示错误信息 |

#### Evidence Viewer（证据查看器）

| 功能 | 说明 |
|------|------|
| 证据列表 | 与当前 Case 关联的证据文件 |
| 预览 | 图片/PDF 在线预览 |
| 下载 | 权限检查后允许下载 |
| 上传 | 员工/HR 可上传申诉证据 |

#### Audit Trail Viewer（审计轨迹查看器）

| 功能 | 说明 |
|------|------|
| 统一视图 | 合并 `agent_event` + `audit_log` 为时间线 |
| 筛选 | 按事件类型、操作人、时间范围 |
| 导出 | CSV / PDF 导出（合规审计用） |

---

## 10. 修订实施路线图

### 10.1 v1 修正说明

**[v1 原文]** v1 路线图以 Java Spring Boot 实现为主线，8 个 Phase (A–H)。

**[修正]** 改为 Python 原型先行，Node.js/TS 生产运行时后行，共 9 个 Phase (0–8)。

### Phase 0: 设计修正

| 类别 | 任务 |
|------|------|
| **文档** | 完成本补遗文档；更新 v1 文档增加对本文档的引用 |
| **数据模型** | 确认 9 张 Agent 表的 DDL + `payroll_cycle_config` 表 |
| **状态机** | 对 14 种 Case 类型的 FSM 进行 peer review |
| **Hook 定义** | 确认 16 个 Hook 的输入/输出 schema |
| **生产就绪差距** | 以 `docs/agent/v1/agent-production-readiness-gap-analysis.md` 作为剩余设计主题、优先级、风险和验收标准索引 |
| **验收** | 架构设计文档 review 完成；所有 DDL 在测试 PostgreSQL 上执行通过 |

### Phase 1: Python 可运行原型

| 类别 | 任务 |
|------|------|
| **后端** | Python Agent Runtime 骨架（FastAPI / asyncio）；Case FSM 引擎（transitions / pytransitions）；Tool Registry + Adapter 抽象；LLM Client（SiliconFlow / OpenAI 兼容） |
| **数据库** | `V7__agent_case_tables.sql` 迁移执行；`payroll_cycle_config` 表 |
| **集成** | Python → backend-modern REST API（Bearer Token passthrough）；SSE 流式响应端点 `POST /agent/chat/stream` |
| **前端** | 连接 Python 后端替换 mock 模式；Chat UI 接收 Case 状态更新 |
| **测试** | Case FSM 单元测试（所有合法/非法状态转换）；Tool Adapter 集成测试（→ backend-modern） |
| **验收** | 用户可通过对话触发 Case 创建；Case 在 DB 中正确流转；Tool 可调通 backend-modern API |

### Phase 2: Python Hook 和审计

| 类别 | 任务 |
|------|------|
| **后端** | 实现 16 个 Hook 的引擎框架；`before_tool_call` / `after_tool_call` 完整实现；`before_sensitive_data_access` + `FieldMaskingService`；`AgentAuditService` → `agent_event` + `agent_tool_invocation` |
| **数据库** | `agent_run`, `agent_step`, `agent_event`, `agent_tool_invocation` 投入使用 |
| **安全** | 幂等性台账 (`agent_idempotency_ledger`)；L3/L4 字段脱敏验证 |
| **测试** | Hook 拦截测试（权限不足 → 阻止 Tool 调用）；审计完整性测试（每次 Tool 调用必有记录）；跨租户拒绝测试 |
| **验收** | 所有 Tool 调用经过 Hook 链路；审计日志完整可查；敏感字段正确脱敏 |

### Phase 3: 招聘邮件筛选

| 类别 | 任务 |
|------|------|
| **后端** | `IMAPProvider` + `MockEmailProvider` 实现；简历解析 Python Tool Service（Tika / pdfplumber）；`RecruitmentCase` FSM 完整实现 |
| **安全** | 附件沙箱解析；Prompt Injection 隔离（邮件正文独立上下文）；病毒扫描（ClamAV）；文件大小 / 类型白名单 |
| **前端** | 简历筛选收件箱页面；候选人卡片 + AI 评分；人工审核操作 |
| **数据库** | 招聘相关表（candidate, job_description, interview_task） |
| **测试** | 恶意简历 Prompt Injection 测试样本；附件解析准确率；邮件去重测试 |
| **验收** | 简历邮件 → 解析 → JD 匹配 → HR 审核 → 安排面试全流程可用 |

### Phase 4: 日常考勤异常 Case

| 类别 | 任务 |
|------|------|
| **后端** | `AttendanceAnomalyCase` FSM 完整实现（§4 全部状态）；定时检测任务（check-in/check-out 窗口后触发）；`PENDING_DEVICE_SYNC` + 宽限期逻辑；员工申诉工作流；`source_punch_time` vs `ingested_at` 时间线处理 |
| **前端** | 考勤异常助手页面；Case Timeline 展示；员工申诉提交 + 证据上传；HR/经理审核面板 |
| **集成** | Attendance Agent → backend-modern `AttendanceReadService` |
| **测试** | 设备同步延迟场景；跨日打卡边界条件；申诉全流程 |
| **验收** | 每日异常自动检测 → 设备延迟宽限 → 员工申诉 → HR 审核 → 锁定进入薪资 |

### Phase 5: 月度薪资 Case

| 类别 | 任务 |
|------|------|
| **后端** | `PayrollCase` FSM 完整实现（§3 全部状态）；`payroll_cycle_config` 定时触发；考勤快照冻结；多级审批流（HR → 领导 → 财务 → 最终）；工资条生成 |
| **确定性规则** | 薪资计算由 backend-modern 执行；LLM 仅生成解释文本（§8 规则严格执行） |
| **前端** | 薪资预检助手页面；多级审批面板；异常高亮表格；资金状态显示 |
| **安全** | L4 级薪资字段不传 LLM 验证；`LOCKED` 状态不可逆验证；`before_case_transition` Hook 阻止非法回退 |
| **测试** | 端到端月度薪资流程；异常中断恢复；多级审批驳回回退 |
| **验收** | cron 触发 → 考勤快照 → HR 审核 → 领导审核 → 财务检查 → 最终审批 → 锁定 → 工资条 → 等待支付 |

### Phase 6: Node.js / TypeScript Runtime 骨架

| 类别 | 任务 |
|------|------|
| **后端** | Node.js/TS Agent Runtime 项目搭建（Fastify / Express + TypeScript）；Case FSM 引擎（xstate / 自研）；Hook 引擎移植；LLM Client（Anthropic SDK / OpenAI SDK）；Tool Registry + Adapter 抽象层 |
| **集成** | TS Runtime → backend-modern REST API；TS Runtime → Python Tool Service (HTTP/gRPC)；前端切换后端地址（环境变量） |
| **测试** | FSM 单元测试与 Python 版本对照验证；Hook 链路集成测试 |
| **验收** | TS Runtime 可运行最简 Case（OnboardingCase read-only）；Hook 链路与 Python 版本行为一致 |

### Phase 7: 编排迁移到 TS/Node

| 类别 | 任务 |
|------|------|
| **后端** | 将 Orchestrator、所有 14 种 Case FSM、16 个 Hook 从 Python 迁移到 TS；保留 Python Tool Service 作为外部微服务 |
| **前端** | Case Workbench 完整实现（§9 全部组件）；审计追踪查看器；State Transition Viewer |
| **数据库** | Outbox 模式 (`agent_outbox_event`) 投入使用 |
| **测试** | 全部 14 种 Case 类型的 TS FSM 回归测试；TS ↔ Python Tool Service 集成测试 |
| **验收** | 所有 Case 类型在 TS Runtime 上正常运行；Python Tool Service 作为远程服务被调用 |

### Phase 8: 安全 / 评测加固

| 类别 | 任务 |
|------|------|
| **安全** | 渗透测试（Prompt Injection / 跨租户 / SSRF）；OWASP Top 10 审查；敏感数据泄露扫描 |
| **性能** | 压测（50 并发 Case，p95 响应 < 10s）；LLM API 限流和 failover |
| **合规** | 审计日志完整性审查；数据留存策略执行；GDPR / 个人信息保护法合规检查 |
| **评测** | Case 端到端自动化测试覆盖率 > 80%；Hook 拦截准确率测试；FSM 边界条件回归 |
| **前端** | XSS 防护（Markdown 渲染安全）；CSP 头配置 |
| **验收** | 安全审查报告无高危项；压测通过；合规审查通过 |

### 10.2 里程碑时间线

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
设计修正     Python       Hook/       招聘邮件    考勤异常    月度薪资
             原型        审计                    Case       Case
 1 week      3 weeks     2 weeks     3 weeks    3 weeks    4 weeks
                                                           ↓
        Phase 8 ←── Phase 7 ←── Phase 6
        安全加固     TS 迁移      TS 骨架
        3 weeks     4 weeks     3 weeks
```

总计约 26 周（6.5 个月），其中 Phase 1–5 为 Python 原型阶段（约 15 周），Phase 6–8 为生产化阶段（约 10 周）。
