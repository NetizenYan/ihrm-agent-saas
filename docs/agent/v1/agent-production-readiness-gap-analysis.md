# iHRM Agent 生产就绪差距分析与路线图

> 版本：1.0  
> 日期：2026-06-27  
> 分支：`phase4-backend-modern-full-replacement`  
> 状态：生产就绪差距分析与路线图，**[提议]**，仅文档，不涉及源码变更  
> 依赖文档：`docs/agent/v1/multi-agent-architecture.md`、`docs/agent/v1/architecture-gap-addendum.md`、`docs/agent/v1/memory-and-context-compression-design.md`、`docs/agent/v1/enterprise-knowledge-base-chunking-design.md`  
> 约定：**covered** 表示已有设计基本覆盖；**partially covered** 表示已有方向但需要补深；**missing** 表示尚未形成独立设计；**requires deeper design** 表示已提及但不足以指导生产实现

---

## 目录

1. [Purpose](#1-purpose)
2. [Current Design Coverage Summary](#2-current-design-coverage-summary)
3. [Production Readiness Gap Matrix](#3-production-readiness-gap-matrix)
4. [Detailed Gap: Agent Evaluation and Red Team Testing](#4-detailed-gap-agent-evaluation-and-red-team-testing)
5. [Detailed Gap: LLMOps / Prompt / Model Governance](#5-detailed-gap-llmops--prompt--model-governance)
6. [Detailed Gap: Observability and Operations](#6-detailed-gap-observability-and-operations)
7. [Detailed Gap: Queue, Concurrency, Locking, and Recovery](#7-detailed-gap-queue-concurrency-locking-and-recovery)
8. [Detailed Gap: Tenant / Company Agent Configuration](#8-detailed-gap-tenant--company-agent-configuration)
9. [Detailed Gap: Work Calendar / Shift / Timezone](#9-detailed-gap-work-calendar--shift--timezone)
10. [Detailed Gap: Recruitment Fairness and Bias Control](#10-detailed-gap-recruitment-fairness-and-bias-control)
11. [Detailed Gap: Deterministic Rule Engine](#11-detailed-gap-deterministic-rule-engine)
12. [Detailed Gap: Evidence Management and Chain of Custody](#12-detailed-gap-evidence-management-and-chain-of-custody)
13. [Detailed Gap: Notification and SLA Escalation](#13-detailed-gap-notification-and-sla-escalation)
14. [Detailed Gap: External Integration Catalog](#14-detailed-gap-external-integration-catalog)
15. [Detailed Gap: Service Security and Secret Management](#15-detailed-gap-service-security-and-secret-management)
16. [Detailed Gap: User Feedback and Continuous Improvement](#16-detailed-gap-user-feedback-and-continuous-improvement)
17. [Detailed Gap: Case Dependency Graph](#17-detailed-gap-case-dependency-graph)
18. [Detailed Gap: Frontend Permission Explainability](#18-detailed-gap-frontend-permission-explainability)
19. [Detailed Gap: HR Analytics and Reporting Agent](#19-detailed-gap-hr-analytics-and-reporting-agent)
20. [Detailed Gap: Data Quality and Master Data Governance](#20-detailed-gap-data-quality-and-master-data-governance)
21. [Detailed Gap: Deployment Topology and Environments](#21-detailed-gap-deployment-topology-and-environments)
22. [Detailed Gap: Cost Control and Quota](#22-detailed-gap-cost-control-and-quota)
23. [Detailed Gap: Cache and Data Freshness](#23-detailed-gap-cache-and-data-freshness)
24. [Prioritized Roadmap](#24-prioritized-roadmap)
25. [Cross-References](#25-cross-references)
26. [Final Report Checklist](#26-final-report-checklist)

---

## 1. Purpose

本文档是 HR SaaS Multi-Agent 平台的生产就绪差距分析与路线图。它不替代已有架构文档，而是作为索引、差距地图和优先级指南，帮助后续实施前明确还缺哪些设计、哪些必须先做、哪些可以延后。

本文重点回答：

- 已有设计覆盖了哪些生产能力。
- 哪些能力只被提到但还不足以实施。
- 哪些能力是生产前必须补齐的安全、运行、治理和业务规则基础。
- 每个差距的最低可行设计和验收标准是什么。

本文所有新增内容均为 **[提议]**，不是已实现代码。

---

## 2. Current Design Coverage Summary

| 领域 | 当前覆盖状态 | 已有覆盖 | 主要缺口 |
|------|--------------|----------|----------|
| Multi-Agent architecture | covered | Agent 总览、Tool Registry、Data Guard、Audit、Human Approval、前端 Agent 页面 | 生产运行监控、评测体系、配置中心仍需独立设计 |
| Case-driven workflow | covered | 14 种 Case、PayrollCase、AttendanceAnomalyCase、Hook 生命周期、Case Workbench | 跨 Case 依赖图、Case stuck SLA、恢复策略需补深 |
| Memory and context compression | covered | 七层记忆、Safe Context Pack、压缩管线、MemoryGuard、LLM 安全边界 | memory poisoning 评测、缓存刷新策略需补深 |
| Enterprise knowledge base chunking | covered | 文档摄取、chunk taxonomy、表格/截图/流程图、元数据、RAG citation | 运营 UI、入库质量指标、KB 反馈闭环需补深 |
| Token/cost/offline/tooling governance | missing | 当前仓库未发现 `docs/agent/v1/token-cost-offline-tooling-design.md` | 需补 token 预算、成本配额、离线模式和 Tool 成本治理 |
| Data Guard | partially covered | 租户/公司/RBAC/敏感度过滤、Tool 前后置校验 | 前端可解释性、deny 指标、批量策略和规则配置中心需补深 |
| Audit | partially covered | Agent event、Tool invocation、memory access log、KB access log | 证据链、不可篡改归档、审计查询产品化需补深 |
| Human Approval | partially covered | 高风险写操作、薪资最终审批、审批卡片 | 审批超时、委派、替补审批、SLA 升级需补深 |
| Tool Registry | partially covered | 工具定义、权限、风险、人审要求 | Tool 版本、schema 兼容、外部集成目录和限流需补深 |
| Safe Context Pack | covered | 权限、Case 状态、安全约束、RAG 引用、blocked tools | pack hash 与 LLMOps 回归绑定需补深 |
| Python prototype | covered | Python 原型先行、Tool Service 可长期保留 | 原型评测、部署隔离、作业队列恢复需补深 |
| Future TypeScript/Node.js runtime | partially covered | TS 生产运行时职责、FSM、Hook、编排迁移 | 部署拓扑、环境策略、队列和观测需独立设计 |

---

## 3. Production Readiness Gap Matrix

| Gap Area | Current Coverage | Why It Matters | Related Cases | Related Agents | Risk Level | Priority | Suggested Document | Minimum Viable Design | Acceptance Criteria |
|----------|------------------|----------------|---------------|----------------|------------|----------|--------------------|------------------------|--------------------|
| A. Agent Evaluation and Red Team Testing | requires deeper design | 防止模型/提示词变更引入权限、泄露、幻觉回归 | All | All | 极高 | P0 | `agent-evaluation-redteam-design.md` | Golden set + 安全红队集 + 回归门禁 | 每次 prompt/model 变更有评测报告，L4 泄露率为 0 |
| B. LLMOps, Prompt Governance, and Model Versioning | requires deeper design | 生产需要可审计、可回滚、可比较的模型和 prompt | All | Orchestrator, Sub-Agents | 高 | P0 | `llmops-prompt-model-governance-design.md` | prompt/model/tool schema 版本与 run 绑定 | 任意回答可追溯 prompt_version/model_version/context_pack_hash |
| C. Observability and Operations Dashboard | missing | 没有指标就无法运营、排障和容量规划 | All | Audit, Orchestrator | 高 | P1 | `agent-observability-operations-design.md` | 指标、日志、trace、仪表盘 | p95、失败率、成本、队列深度可按租户查看 |
| D. Queue, Concurrency, Locking, Cancellation, and Recovery | requires deeper design | 防止重复 Case、并发写、任务丢失和卡死 | Payroll, Recruitment, Attendance | Orchestrator, Worker | 极高 | P0 | `agent-queue-recovery-design.md` | 队列优先级、Case lock、checkpoint、DLQ | worker 崩溃后可恢复，重复 PayrollCase 被阻止 |
| E. Tenant / Company Agent Configuration Center | missing | HR SaaS 多租户差异很大，不能写死规则 | All | Orchestrator, Data Guard | 极高 | P0 | `agent-tenant-config-design.md` | 租户级启停、Case、日历、审批、LLM 策略 | 不同租户可配置独立薪资日和离线模式 |
| F. Work Calendar, Holiday, Shift, Timezone, and Cross-Day Attendance | partially covered | 考勤和薪资依赖确定性日历规则 | Attendance, Payroll, Leave | Attendance, Payroll | 极高 | P1 | `work-calendar-shift-timezone-design.md` | 版本化日历/班次/跨日规则 | 夜班跨日打卡和法定节假日加班由规则引擎判定 |
| G. Recruitment Fairness and Bias Control | missing | 招聘场景存在合规和歧视风险 | Recruitment | Recruitment, Audit | 高 | P1 | `recruitment-fairness-bias-design.md` | 敏感属性屏蔽、公平评分、人审 | 自动拒绝被禁止，评分解释不含受限属性 |
| H. Deterministic Rule Engine and Decision Tables | requires deeper design | LLM 不能做薪资、考勤、审批最终决策 | Payroll, Attendance, Leave, Contract | Payroll, Attendance, Approval | 极高 | P0 | `deterministic-rule-engine-design.md` | Rule DSL + decision table + versioning | 规则模拟、测试、回滚可用 |
| I. Evidence Management and Chain of Custody | missing | 考勤申诉、合同、审计需要证据可追溯 | Attendance, Contract, Offboarding | Attendance, Audit, HR | 高 | P1 | `evidence-chain-of-custody-design.md` | evidence ref、权限、访问原因、水印、审计 | 每次证据访问有理由和审计记录 |
| J. Notification, Reminder, and SLA Escalation | partially covered | Case 需要及时推动和超时升级 | All | Orchestrator, Approval | 高 | P1 | `notification-sla-escalation-design.md` | 通知模板、SLA clock、升级策略 | Finance 审核超时自动提醒并升级 |
| K. External Integration Catalog | partially covered | 邮件、IM、签章、银行、设备等都需标准接入 | Recruitment, Payroll, Attendance, Contract | Tool Adapters | 高 | P2 | `external-integration-catalog-design.md` | 集成清单、认证、重试、审计、失败策略 | 每个外部系统有数据方向、敏感度和失败处理 |
| L. Service Security and Secret Management | requires deeper design | API key 泄露会造成系统性风险 | All | All services | 极高 | P1 | `service-security-secret-management-design.md` | Secret manager、S2S auth、签名校验、网络白名单 | 前端、prompt、日志、memory 中无 secret |
| M. User Feedback and Continuous Improvement | missing | 没有反馈闭环，KB 和 prompt 难以持续变好 | All | Orchestrator, Audit | 中 | P3 | `agent-feedback-improvement-design.md` | 点赞/纠错/标注队列/晋升审核 | 反馈不会直接写入记忆或 KB，需人工审核 |
| N. Case Dependency Graph | missing | 薪资依赖考勤，入职依赖招聘，必须显式建模 | All | Orchestrator | 高 | P2 | `case-dependency-graph-design.md` | blocking/advisory/parent-child 关系 | PayrollCase 可显示被哪些考勤异常阻塞 |
| O. Frontend Permission Explainability | missing | 用户需要知道为什么看不到、不能做、卡在哪 | All | Data Guard, Frontend | 中 | P2 | `frontend-permission-explainability-design.md` | denial reason、安全提示、申请入口 | 不泄露数据前提下解释缺失权限 |
| P. HR Analytics and Reporting Agent | partially covered | 管理层需要趋势解释，但指标必须权威 | Reporting | Reporting Agent | 中 | P3 | `hr-analytics-reporting-agent-design.md` | 只读报表 API + LLM 解读 | LLM 不从原始数据计算权威指标 |
| Q. Data Quality and Master Data Governance | partially covered | 主数据缺失会导致 Agent 判断和流程失败 | Onboarding, Payroll, Contract | HR, Data Guard | 高 | P2 | `data-quality-master-data-design.md` | 数据质量规则、修复 Case、告警 | 缺审批人、缺班次、缺合同能生成 DataQualityCase |
| R. Deployment Topology and Environment Plan | missing | 原型到生产需要环境隔离、健康检查和回滚 | All | Runtime services | 高 | P2 | `deployment-topology-environment-design.md` | local/test/staging/prod 拓扑 | 可蓝绿/滚动部署，失败可回滚 |
| S. Cost Control and Quota Management | missing | LLM/OCR/embedding 成本可能失控 | All | Orchestrator, Admin | 高 | P0 | `token-cost-offline-tooling-design.md` | 租户配额、模型分层、成本审批 | 超预算任务被阻止或要求审批 |
| T. Cache and Data Freshness Policy | missing | stale 权限、政策、Case 状态会导致错误回复 | All | Runtime, Data Guard | 高 | P2 | `cache-data-freshness-design.md` | TTL、失效事件、stale warning | 权限变更后缓存失效，薪资数据不做长期缓存 |

---

## 4. Detailed Gap: Agent Evaluation and Red Team Testing

### 4.1 需要评测的能力

| 评测项 | 说明 | 最低目标 |
|--------|------|----------|
| intent classification accuracy | 意图分类是否正确路由到 Case/Agent | 核心场景准确率可量化 |
| tool selection accuracy | 是否选择正确 Tool 和参数 | 高风险工具误选为 0 |
| permission denial accuracy | 无权限时是否拒绝 | 拒绝准确率可量化 |
| cross-tenant blocking | 跨租户数据是否被拦截 | 泄露为 0 |
| L3/L4 data leakage rate | 回复、Context Pack、日志是否泄露高敏数据 | L4 泄露为 0 |
| prompt injection defense | 外部文档中的指令是否被隔离 | 注入提升为 system 指令为 0 |
| memory poisoning defense | 恶意反馈、文档或历史记忆是否污染未来回答 | 未审核内容不得晋升长期记忆 |
| RAG citation correctness | 引用是否指向正确文档、章节、页码、chunk | citation 必须完整且可追溯 |
| payroll explanation correctness | 薪资解释是否忠于确定性计算结果 | 不新增或改变金额事实 |
| attendance anomaly explanation correctness | 考勤解释是否忠于规则引擎和考勤记录 | 不推断责任归属 |
| recruitment JD matching consistency | 相同 JD/候选人多次匹配是否稳定 | 分数波动有阈值 |
| human approval interception rate | 高风险动作是否被人审拦截 | 必审动作拦截率 100% |
| hallucination rate | 无来源回答、编造政策、编造字段 | 关键业务回答必须有来源 |
| regression after model/prompt change | 模型或 prompt 变更后的回归 | 必须跑 golden set |

### 4.2 Golden test sets

| 测试集 | 内容 |
|--------|------|
| recruitment | 简历解析、JD 匹配、面试建议、敏感属性屏蔽 |
| payroll | 薪资预检解释、金额脱敏、人审拦截、规则引用 |
| attendance | 迟到、漏打卡、跨日、申诉、设备延迟 |
| contract | 到期提醒、续签流程、合同原文不外泄 |
| onboarding | 入职材料、员工创建、证件字段脱敏 |
| offboarding | 交接、权限回收、最终结算引用 |
| security | RBAC、Data Guard、blocked tools、deny explanation |
| prompt injection | 简历、合同、KB、截图 OCR 中的注入文本 |
| cross-tenant | 租户 A 查询租户 B 数据、向量检索跨租户污染 |
| memory poisoning | 用户反馈、恶意文档、历史 Case 污染测试 |
| KB retrieval | 版本过滤、citation、表格行组、旧政策 superseded |

### 4.3 最低可行设计

- 使用固定 golden set，按 Case 类型、Agent 类型和风险等级分层。
- 每条样本保存输入、期望意图、期望工具、权限上下文、期望拒绝/允许、期望 citation。
- 每次 prompt/model/tool schema 变更自动跑核心 P0 测试集。
- 红队样本独立维护，覆盖 prompt injection、cross-tenant、L4 leakage、memory poisoning。

### 4.4 验收标准

- L4 泄露测试 0 通过失败。
- 跨租户 retrieval 泄露 0。
- 必须人工审批的动作拦截率 100%。
- 每次模型或 prompt 变更都有评测报告和批准记录。

---

## 5. Detailed Gap: LLMOps / Prompt / Model Governance

### 5.1 版本治理对象

| 对象 | 版本字段 | 说明 |
|------|----------|------|
| prompt template | `prompt_version` | 每个 Agent/任务一个模板版本 |
| model route policy | `model_route_policy_version` | 按 Agent、风险、成本、离线要求路由 |
| model provider | `provider_version` | OpenAI-compatible、本地模型、备用供应商 |
| tool schema | `tool_schema_version` | 防止 prompt 与工具参数不兼容 |
| context pack | `context_pack_hash` | 审计本次 LLM 输入摘要 |
| safety policy | `safety_policy_version` | Data Guard、敏感字段、禁用操作清单 |

### 5.2 Prompt 生命周期

```
draft -> review -> approved -> canary -> active -> deprecated -> rollback
```

每个 prompt 必须有 owner、适用 Agent、适用 Case、风险等级、变更说明和回归结果。

### 5.3 必须支持的能力

- prompt template versioning
- model route policy versioning
- model provider versioning
- per-Agent prompt ownership
- prompt approval
- prompt rollback
- prompt A/B testing
- prompt regression testing
- model fallback
- model cost tiering
- per-run logging

### 5.4 每次 Agent Run 必须记录

```json
{
  "model_name": "provider/model",
  "model_version": "2026-06",
  "prompt_version": "payroll_explain_v4",
  "context_pack_hash": "sha256",
  "tool_schema_version": "payroll_tools_v3",
  "safety_policy_version": "data_guard_v2",
  "model_route_policy_version": "tenant_policy_v1"
}
```

### 5.5 验收标准

- 可按任意 Agent Run 追溯 prompt、model、tool schema 和 Context Pack hash。
- prompt rollback 不需要重新部署业务系统。
- 高风险 Agent prompt 变更必须有审批和 golden set 通过记录。

---

## 6. Detailed Gap: Observability and Operations

### 6.1 指标

| 指标 | 维度 |
|------|------|
| Agent Run success rate | tenant/company/agent/case/model |
| Agent Run p95/p99 latency | tenant/company/agent/case |
| Tool success/failure rate | tool/tenant/agent |
| LLM call failure rate | provider/model/agent |
| token usage | tenant/company/user/agent/case/model |
| cost | tenant/company/user/agent/case/model |
| queue depth | queue/priority/tenant |
| retry count | job/tool/provider |
| dead letter count | queue/error_code |
| human approval wait time | case_type/approver_role |
| Case stuck time | case_type/state/tenant |
| RAG hit rate | domain/chunk_type/tenant |
| context compression count | agent/case/model |
| sensitive data block count | sensitivity/rule/agent |
| cross-tenant deny count | tenant/agent/tool |

### 6.2 Dashboard

| Dashboard | 目标用户 | 内容 |
|-----------|----------|------|
| Agent Operations Dashboard | 运维/研发 | 成功率、延迟、失败、队列、worker 健康 |
| Tenant Cost Dashboard | SaaS 管理员/租户管理员 | token、模型成本、OCR、embedding、配额 |
| Case SLA Dashboard | HR 运营 | 卡住 Case、超时审批、SLA 风险 |
| Security Deny Dashboard | 安全/审计 | Data Guard 拒绝、跨租户、敏感字段拦截 |
| LLM Usage Dashboard | Agent 平台团队 | 模型调用量、失败率、fallback、prompt 版本 |

### 6.3 日志和 Trace

Agent Run、Case transition、Tool invocation、LLM call、RAG retrieval、Data Guard decision 应共享 `trace_id`。日志中不得包含 L3/L4 原值、API key、prompt secret 或完整原始文件文本。

### 6.4 验收标准

- 任意失败 Run 可从 trace 找到 Tool、LLM、Data Guard、Queue 事件。
- 任意租户可查看自己的成本和配额使用。
- 任意 cross-tenant deny 可在安全面板看到脱敏摘要。

---

## 7. Detailed Gap: Queue, Concurrency, Locking, and Recovery

### 7.1 队列与优先级

| 优先级 | 示例 | 处理策略 |
|--------|------|----------|
| URGENT | 薪资发放阻塞、数据泄露告警 | 优先队列，限流豁免需审计 |
| HIGH | 合同即将到期、考勤申诉截止 | 高优先级队列 |
| NORMAL | 入职材料检查、JD 匹配 | 默认队列 |
| LOW | KB 重建索引、批量 OCR | 后台低优先级 |

### 7.2 并发控制

- per-tenant concurrency：防止单租户耗尽 worker。
- per-company concurrency：防止集团租户下单公司任务挤占全部容量。
- per-tool rate limit：保护 backend-modern、邮件、OCR、LLM provider。
- Case-level distributed lock：同一 Case 同一时刻只允许一个状态转换。

### 7.3 恢复能力

| 能力 | 设计 |
|------|------|
| worker crash recovery | checkpoint + leased job，租约超时后重取 |
| cancellation | 用户或系统取消排队/运行中可中断步骤 |
| pause/resume | 高风险或等待外部系统时暂停 Case |
| retry/backoff | 按错误类型指数退避 |
| dead letter queue | 超过最大重试进入 DLQ |
| checkpoint replay | 从最后成功 checkpoint 继续 |
| idempotency | Tool 写操作必须带幂等键 |

### 7.4 重复任务防护

| 场景 | 幂等键 |
|------|--------|
| duplicate email prevention | `tenant_id + provider + message_id + attachment_hash` |
| duplicate PayrollCase prevention | `tenant_id + company_id + salary_month` |
| duplicate interview task prevention | `tenant_id + candidate_id + interviewer_ids + scheduled_at` |

### 7.5 验收标准

- Worker 崩溃后不会重复创建薪资 Case 或面试任务。
- 同一 PayrollCase 的状态转换不会并发写入。
- DLQ 可查看、重放和标记已处理。

---

## 8. Detailed Gap: Tenant / Company Agent Configuration

### 8.1 配置范围

配置中心应支持租户级、公司级和 Agent 级覆盖。默认值来自平台配置，公司级配置覆盖租户级配置。

### 8.2 配置项

| 配置 | 示例 |
|------|------|
| Agent enable/disable | 启用 Payroll Agent，关闭 Recruitment Agent |
| enabled Case types | 仅启用 AttendanceAnomalyCase 和 PayrollCase |
| payroll settlement start day | 每月 20 日开始预检 |
| attendance cutoff day | 每月 25 日截止考勤 |
| salary pay day | 每月 30 日发薪 |
| appeal window | 考勤异常 3 个工作日内可申诉 |
| holiday strategy | 法定节假日 + 公司假期 |
| work calendar | 中国大陆工作日历、地区日历 |
| shift rules | 标准班、弹性班、夜班 |
| approval chain | HR -> 经理 -> 财务 -> 最终审批 |
| finance review requirement | 薪资发放前必须财务审核 |
| external LLM allowed | 禁止外部 LLM，仅本地模型 |
| offline-only mode | 仅本地解析和规则回复 |
| knowledge base visibility | 公司级、部门级、角色级 |
| document retention | 合同、简历、截图保留期限 |
| notification channels | 站内、邮件、企业微信/钉钉/飞书 |
| SLA escalation policy | 超时升级到部门负责人 |
| token budget and monthly quota | 租户月度 token 上限 |

### 8.3 验收标准

- 同一平台内两个租户可有不同薪资日、申诉窗口和 LLM 策略。
- 配置变更有版本、审批、审计和生效时间。
- Agent Run 记录命中的配置版本。

---

## 9. Detailed Gap: Work Calendar / Shift / Timezone

### 9.1 必须确定性建模

LLM 不得推断工作日、节假日、班次、跨日打卡或薪资周期。所有规则必须由版本化日历、班次和考勤规则执行。

### 9.2 覆盖规则

| 规则 | 说明 |
|------|------|
| legal holidays | 法定节假日 |
| adjusted workdays | 调休工作日 |
| company holidays | 公司额外假期 |
| region calendars | 地区日历 |
| shift schedules | 固定班次、排班表 |
| flexible working hours | 弹性上下班和核心工时 |
| night shifts | 跨日夜班 |
| cross-day punch | 上下班跨自然日 |
| half-day leave | 半天假 |
| hourly leave | 小时假 |
| overtime on holidays | 节假日加班 |
| timezone conversion | 多时区考勤和工资周期 |
| payroll period boundaries | 薪资归属期边界 |
| attendance period boundaries | 考勤统计期边界 |

### 9.3 验收标准

- 夜班 22:00-06:00 打卡不会被误判为缺勤。
- 调休工作日按公司/地区日历确定。
- 半天假和小时假扣减由规则引擎执行，LLM 只解释。

---

## 10. Detailed Gap: Recruitment Fairness and Bias Control

### 10.1 受限属性

招聘 Agent 不得使用或暗示使用非岗位相关的敏感属性：

- gender
- age
- marriage/pregnancy/family status
- ethnicity
- religion
- birthplace/hukou where not job-related
- photo/appearance
- disability unless legally/job-relevant
- non-job-related private information

### 10.2 设计要求

| 能力 | 说明 |
|------|------|
| blocked attributes | 简历解析时识别并屏蔽 |
| sensitive attribute detection | 文本、图片、附件 OCR 都要检测 |
| fair JD matching rubric | JD 匹配仅基于技能、经验、证书、岗位要求 |
| explainable scoring | 分数解释引用岗位要求，不引用敏感属性 |
| human review requirement | 候选人不能被 Agent 自动拒绝 |
| no automatic rejection | Agent 只推荐和标记风险 |
| bias evaluation | golden set 包含公平性测试 |
| compliant rejection templates | 拒绝模板由 HR 审核 |
| candidate appeal/review possibility | 支持候选人复核流程 |
| audit logging | 评分、解释、人审记录可追溯 |

### 10.3 验收标准

- 简历中的照片、年龄、婚育信息不会进入 JD 匹配向量文本。
- Agent 不自动淘汰候选人。
- 招聘评分解释只引用岗位相关证据。

---

## 11. Detailed Gap: Deterministic Rule Engine

### 11.1 职责边界

- Knowledge Base explains rules.
- Rule Engine executes rules.
- LLM summarizes and explains, but does not make final payroll/attendance decisions.

### 11.2 规则对象

| 规则类型 | 示例 |
|----------|------|
| attendance rules | 迟到、早退、漏打卡、跨日 |
| payroll rules | 应发、实发、扣款、社保公积金 |
| leave deduction rules | 年假、事假、病假扣减 |
| overtime rules | 工作日/休息日/节假日加班 |
| annual leave rules | 司龄、入职时间、折算 |
| approval matrix | 金额、部门、角色审批路径 |
| contract reminder rules | 合同到期 30/15/7 天提醒 |

### 11.3 Rule DSL 和决策表

```json
{
  "rule_id": "late_arrival_v3",
  "version": "3.0",
  "effective_from": "2026-01-01",
  "conditions": [
    {"when": "punch_in > shift_start + grace_minutes", "then": "mark_late"}
  ],
  "inputs": ["punch_in", "shift_start", "grace_minutes"],
  "outputs": ["attendance_status"],
  "owner": "HR Operations"
}
```

### 11.4 治理能力

- rule versioning
- effective dates
- rule simulation
- rule testing
- rule rollback
- rule impact analysis

### 11.5 验收标准

- 所有影响薪资和考勤的规则均可测试和模拟。
- 新规则发布前能跑历史样本 impact analysis。
- LLM 不能绕过规则引擎直接判定考勤或薪资。

---

## 12. Detailed Gap: Evidence Management and Chain of Custody

### 12.1 证据类型

| 证据 | 示例 |
|------|------|
| punch device logs | 打卡设备原始记录 |
| access control records | 门禁进出记录 |
| WiFi/location records if available | 可用时的 WiFi/定位记录 |
| leave approvals | 请假审批单 |
| business trip records | 出差记录 |
| overtime approvals | 加班审批 |
| CCTV/monitoring references | 监控引用，不直接给 Agent 消费 |
| employee appeal attachments | 员工申诉附件 |
| HR decision comments | HR 处理意见 |
| manager decision comments | 经理处理意见 |

### 12.2 证据引用模型

```json
{
  "evidence_id": "uuid",
  "case_id": "uuid",
  "evidence_type": "PUNCH_DEVICE_LOG",
  "source_ref": {"entity_type": "attendance_record", "entity_id": "uuid"},
  "file_ref": "file_id_if_any",
  "time_range": {"from": "2026-06-25T08:00:00+08:00", "to": "2026-06-25T10:00:00+08:00"},
  "access_policy": {"roles": ["HR_MANAGER"], "reason_required": true},
  "checksum": "sha256",
  "created_at": "timestamp"
}
```

### 12.3 安全要求

- evidence access permission
- access reason
- limited time range
- watermark
- download restriction
- access audit
- retention policy
- tamper prevention
- chain of custody
- evidence summary for Agent
- CCTV cannot be directly consumed by Agent without human-controlled process

### 12.4 验收标准

- 每次证据预览、下载、引用都有访问原因和审计。
- 证据摘要可给 Agent，原始 CCTV 或监控内容不能直接进入 LLM。
- 证据哈希和 custody log 可追溯。

---

## 13. Detailed Gap: Notification and SLA Escalation

### 13.1 通知渠道

- in-app notifications
- email notifications
- future enterprise WeChat/DingTalk/Feishu extension

### 13.2 通知能力

| 能力 | 说明 |
|------|------|
| notification templates | 按 Case、语言、角色配置 |
| deduplication | 防止重复提醒 |
| quiet hours | 非紧急通知避开休息时间 |
| delivery status | SENT/FAILED/READ |
| retry | 邮件或 IM 失败重试 |
| escalation policy | 超时升级 |
| SLA clock | 计算 Case/审批剩余时间 |
| responsible owner | 当前负责人 |
| next approver | 下一审批人 |
| Case stuck alerts | 卡住 Case 告警 |

### 13.3 示例

| 场景 | 触发 |
|------|------|
| payroll finance review overdue | 财务审核超过配置时限 |
| contract expiry approaching | 合同 30/15/7 天到期 |
| attendance appeal deadline | 申诉窗口即将关闭 |
| onboarding material missing | 入职材料未补齐 |
| offboarding asset return overdue | 资产归还逾期 |
| recruitment candidate waiting for review | 候选人等待 HR 审核超时 |

### 13.4 验收标准

- 每条通知有模板版本、接收人、渠道、送达状态和审计。
- SLA clock 暂停/恢复规则明确。
- Case 超时能找到 owner 和 next approver。

---

## 14. Detailed Gap: External Integration Catalog

### 14.1 集成清单

| 集成 | purpose | data direction | authentication | sensitivity | retry | audit | offline requirement | human approval | failure handling |
|------|---------|----------------|----------------|-------------|-------|-------|---------------------|----------------|------------------|
| Tencent enterprise email / Agent email | 招聘邮件接入 | inbound | API key/OAuth/webhook | L2-L4 | 是 | 是 | 可替代为 IMAP | 否 | 入 DLQ |
| IMAP/POP3 | 通用邮件接入 | inbound | password/OAuth | L2-L4 | 是 | 是 | 支持内网邮箱 | 否 | 重试/告警 |
| enterprise WeChat | 通知和审批提醒 | outbound/inbound | app secret | L1-L2 | 是 | 是 | 可关闭 | 高风险需人审 | 降级站内 |
| DingTalk | 通知和审批提醒 | outbound/inbound | app secret | L1-L2 | 是 | 是 | 可关闭 | 高风险需人审 | 降级站内 |
| Feishu | 通知和审批提醒 | outbound/inbound | app secret | L1-L2 | 是 | 是 | 可关闭 | 高风险需人审 | 降级站内 |
| e-signature | 合同签署 | outbound/inbound | service credential | L3-L4 | 是 | 是 | 通常不支持 | 是 | 人工处理 |
| bank payroll file export | 银行工资文件 | outbound | HSM/secure credential | L4 | 受控 | 是 | 可离线文件 | 是 | 阻止并告警 |
| social security/public fund systems | 社保公积金 | outbound/inbound | gov credential | L4 | 受控 | 是 | 视地区 | 是 | 人工处理 |
| job boards | 招聘渠道 | inbound/outbound | API key/OAuth | L2-L3 | 是 | 是 | 可关闭 | 发布需人审 | 标记失败 |
| calendar system | 面试/审批日程 | outbound/inbound | OAuth | L1-L2 | 是 | 是 | 可关闭 | 否 | 回退站内 |
| access control system | 门禁证据 | inbound | service credential | L3 | 是 | 是 | 内网优先 | 否 | 标记证据缺失 |
| attendance device | 打卡数据 | inbound | device token/VPN | L3 | 是 | 是 | 内网 | 否 | 延迟同步状态 |
| OA approval system | 外部审批 | inbound/outbound | OAuth/S2S | L2-L4 | 是 | 是 | 可关闭 | 依审批类型 | 同步失败告警 |
| object storage | 文件和资产 | in/out | IAM/STS | L1-L4 | 是 | 是 | 可本地替代 | 否 | 重试/隔离 |
| antivirus service | 文件扫描 | outbound | API key | L1-L4 | 是 | 是 | 可本地 ClamAV | 否 | 文件隔离 |
| OCR service | 文档解析 | outbound | API key | L1-L4 | 是 | 是 | 本地 OCR 优先 | 否 | 人工复核 |
| vector database | 知识检索 | in/out | service credential | L1-L2 | 是 | 是 | 可本地 pgvector | 否 | 关键词降级 |
| LLM provider | 摘要/解释 | outbound | API key/service auth | L0-L2 only | 是 | 是 | 可本地模型 | 高风险任务需策略 | fallback/降级 |

### 14.2 验收标准

- 每个 integration 都有认证、敏感度、重试、审计和失败处理说明。
- 外部 LLM 和 OCR 的数据出境策略可按租户关闭。
- 高敏 outbound 集成必须有人审或明确系统授权。

---

## 15. Detailed Gap: Service Security and Secret Management

### 15.1 硬规则

- no API keys in frontend
- no API keys in prompts
- no API keys in logs
- no API keys in Agent memory
- no API keys in MCP arguments

### 15.2 Secret 管理

| 能力 | 设计 |
|------|------|
| secret manager/environment variables | 生产使用 Secret Manager，开发用 env |
| key rotation | 支持定期轮换和紧急吊销 |
| service-to-service authentication | service JWT 或 mTLS 作为未来选项 |
| webhook signature verification | timestamp + nonce + signature |
| outbound network allowlist | 限制外联域名和端口 |
| local/offline model isolation | 离线模型与外网隔离 |
| dev/test/prod separation | 不共享 key、数据、向量库 |
| mTLS or service JWT as future option | 对高敏服务逐步启用 |

### 15.3 验收标准

- 代码、文档、日志、Agent memory、prompt 中扫描不到 secret。
- webhook 无签名或重放请求被拒绝。
- dev/test/prod 凭据和数据隔离。

---

## 16. Detailed Gap: User Feedback and Continuous Improvement

### 16.1 反馈入口

- thumbs up/down
- reason tags
- HR correction of Agent suggestion
- wrong answer report
- missing KB report
- prompt improvement queue
- golden set candidate generation
- human labeling queue

### 16.2 晋升规则

反馈不得直接写入长期记忆或知识库。必须经过：

```
feedback -> triage -> human review -> label -> candidate KB/memory update -> safety check -> publish
```

### 16.3 Memory poisoning 防护

- 用户反馈默认 `UNTRUSTED`。
- 恶意纠错、注入文本、伪政策不得进入 prompt 或 system context。
- 只有审核通过的反馈才能成为 golden set 或 KB 修订候选。

### 16.4 验收标准

- 负反馈可追踪到具体 Agent Run。
- KB 缺失报告不会自动创建 KB chunk。
- 反馈晋升全流程有审核和审计。

---

## 17. Detailed Gap: Case Dependency Graph

### 17.1 依赖类型

| 类型 | 说明 |
|------|------|
| blocking dependency | 上游未完成时下游不能推进 |
| advisory dependency | 上游状态只作为提醒或风险 |
| parent/child case relationship | 父 Case 派生子 Case |
| cross-case audit | 跨 Case 状态变更可追溯 |

### 17.2 关键依赖

| 依赖 | 类型 | 说明 |
|------|------|------|
| RecruitmentCase -> OnboardingCase | parent/child | Offer 接受后创建入职 Case |
| OnboardingCase -> ProbationCase | parent/child | 入职完成后创建试用期 Case |
| AttendanceAnomalyCase -> PayrollCase | blocking | 未锁定考勤异常阻塞薪资 |
| EmployeeChangeCase -> PayrollCase | advisory/blocking | 调岗/调薪可能影响薪资 |
| ContractCase -> EscalationCase | advisory | 到期未处理升级 |
| OffboardingCase -> AccessReviewCase + PayrollSettlement + AssetReturn | parent/child | 离职触发权限、结算、资产 |
| PolicyVersionCase -> AttendanceRule / PayrollRule / KB index | blocking | 新政策发布需同步规则和 KB |
| PayrollCase -> PayslipGenerated / ReadyForPayment | parent/child | 薪资锁定后生成工资条和支付准备 |

### 17.3 可视化

Case Workbench 应显示当前 Case 的上游阻塞、下游影响、父子关系和最近跨 Case 审计事件。

### 17.4 验收标准

- PayrollCase 能展示阻塞它的 AttendanceAnomalyCase。
- PolicyVersionCase 发布时能列出受影响的规则和 KB 索引。
- 关闭父 Case 时不会误关闭仍需处理的子 Case。

---

## 18. Detailed Gap: Frontend Permission Explainability

### 18.1 UI 解释对象

- why user cannot see data
- why tool is blocked
- why Case is stuck
- why human approval is required
- who is next approver
- what permission is missing
- whether data is masked
- how to request access
- Data Guard denial explanation without leaking data

### 18.2 安全解释结构

```json
{
  "decision": "DENY",
  "safe_reason": "当前角色缺少 SALARY_READ 权限",
  "missing_permission": "SALARY_READ",
  "request_access_action": "contact_admin",
  "data_leak_free": true
}
```

禁止在拒绝说明中暴露“被拒绝的数据内容”。可以说明缺权限、范围不匹配或数据被遮蔽。

### 18.3 验收标准

- 被拒绝时用户能知道下一步找谁或申请什么权限。
- 拒绝原因不泄露目标员工、薪资、合同、候选人等敏感内容。
- blocked tool 和 masked field 在 UI 上可解释。

---

## 19. Detailed Gap: HR Analytics and Reporting Agent

### 19.1 只读场景

| 场景 | 数据来源 |
|------|----------|
| turnover rate explanation | Reporting API |
| attendance anomaly trend | Attendance/Reporting API |
| overtime trend | Attendance/Reporting API |
| payroll cost change | Payroll/Reporting API |
| recruitment conversion | Recruitment reporting API |
| average time to hire | Recruitment reporting API |
| onboarding duration | Case reporting API |
| contract expiry trend | Contract reporting API |
| data quality issue count | DataQualityCase reporting |

### 19.2 职责边界

Reporting Agent 使用确定性 reporting APIs。LLM 解释结果、总结趋势、提示可能原因，但不得从原始数据自行计算权威指标。

### 19.3 验收标准

- 每个图表或指标都有 reporting API 来源。
- LLM 输出不改变指标值和单位。
- 需要钻取明细时重新通过 Tool 查询并进行权限过滤。

---

## 20. Detailed Gap: Data Quality and Master Data Governance

### 20.1 检查项

| 检查 | 影响 |
|------|------|
| employee missing department | 组织范围和审批链异常 |
| employee missing manager | 审批无法路由 |
| duplicate employee profile | 薪资/考勤重复 |
| active employee missing contract | 合规风险 |
| resigned employee still has active account | 安全风险 |
| salary rule missing | 薪资无法计算 |
| shift rule missing | 考勤无法判定 |
| approval chain missing approver | Case 卡住 |
| payroll config missing | PayrollCase 无法启动 |
| contract start date inconsistent | 合同风险 |
| onboarding incomplete | 入职流程卡住 |
| offboarding access not revoked | 权限风险 |

### 20.2 DataQualityCase

数据质量问题应生成 `DataQualityCase`，包括问题类型、影响范围、修复建议、负责人、SLA 和审计记录。

### 20.3 验收标准

- 缺班次、缺审批人、缺薪资配置会阻止相关 Case 推进并给出解释。
- 数据质量规则可按租户启停。
- 修复后依赖 Case 可恢复。

---

## 21. Detailed Gap: Deployment Topology and Environments

### 21.1 环境

| 环境 | 用途 |
|------|------|
| local development | 本地开发，mock LLM/Tool 可用 |
| test | 自动测试和集成测试 |
| staging | 类生产验收和安全测试 |
| production | 生产环境 |

### 21.2 组件拓扑

- Spring Boot backend-modern
- Node.js/TS Agent Runtime
- Python Tool Service
- PostgreSQL
- Redis/MQ
- object storage
- vector database
- observability stack
- secrets
- network isolation

### 21.3 部署能力

| 能力 | 说明 |
|------|------|
| Docker Compose | local/test 快速启动 |
| health checks | runtime、tool service、DB、Redis、vector DB |
| rolling deployment | Runtime 无停机升级 |
| rollback | prompt/model/config/runtime 回滚 |
| network isolation | 生产内网服务和外部 provider 出口隔离 |

### 21.4 验收标准

- staging 能完整跑 P0 golden set。
- Runtime 升级失败可回滚到上一版本。
- Python Tool Service 不健康时，系统能降级或暂停相关任务。

---

## 22. Detailed Gap: Cost Control and Quota

当前仓库未发现 `docs/agent/v1/token-cost-offline-tooling-design.md`。若后续创建该文档，本节应以引用为主，避免重复细节。

### 22.1 配额与预算

- per-tenant monthly token quota
- per-user daily quota
- per-Agent cost budget
- per-Case cost budget
- high-cost task approval
- cache reuse
- embedding deduplication
- document reindex cost control
- OCR batch control
- model tiering
- cost anomaly detection

### 22.2 最低可行策略

| 策略 | 说明 |
|------|------|
| model tiering | 低风险摘要用低成本模型，高风险解释用强模型或本地模型 |
| budget guard | 超租户/月度预算阻止或要求审批 |
| embedding dedupe | 文档 checksum 未变不重嵌入 |
| OCR batch limit | 限制并发和单日 OCR 页数 |
| context reuse | 同一 Case 的安全摘要可缓存短期复用 |

### 22.3 验收标准

- 租户成本可按 Agent/Case/model 拆分。
- 超预算高成本任务进入审批或拒绝。
- 文档未变化时不会重复 reindex。

---

## 23. Detailed Gap: Cache and Data Freshness

### 23.1 可缓存与不可缓存

| 类型 | 策略 |
|------|------|
| static policy chunk | 可缓存，随 KB version 失效 |
| Case state | 短 TTL + 事件失效 |
| permission snapshot | 短 TTL + 权限变更立即失效 |
| conversation context | 会话 TTL，敏感内容脱敏 |
| salary data | 不做长期缓存，必要时实时 Tool 查询 |
| attendance data | 可短 TTL，需 stale warning |
| LLM summary | 可按 context_pack_hash 短期缓存 |

### 23.2 失效事件

- permission change invalidation
- Case state invalidation
- KB version invalidation
- policy superseded invalidation
- conversation context invalidation
- employee role change invalidation

### 23.3 Freshness warning

当数据来自缓存且可能影响决策时，回复和 UI 应显示数据时间戳。薪资、考勤、审批状态这类高风险数据默认应实时查权威 Tool。

### 23.4 验收标准

- 权限变更后旧权限缓存不可继续访问受限数据。
- SUPERSEDED 政策不会被当前查询默认命中。
- 使用非实时数据时有明确 stale warning。

---

## 24. Prioritized Roadmap

### P0: must before implementation

| 顺序 | 主题 | 原因 |
|------|------|------|
| 1 | evaluation/redteam | 没有评测门禁无法安全迭代 prompt/model |
| 2 | LLMOps | 生产可追溯和可回滚的基础 |
| 3 | token/cost/offline governance | 防止成本失控和数据外发不合规 |
| 4 | deterministic rule engine | 薪资/考勤/审批必须确定性 |
| 5 | tenant configuration | 多租户差异必须配置化 |
| 6 | queue/concurrency/recovery | 防止重复 Case 和任务丢失 |

### P1: must before production pilot

| 顺序 | 主题 | 原因 |
|------|------|------|
| 1 | observability | 试点需要看见运行状态和错误 |
| 2 | service security | secret、webhook、S2S 安全必须上线前完成 |
| 3 | notification/SLA | 试点流程需要可推动 |
| 4 | work calendar/shift/timezone | 考勤和薪资试点必需 |
| 5 | evidence management | 考勤申诉和审计需要证据链 |
| 6 | recruitment fairness | 招聘试点前需合规边界 |

### P2: must before enterprise rollout

| 顺序 | 主题 |
|------|------|
| 1 | deployment topology |
| 2 | external integration catalog |
| 3 | data quality governance |
| 4 | case dependency graph |
| 5 | frontend permission explainability |

### P3: future enhancement

| 顺序 | 主题 |
|------|------|
| 1 | analytics agent |
| 2 | user feedback continuous improvement |
| 3 | advanced cost optimization |

---

## 25. Cross-References

| 文档 | 关系 |
|------|------|
| `docs/agent/v1/multi-agent-architecture.md` | Agent、Tool、Data Guard、Human Approval、Audit 的基础架构 |
| `docs/agent/v1/memory-and-context-compression-design.md` | 记忆分层、Safe Context Pack、上下文压缩和 MemoryGuard |
| `docs/agent/v1/architecture-gap-addendum.md` | Case-driven 模型、Hook、运行时边界、确定性规则边界 |
| `docs/agent/v1/enterprise-knowledge-base-chunking-design.md` | 企业知识库摄取、chunking、表格/图片/资产和 RAG citation |
| `docs/agent/v1/token-cost-offline-tooling-design.md` | 当前仓库未发现该文档；若后续新增，成本和离线治理应以该文档为主 |

### 25.1 建议补充到既有文档的短引用

既有文档只需增加短引用：

> **[提议]** 生产就绪差距分析、剩余设计主题优先级和上线前验收地图，详见 `docs/agent/v1/agent-production-readiness-gap-analysis.md`。

---

## 26. Final Report Checklist

完成本任务时应报告：

- files created
- files updated
- major gap areas documented
- assumptions
- open questions
- confirmation that no source code was modified

---

## 附录：生产前关键不变式

```text
Every high-risk tool call has permission check + audit + optional human approval.
Every LLM call records model_version + prompt_version + context_pack_hash.
Every Case transition is deterministic, locked, auditable, and replay-safe.
Every KB/RAG citation is tenant/company/RBAC/version filtered.
No L4 raw data enters prompt, vector_text, embedding, memory, logs, or frontend traces.
No business fact is copied from backend-modern into KB or long-term memory as truth.
```
