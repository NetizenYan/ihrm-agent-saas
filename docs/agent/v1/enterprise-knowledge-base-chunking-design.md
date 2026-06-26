# iHRM Enterprise Knowledge Base 摄取与切分架构设计

> 版本：1.0  
> 日期：2026-06-27  
> 依赖文档：`docs/agent/v1/multi-agent-architecture.md`、`docs/agent/v1/memory-and-context-compression-design.md`、`docs/agent/v1/architecture-gap-addendum.md`  
> 分支：`phase4-backend-modern-full-replacement`  
> 状态：架构与技术实现提议，仅文档，不涉及源码变更  
> 约定：**[提议]** 表示新增设计，尚未实现；**[现有]** 表示既有系统能力或既有文档约束

---

## 目录

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Knowledge Base Content Types](#2-knowledge-base-content-types)
3. [Chunking Principles](#3-chunking-principles)
4. [Parent-Child Chunking Model](#4-parent-child-chunking-model)
5. [Chunk Type Taxonomy](#5-chunk-type-taxonomy)
6. [Text Document Chunking](#6-text-document-chunking)
7. [Table Handling](#7-table-handling)
8. [Image, Screenshot, and Tutorial Handling](#8-image-screenshot-and-tutorial-handling)
9. [Flowcharts and Org Charts](#9-flowcharts-and-org-charts)
10. [Forms and Templates](#10-forms-and-templates)
11. [Metrics and Data Dictionary](#11-metrics-and-data-dictionary)
12. [Metadata Schema](#12-metadata-schema)
13. [Proposed Data Model](#13-proposed-data-model)
14. [Ingestion Pipeline](#14-ingestion-pipeline)
15. [Retrieval Pipeline](#15-retrieval-pipeline)
16. [Security and Privacy](#16-security-and-privacy)
17. [Integration With Existing Memory and Context Compression Design](#17-integration-with-existing-memory-and-context-compression-design)
18. [Integration With Multi-Agent Cases](#18-integration-with-multi-agent-cases)
19. [Frontend UX](#19-frontend-ux)
20. [Python Prototype Design](#20-python-prototype-design)
21. [Future TypeScript / Node.js Runtime Design](#21-future-typescript--nodejs-runtime-design)
22. [Acceptance Criteria](#22-acceptance-criteria)
23. [Implementation Roadmap](#23-implementation-roadmap)
24. [Update Existing Docs](#24-update-existing-docs)

---

## 1. Purpose and Scope

### 1.1 目标

**[提议]** 本文档定义企业知识库从上传、解析、切分、归一化、索引、检索、引用展示到安全审计的完整设计。它补足既有 Memory / RAG 设计中尚未展开的知识库摄取与 chunking 细节。

知识库不是业务数据库，也不是文件原件仓库。它面向 Agent RAG 问答、政策解释、SOP 指引、教程步骤检索和来源引用展示。

### 1.2 三类数据边界

| 类型 | 存储内容 | 访问方式 | Agent 使用方式 |
|------|----------|----------|----------------|
| 企业知识库 | 政策、规则、SOP、模板、FAQ、系统手册、截图教程、指标定义、匿名案例、工具手册、工作流说明 | RAG 检索 + 元数据过滤 | 用于解释、引用、导航和辅助理解 |
| 业务数据库 | 员工、薪资记录、考勤记录、审批记录、合同、候选人、薪资结果 | backend-modern Tool / API | 作为权威事实源实时查询 |
| 文件存储 | PDF/DOCX 原件、截图、合同文件、简历文件、教程图片 | `file_object` 引用 + 权限检查 | 作为受控原件或引用资产，不直接塞入上下文 |

### 1.3 Agent 必须使用的通道

| 需求 | 必须使用 |
|------|----------|
| 知识解释、制度问答、操作手册问答 | RAG 检索知识库 |
| 员工、薪资、考勤、审批、候选人等权威事实 | backend-modern Tool |
| PDF/DOCX/图片/合同/简历等原件 | 文件引用 + 权限控制 |
| 租户、公司、角色、字段敏感度过滤 | Data Guard |

### 1.4 非目标

- 不把真实员工薪资表、原始考勤流水、完整简历、完整合同原文复制进知识库。
- 不让 LLM 作为薪资、考勤、审批或合同责任的最终决策引擎。
- 不在本文档中创建迁移文件、后端代码或前端代码。

---

## 2. Knowledge Base Content Types

| 内容类型 | 目的 | 示例文档 | 目标 Agent | 敏感度 | 可进 LLM | 必须引用 |
|----------|------|----------|------------|--------|----------|----------|
| HR policies | 解释公司 HR 制度 | 员工手册、纪律制度 | Compliance, HR Service | L1 | 是 | 是 |
| Attendance rules | 解释考勤、迟到、补卡、申诉 | 考勤管理制度 | Attendance, Employee Self-Service | L1-L2 | 是 | 是 |
| Payroll and benefits rules | 解释薪资结构、福利、扣款规则 | 薪资计算规则、福利说明 | Payroll, HR | L1-L2 | 是，但不含个人金额 | 是 |
| Recruitment JD and screening standards | 支持 JD 匹配和筛选标准解释 | 岗位说明书、面试评分标准 | Recruitment | L1-L2 | 是 | 是 |
| Contract templates and renewal rules | 解释模板、续签条件、到期规则 | 劳动合同模板、续签 SOP | Contract | L1-L2 | 是，禁原始个人合同 | 是 |
| Onboarding/offboarding SOPs | 指导入离职操作 | 入职清单、离职交接流程 | HR Service | L1 | 是 | 是 |
| Probation/transfer/promotion workflows | 解释试用期、调动、晋升流程 | 转正流程、调岗流程 | HR Service, Approval | L1 | 是 | 是 |
| Approval workflow explanations | 解释审批路径和节点职责 | 请假审批说明、薪资审批说明 | Approval, Leader Review | L1 | 是 | 是 |
| Employee self-service FAQ | 员工自助问答 | 如何补卡、如何开收入证明 | Employee Self-Service | L1 | 是 | 是 |
| System operation manuals | 指导系统页面操作 | 员工管理操作手册 | HR, Admin | L1 | 是 | 是 |
| Notification/announcement documents | 公告和制度变更说明 | 端午假期通知、政策更新公告 | Compliance, HR | L1 | 是 | 是 |
| Anonymized historical cases | 提供相似案例参考 | 去标识化考勤申诉案例 | Orchestrator, HR, Attendance | L1-L2 | 是 | 是 |
| Metric/data dictionary | 统一指标口径 | 在职人数、离职率、招聘转化率 | Reporting, Payroll, HR | L1-L2 | 是 | 是 |
| Agent tool manuals | 说明 Tool 能力、输入输出和限制 | `query_employee` 工具手册 | Orchestrator, Data Guard | L0-L1 | 是 | 是 |
| Case state machine manuals | 说明 Case 状态机和转换条件 | PayrollCase 状态机说明 | Orchestrator, Audit | L0-L1 | 是 | 是 |
| Hook lifecycle manuals | 说明 Hook 触发点和安全检查 | `before_tool_call` 生命周期 | Orchestrator, Audit, Data Guard | L0-L1 | 是 | 是 |

---

## 3. Chunking Principles

### 3.1 核心规则

> 不按固定 token 长度机械切文档。必须按“可回答的语义单元”切分。

一个 chunk 应该满足：

- 可独立回答一个具体问题。
- 只覆盖一个规则、一个流程阶段、一个 FAQ、一个表格行组、一个教程步骤或一个指标定义。
- 可追溯到原始文档、页码、章节、版本和生效日期。
- 感知租户、公司、权限和状态。
- 能被 Data Guard 在检索前后过滤。

### 3.2 语义切分优先级

1. 标题层级：章节、条款、子条款。
2. 业务意图：一个问题、一条规则、一个动作。
3. 结构类型：表格、图片、流程图、表单字段。
4. 安全边界：高敏字段和受限段落单独隔离或拒绝入库。
5. Token 预算：仅在语义边界内控制长度。

### 3.3 Parent-Child 与标题路径

所有 child chunk 保留 parent title 与 `heading_path`，避免检索到孤立句子。

```
员工手册 v3
  > 第 4 章 考勤
    > 4.2 迟到规则
      > child: 迟到定义
      > child: 迟到处理流程
      > child: 申诉入口
```

### 3.4 Overlap 策略

| 场景 | 策略 |
|------|------|
| 连续叙述性政策 | child 间保留 50-100 中文字上下文 |
| SOP 阶段 | 可保留上一阶段的阶段名和退出条件 |
| FAQ | 不使用 overlap，保持问答边界清晰 |
| 表格行组 | 不使用正文 overlap，改为重复表头和适用范围 |
| 指标定义 | 不使用 overlap，一个指标一个 chunk |
| 法律/合同条款 | 不使用自动 overlap，避免错误拼接条款 |
| 教程步骤 | 不使用正文 overlap，通过 `step_number` 和 `previous_step_id` 串联 |

### 3.5 中文文档 chunk 大小建议

| 类型 | 建议大小 | 说明 |
|------|----------|------|
| 政策条款 | 300-900 中文字 | 一条规则或一个子条款 |
| SOP 阶段 | 400-1200 中文字 | 一个阶段含触发条件、动作、产出 |
| FAQ | 100-500 中文字 | 一个问答对 |
| 表格摘要 | 150-400 中文字 | 用于向量召回 |
| 表格行组 | 5-30 行 | 按业务分组，不按固定行数 |
| 教程步骤 | 100-400 中文字 + 图片引用 | 一个 UI 操作 |
| 指标定义 | 200-800 中文字 | 一个指标含公式和口径 |

---

## 4. Parent-Child Chunking Model

### 4.1 层级模型

```
Document
  -> Parent Chunk
       -> Child Chunk
            -> Asset Chunk
```

| 层级 | 职责 | 示例 |
|------|------|------|
| Document | 原始知识文档的注册对象 | 《考勤管理制度 v3》 |
| Parent Chunk | 章节或业务主题容器 | 第 4 章 迟到与早退 |
| Child Chunk | 可回答单元 | 迟到认定规则 |
| Asset Chunk | 图片、表格、流程图等资产 | 迟到申诉流程图 |

### 4.2 每个 child chunk 必备上下文

```json
{
  "parent_title": "第 4 章 考勤管理",
  "heading_path": ["考勤管理制度", "迟到与早退", "迟到认定"],
  "page_number": 12,
  "section_id": "4.2.1",
  "version": "v3.0",
  "effective_from": "2026-01-01",
  "tenant_id": "uuid",
  "company_id": "uuid",
  "related_case_types": ["AttendanceAnomalyCase", "LeaveOvertimeCase"],
  "related_tools": ["query_attendance_records", "detect_attendance_anomalies"]
}
```

### 4.3 示例

| 文档 | Parent Chunk | Child Chunk | Asset Chunk |
|------|--------------|-------------|-------------|
| 员工手册 | 考勤章节 | 补卡申请规则 | 补卡页面截图 |
| 考勤政策 | 迟到处理 | 迟到扣分规则 | 迟到处罚表 |
| 薪资政策 | 月度结算 | 考勤异常影响说明 | 薪资预检流程图 |
| 入职系统教程 | 创建员工档案 | 上传证件材料步骤 | UI 截图和按钮定位 |
| 审批流程指南 | 请假审批 | 经理审批节点 | 审批流图节点边 |

---

## 5. Chunk Type Taxonomy

| chunk_type | 输入来源 | 提取方法 | 存储格式 | vector_text 策略 | structured_payload 策略 | 检索策略 | LLM 使用策略 |
|------------|----------|----------|----------|------------------|--------------------------|----------|---------------|
| TEXT_POLICY | 制度、政策 | 标题/条款解析 | Markdown/text | 标题路径 + 条款摘要 + 正文 | 适用范围、生效日期、规则标签 | hybrid + 版本过滤 | 可解释，必须引用 |
| TEXT_SOP | SOP 文档 | 阶段/步骤解析 | Markdown/text | 阶段目标 + 触发条件 + 动作 | 输入、输出、负责人、退出条件 | 按 case_type 和动作检索 | 可指导，不可自动执行高风险动作 |
| FAQ | FAQ 文档 | 问答对抽取 | Q/A JSON | 问题同义改写 + 答案摘要 | question, answer, aliases | 关键词 + 向量 | 可直接回答，必须引用 |
| TABLE_FULL | 小表格 | 表格解析 | JSON/CSV/HTML | 表标题 + 表头 + 语义摘要 | 完整表结构 | 精确表名/主题检索 | 可展示整表 |
| TABLE_ROW_GROUP | 中型表格 | 表头 + 行组 | JSON row group | 表头 + 行组主题 + 关键值 | rows, header, group_key | 精确过滤 + rerank | 可回答局部问题 |
| RULE_TABLE | 决策表 | 表格 + 规则抽取 | Rule JSON + 表格 | 规则说明摘要 | conditions, actions, priority | 规则 id + 主题检索 | 仅解释，最终判断走规则引擎 |
| FORM_TEMPLATE | 表单模板 | 模板结构解析 | JSON schema + text | 表单用途 + 场景 | fields, sections, output | 按表单用途检索 | 可说明用途 |
| FORM_FIELD | 表单字段 | 字段级解析 | Field JSON | 字段标签 + 含义 + 校验 | 数据源、敏感度、权限 | 字段名/同义词检索 | 可解释，遵守字段可见性 |
| TUTORIAL_STEP | 操作教程 | 步骤解析 + 图片链接 | Step JSON | 页面 + 动作 + 预期结果 | step_number, route, image_refs | 按页面/动作检索 | 可指导用户操作 |
| IMAGE_ASSET | 图片/截图 | OCR + caption | Asset JSON | caption + OCR 脱敏文本 | file_id, bbox, elements | 资产随 step/chunk 返回 | 不直接作为事实源 |
| FLOWCHART | 流程图 | OCR + 图结构识别 | Nodes/edges JSON | 流程摘要 + 节点名 | nodes, edges, conditions | 按流程名/状态检索 | 可解释流程 |
| ORG_CHART | 组织图 | 图结构解析 | Org JSON | 部门/角色结构摘要 | departments, roles, edges | 按部门/角色检索 | 仅用于通用结构，不作员工事实 |
| METRIC_DEFINITION | 指标字典 | 指标块解析 | Metric JSON | 指标名 + 口径 + 公式 | formula, tools, window | 指标名精确优先 | 可解释口径，不查实时值 |
| LEGAL_CLAUSE | 法规条款 | 条款解析 | Clause text | 法条编号 + 标题 + 摘要 | jurisdiction, article_no | 精确编号 + hybrid | 可引用，需免责声明 |
| CASE_EXAMPLE | 匿名案例 | 脱敏摘要 | Case JSON | 场景 + 问题 + 处理结果 | case_type, resolution | 相似案例检索 | 仅参考，不作决策 |
| TOOL_MANUAL | Tool 手册 | 接口说明解析 | Tool JSON | 工具名 + 能力 + 限制 | input_schema, permissions | 工具名精确 | 辅助编排，不泄露密钥 |
| STATE_MACHINE_MANUAL | 状态机手册 | FSM 解析 | FSM JSON | Case 类型 + 状态 + 转换 | states, transitions | case_type 精确 | 解释合法流转 |
| HOOK_MANUAL | Hook 手册 | 生命周期解析 | Hook JSON | hook 名 + 触发点 + 安全规则 | inputs, outputs, effects | hook 名精确 | 解释安全检查 |

---

## 6. Text Document Chunking

### 6.1 适用文档

文本切分覆盖政策文档、HR 制度、员工手册、薪资政策、考勤政策、请假/加班政策、合同续签政策、入离职 SOP、系统手册和 FAQ。

### 6.2 政策条款示例

```json
{
  "chunk_type": "TEXT_POLICY",
  "title": "迟到认定规则",
  "heading_path": ["考勤管理制度 v3", "迟到与早退", "迟到认定"],
  "content_text": "员工实际上班打卡时间晚于排班开始时间，且未在规定时间内提交有效说明的，认定为迟到。",
  "vector_text": "考勤管理制度 v3 > 迟到与早退 > 迟到认定。说明什么情况算迟到，以及提交有效说明的影响。",
  "structured_payload": {
    "rule_subject": "late_arrival",
    "effective_from": "2026-01-01",
    "case_types": ["AttendanceAnomalyCase"]
  }
}
```

### 6.3 SOP 阶段示例

```json
{
  "chunk_type": "TEXT_SOP",
  "title": "入职资料收集阶段",
  "content_text": "HR 发起 OnboardingCase 后，应先收集身份、学历、银行卡等资料。高敏资料只进入受控文件或业务字段，不进入 RAG 正文。",
  "structured_payload": {
    "stage": "DOCS_COLLECTION",
    "owner_role": "HR",
    "entry_condition": "OnboardingCase.state=INITIATED",
    "exit_condition": "required_docs_uploaded=true"
  }
}
```

### 6.4 FAQ 示例

```json
{
  "chunk_type": "FAQ",
  "title": "员工如何申请补卡？",
  "content_text": "问：员工如何申请补卡？答：进入员工自助页面，选择考勤异常记录，提交补卡说明和证明材料，等待 HR 审核。",
  "structured_payload": {
    "question": "员工如何申请补卡？",
    "aliases": ["漏打卡怎么办", "忘记打卡怎么处理"],
    "answer": "通过员工自助页面提交补卡说明和证明材料。"
  }
}
```

### 6.5 指标定义示例

```json
{
  "chunk_type": "METRIC_DEFINITION",
  "title": "离职率",
  "content_text": "离职率 = 统计期内离职人数 / 统计期平均在职人数。统计期平均在职人数 = (期初在职人数 + 期末在职人数) / 2。",
  "structured_payload": {
    "metric_name": "turnover_rate",
    "formula": "terminated_count / average_active_employee_count",
    "source_tools": ["query_employee_changes", "get_employee_count"]
  }
}
```

---

## 7. Table Handling

### 7.1 核心原则

表格不能盲目 flatten 成普通文本。表格必须同时保留结构、语义摘要和可问答的行组。

### 7.2 三种表示

| 表示 | 用途 | 示例 |
|------|------|------|
| raw table structure | 原始结构展示和精确引用 | JSON/CSV/HTML table |
| semantic table summary | 向量召回 | “本表定义年假天数与司龄关系” |
| row group chunks | 精确问答 | “司龄 1-5 年年假规则” |

### 7.3 表格策略

| 表格规模/类型 | 处理策略 |
|---------------|----------|
| 小表格 | `TABLE_FULL`，完整表结构作为一个 chunk |
| 中型表格 | `TABLE_ROW_GROUP`，按业务分组切分，重复表头 |
| 大型业务表 | 不进入 KB，通过 backend-modern Tool 查询 |
| 决策表 | 同时存 RAG 解释和 deterministic Rule JSON |

### 7.4 示例表格

| 表格 | 推荐类型 | 说明 |
|------|----------|------|
| 请假类型表 | TABLE_FULL 或 TABLE_ROW_GROUP | 按假种分组 |
| 迟到处罚表 | RULE_TABLE | 影响考勤判定，需规则 JSON |
| 审批矩阵 | RULE_TABLE | 条件、金额区间、审批角色必须结构化 |
| 薪资规则表 | RULE_TABLE | 最终计算必须走规则引擎 |
| 年假规则表 | RULE_TABLE | 可解释，但余额计算走 Tool |
| 入职材料表 | TABLE_ROW_GROUP | 按员工类型或地区分组 |

### 7.5 决策表硬规则

影响薪资、考勤、审批流转的 Rule Table 必须进入确定性规则配置，不能只存 RAG 文本。LLM 可以解释规则，但不能作为最终计算器或决策引擎。

```json
{
  "chunk_type": "RULE_TABLE",
  "title": "迟到处理规则",
  "structured_payload": {
    "rule_id": "attendance_late_penalty_v3",
    "conditions": [
      {"if": "late_minutes <= 10", "action": "warning"},
      {"if": "late_minutes > 10 && late_minutes <= 30", "action": "manager_review"}
    ],
    "decision_engine": "backend-modern-rule-config"
  }
}
```

---

## 8. Image, Screenshot, and Tutorial Handling

### 8.1 支持资产

知识库支持入职系统截图、员工管理教程图片、薪资预检截图、审批流程截图、按钮/菜单截图和 UI 操作指南。

### 8.2 图片资产结构

每张图片作为受控文件资产保存，并生成受控元数据：

```json
{
  "asset_type": "SCREENSHOT",
  "file_id": "uuid",
  "ocr_text": "已脱敏 OCR 文本",
  "caption": "员工管理页面的新建员工按钮位于右上角",
  "detected_elements": [
    {"type": "button", "text": "新建员工", "bbox": [920, 88, 1010, 128]}
  ],
  "route": "/employees",
  "page_number": 3,
  "bbox": [0, 0, 1280, 720],
  "linked_chunk_id": "tutorial-step-uuid"
}
```

### 8.3 TUTORIAL_STEP chunk 格式

```json
{
  "chunk_type": "TUTORIAL_STEP",
  "step_number": 4,
  "page_or_route": "/employees",
  "action": "点击右上角的新建员工按钮",
  "expected_result": "打开新建员工表单",
  "prerequisites": ["已登录", "具备 EMPLOYEE_WRITE 权限"],
  "image_refs": ["asset_uuid"],
  "warnings": ["截图中的员工示例数据必须脱敏"],
  "source_citation": {
    "document_title": "员工管理操作手册 v2",
    "page": 8,
    "heading_path": ["员工管理", "新建员工"]
  }
}
```

### 8.4 敏感截图处理

截图可能包含员工姓名、手机号、身份证、薪资、银行卡、合同编号等 L3/L4 数据。摄取管线必须：

- 先 OCR，再做敏感字段检测。
- 能脱敏的截图生成 redacted asset。
- 不能可靠脱敏的截图进入 `SENSITIVE_DATA_DETECTED` 或 `HUMAN_REVIEW_REQUIRED`。
- L3/L4 未脱敏截图不得生成 embedding，不得进入 `vector_text`，不得进入 LLM Safe Context Pack。
- 只有显式批准并配置 restricted access 的资产可保留受限原图。

---

## 9. Flowcharts and Org Charts

### 9.1 流程图

流程图不能只依赖 OCR。必须结构化为节点、边、条件、摘要和源图引用。

```json
{
  "chunk_type": "FLOWCHART",
  "title": "考勤申诉流程",
  "nodes": [
    {"id": "detected", "label": "异常检测"},
    {"id": "appeal", "label": "员工申诉"},
    {"id": "hr_review", "label": "HR 审核"}
  ],
  "edges": [
    {"from": "detected", "to": "appeal", "condition": "员工提交申诉"},
    {"from": "appeal", "to": "hr_review", "condition": "材料完整"}
  ],
  "summary": "考勤异常从检测到员工申诉，再进入 HR 审核。",
  "source_asset_id": "asset_uuid"
}
```

适用对象包括审批流程图、入职流程图、薪资结算状态机图、考勤申诉流程和组织结构图。

### 9.2 组织图

组织图作为知识时，只能描述通用部门、角色和汇报结构模板。真实员工汇报关系必须通过 backend-modern Tool 查询。

```json
{
  "chunk_type": "ORG_CHART",
  "departments": ["人力资源部", "财务部"],
  "roles": ["HRBP", "薪资专员", "财务审批人"],
  "reporting_relationships": [
    {"from_role": "薪资专员", "to_role": "财务审批人", "relationship": "薪资发放协作"}
  ],
  "scope": "公司级角色结构说明",
  "effective_from": "2026-01-01"
}
```

---

## 10. Forms and Templates

### 10.1 支持表单

包括入职登记表、离职交接表、调薪申请表、收入证明模板、合同续签申请表、请假/加班申请表。

### 10.2 切分方式

| chunk | 内容 |
|-------|------|
| template purpose chunk | 表单用途、适用场景、输出格式 |
| field definition chunks | 字段名、标签、含义、来源、敏感度 |
| validation rule chunks | 必填、格式、范围、依赖关系 |
| approval rule chunks | 审批条件和审批角色 |
| output generation instruction chunk | 生成证明/文档时的模板说明 |

### 10.3 字段定义结构

```json
{
  "chunk_type": "FORM_FIELD",
  "field_name": "bank_account_no",
  "label": "银行卡号",
  "data_source": "employee_bank_account",
  "sensitivity_level": "L4",
  "llm_visible": false,
  "required_permission": "EMPLOYEE_BANK_READ",
  "validation_rule": "银行卡号格式校验，原值不得进入 RAG 或 LLM"
}
```

---

## 11. Metrics and Data Dictionary

### 11.1 一指标一 chunk

每个指标独立切分，避免多个公式和口径互相污染。

### 11.2 指标示例

| 指标 | 说明 |
|------|------|
| active employee count | 当前在职员工数 |
| turnover rate | 离职率 |
| attendance anomaly count | 考勤异常数量 |
| late count | 迟到次数 |
| missing punch count | 漏打卡次数 |
| payroll total | 薪资总额，实际值必须通过 Tool 查询 |
| gross/net salary definition | 应发/实发工资定义 |
| recruitment conversion rate | 招聘转化率 |
| average time to hire | 平均招聘周期 |

### 11.3 Metric chunk 格式

```json
{
  "chunk_type": "METRIC_DEFINITION",
  "metric_name": "average_time_to_hire",
  "business_definition": "从候选人进入流程到接受 Offer 的平均天数。",
  "formula": "sum(offer_accepted_at - candidate_received_at) / accepted_offer_count",
  "source_tables_or_tools": ["RecruitmentCase", "query_candidate_pipeline"],
  "time_window": "按自然月或指定日期范围",
  "exclusions": ["撤回候选人", "未进入面试流程的候选人"],
  "examples": ["6 月平均招聘周期 18 天"],
  "related_case_types": ["RecruitmentCase"],
  "owner": "HR Operations",
  "version": "v1.0"
}
```

---

## 12. Metadata Schema

### 12.1 Document metadata

```json
{
  "document_id": "uuid",
  "tenant_id": "uuid",
  "company_id": "uuid",
  "title": "考勤管理制度",
  "document_type": "HR_POLICY",
  "business_domain": "attendance",
  "version": "v3.0",
  "status": "ACTIVE",
  "effective_from": "2026-01-01",
  "effective_to": null,
  "owner": "HR Operations",
  "approved_by": "HR Director",
  "source_file_id": "uuid",
  "sensitivity_level": "L1",
  "allowed_roles": ["HR_MANAGER", "EMPLOYEE"],
  "related_case_types": ["AttendanceAnomalyCase"],
  "related_tools": ["query_attendance_records"],
  "tags": ["attendance", "late", "appeal"]
}
```

### 12.2 Chunk metadata

```json
{
  "chunk_id": "uuid",
  "document_id": "uuid",
  "parent_chunk_id": "uuid",
  "chunk_type": "TEXT_POLICY",
  "heading_path": ["考勤管理制度", "迟到与早退"],
  "title": "迟到认定规则",
  "content_text": "脱敏后的原文片段",
  "vector_text": "用于 embedding 的脱敏检索文本",
  "structured_payload": {},
  "page_start": 12,
  "page_end": 12,
  "bbox": null,
  "sensitivity_level": "L1",
  "allowed_roles": ["HR_MANAGER", "EMPLOYEE"],
  "case_types": ["AttendanceAnomalyCase"],
  "tool_refs": ["detect_attendance_anomalies"],
  "status": "ACTIVE",
  "effective_from": "2026-01-01",
  "effective_to": null,
  "checksum": "sha256"
}
```

### 12.3 Asset metadata

```json
{
  "asset_id": "uuid",
  "document_id": "uuid",
  "chunk_id": "uuid",
  "asset_type": "SCREENSHOT",
  "file_id": "uuid",
  "page_number": 8,
  "bbox": [0, 0, 1280, 720],
  "caption": "员工列表右上角的新建按钮",
  "ocr_text": "已脱敏 OCR 文本",
  "extracted_elements": [],
  "sensitivity_level": "L1"
}
```

---

## 13. Proposed Data Model

> 以下数据模型均为 **[提议]**，不在本文档中创建迁移文件。

### 13.1 表概览

| 表 | 用途 | 关键索引 | 租户隔离 | RLS | 敏感处理 | 留存 |
|----|------|----------|----------|-----|----------|------|
| `knowledge_document` | 知识文档注册 | `(tenant_id, company_id, status, document_type)`, `(source_file_id)` | `tenant_id` 必填，`company_id` 按范围可选 | 必须 | 仅元数据，原件在 file_object | 随版本长期 |
| `knowledge_chunk` | 可检索 chunk | `(tenant_id, document_id)`, `(tenant_id, chunk_type, status)`, GIN tags | 继承 document 的 `tenant_id/company_id` | 必须 | `content_text` 和 `vector_text` 必须脱敏 | 随文档版本 |
| `knowledge_asset` | 图片、表格、流程图资产元数据 | `(tenant_id, document_id)`, `(chunk_id)` | 继承 document/chunk 范围 | 必须 | 原图受 file 权限控制，OCR 脱敏 | 随文档版本 |
| `knowledge_embedding` | chunk embedding | `(tenant_id, chunk_id)`, HNSW/IVF vector index | 向量检索必须带 `tenant_id` 过滤 | 必须 | 只嵌入 `vector_text` | 随 chunk 级联 |
| `knowledge_ingestion_job` | 入库任务 | `(tenant_id, status, created_at)` | 入库任务绑定上传者租户 | 必须 | input/output summary 脱敏 | 180 天 |
| `knowledge_ingestion_error` | 入库错误 | `(job_id)`, `(tenant_id, error_code)` | 与 job 同租户 | 必须 | 错误摘要不含 L4 | 180 天 |
| `knowledge_access_log` | 检索审计 | `(tenant_id, created_at)`, `(tenant_id, denied)` | 每次访问记录请求租户 | 必须 | query summary 脱敏 | 长期 |

### 13.2 字段草案

```sql
-- [提议] 仅作为设计说明，不创建迁移文件
knowledge_document(
  id, tenant_id, company_id, title, document_type, business_domain,
  version, status, effective_from, effective_to, owner, approved_by,
  source_file_id, sensitivity_level, allowed_roles, related_case_types,
  related_tools, tags, checksum, created_at, updated_at
)

knowledge_chunk(
  id, tenant_id, company_id, document_id, parent_chunk_id, chunk_type,
  heading_path, title, content_text, vector_text, structured_payload,
  page_start, page_end, bbox, sensitivity_level, allowed_roles,
  case_types, tool_refs, status, effective_from, effective_to,
  checksum, created_at, updated_at
)

knowledge_asset(
  id, tenant_id, company_id, document_id, chunk_id, asset_type,
  file_id, page_number, bbox, caption, ocr_text, extracted_elements,
  sensitivity_level, created_at
)

knowledge_embedding(
  id, tenant_id, chunk_id, embedding, model_version, vector_text_hash,
  created_at
)

knowledge_ingestion_job(
  id, tenant_id, company_id, source_file_id, status, document_type,
  requested_by, parser_version, error_count, created_at, updated_at,
  completed_at
)

knowledge_ingestion_error(
  id, tenant_id, job_id, document_id, chunk_id, error_code,
  error_summary, severity, created_at
)

knowledge_access_log(
  id, tenant_id, user_id, agent_type, operation, query_summary,
  filters_summary, matched_count, returned_count, denied, deny_reason,
  created_at
)
```

### 13.3 隔离与性能原则

- 所有表必须带 `tenant_id`，公司级知识带 `company_id`。
- 所有检索必须先 metadata filter，再向量/关键词召回，避免跨租户全量扫描。
- 向量检索 top-K 应有限制，默认 `topK <= 20`，rerank 输入默认 `<= 50`。
- `vector_text` 不得包含 L4 原文，否则 ingestion job fail-closed。

---

## 14. Ingestion Pipeline

### 14.1 主流程

```
Upload document
  -> document registration
  -> file type validation
  -> virus scan / malware scan
  -> layout parsing
  -> text/table/image extraction
  -> sensitive data detection
  -> semantic chunking
  -> table structuring
  -> image caption/OCR/UI element extraction
  -> flowchart structuring if applicable
  -> parent-child chunk generation
  -> vector_text generation
  -> embedding generation
  -> metadata enrichment
  -> human sampling review
  -> publish as ACTIVE
```

### 14.2 状态机

| 状态 | 含义 | 下一步 |
|------|------|--------|
| `UPLOADED` | 文件已上传 | 注册文档 |
| `VALIDATING` | 文件类型、大小、病毒扫描 | 解析 |
| `PARSING` | 版面、文本、表格、图片解析 | 敏感检测 |
| `SENSITIVE_DATA_DETECTED` | 检测到 L3/L4 | 脱敏、拒绝或人工审核 |
| `CHUNKING` | 语义切分 | chunk 校验 |
| `CHUNK_VALIDATION_FAILED` | chunk 缺元数据或越界 | 修复/失败 |
| `EMBEDDING` | 生成 embedding | 待审核 |
| `EMBEDDING_FAILED` | 嵌入失败 | 重试或关键词降级 |
| `HUMAN_REVIEW_REQUIRED` | 需要人工抽样审核 | 发布或退回 |
| `PUBLISHED` | ACTIVE 发布 | 可检索 |
| `SUPERSEDED` | 被新版本替代 | 当前查询默认不可见 |
| `PARSE_FAILED` | 解析失败 | 记录错误并结束 |

### 14.3 质量门禁

- 每个 chunk 必须有 `document_id`, `chunk_type`, `heading_path`, `status`, `sensitivity_level`, `checksum`。
- 每个可发送 LLM 的 chunk 必须有 citation 信息。
- `TABLE_ROW_GROUP` 必须保留表头。
- `FLOWCHART` 必须至少有节点和边。
- `TUTORIAL_STEP` 必须有动作和预期结果。
- `RULE_TABLE` 必须有 deterministic rule JSON 或明确标记为 explain-only。

---

## 15. Retrieval Pipeline

### 15.1 主流程

```
User/Agent query
  -> intent/domain classification
  -> metadata filters
  -> tenant/company/RBAC filters
  -> effective date/version filters
  -> chunk_type filters
  -> hybrid retrieval: keyword/BM25 + vector
  -> rerank
  -> source verification
  -> Data Guard final check
  -> Context Pack assembly
  -> answer with source citations/assets
```

### 15.2 何时检索什么

| 查询意图 | 检索对象 |
----------|----------|
| 政策解释 | `TEXT_POLICY`, `LEGAL_CLAUSE`, `FAQ` |
| SOP 操作 | `TEXT_SOP`, `TUTORIAL_STEP`, `IMAGE_ASSET` |
| 表格规则 | `TABLE_FULL`, `TABLE_ROW_GROUP`, `RULE_TABLE` |
| 流程说明 | `FLOWCHART`, `STATE_MACHINE_MANUAL`, `HOOK_MANUAL` |
| 组织结构说明 | `ORG_CHART`，真实员工关系走 Tool |
| 表单填写 | `FORM_TEMPLATE`, `FORM_FIELD` |
| 指标口径 | `METRIC_DEFINITION` |
| 工具能力 | `TOOL_MANUAL` |
| 相似经验 | `CASE_EXAMPLE`，必须去标识化 |

### 15.3 检索安全顺序

1. 先按 `tenant_id/company_id/status/effective_date/allowed_roles` 过滤。
2. 再做 BM25 + vector 召回。
3. rerank 只处理已授权候选。
4. Data Guard 最终校验 `sensitivity_level`、资产权限和旧版本可见性。
5. Context Pack 只放 `content_text` 摘要、citation、必要资产引用，不放受限原件。

### 15.4 复杂度与资源边界

检索默认不做全库扫描。metadata filter 将候选空间降到授权集合，BM25/向量索引负责近似召回，rerank 只处理 bounded top-K。空间上避免把整篇文档 materialize 到上下文，只返回少量 chunk、引用和资产指针。

---

## 16. Security and Privacy

### 16.1 风险清单

| 风险 | 防护 |
------|------|
| L3/L4 检测遗漏 | 正则 + 字段词典 + OCR 检测 + 人工抽样 |
| 字段级泄露 | `content_text`、`vector_text`、OCR 文本分别脱敏 |
| 截图泄露 | 自动打码或拒绝入库 |
| 表格单元格泄露 | cell-level redaction，敏感列不嵌入 |
| 文档 prompt injection | 标记 `source_trust=UNTRUSTED`，永不提升为 system 指令 |
| 恶意文件上传 | 文件类型白名单、病毒扫描、沙箱解析 |
| 跨租户检索 | RLS + metadata filter + Data Guard |
| 旧版本政策泄露 | 默认仅 ACTIVE + effective date 命中 |
| 草稿政策泄露 | DRAFT 仅允许管理员/审核者 |
| LLM 上下文暴露过多 | top-K 和 token budget 限制 |
| 资产访问绕过 | 文件下载和预览均写 `knowledge_access_log` |

### 16.2 硬规则

- L4 raw data must not be embedded.
- L4 raw data must not enter `vector_text`.
- L4 raw data must not enter LLM Safe Context Pack.
- Business facts must be queried through Tool, not copied into KB.
- Every KB retrieval must be auditable.

### 16.3 不可信内容处理

外部上传文档、邮件、简历、合同、图片 OCR 文本都按不可信内容处理。它们可作为 evidence 或 knowledge content，但不得变成 Agent 指令。

```json
{
  "source_trust": "UNTRUSTED",
  "risk_flags": ["prompt_injection_candidate"],
  "llm_instruction_allowed": false
}
```

---

## 17. Integration With Existing Memory and Context Compression Design

### 17.1 与 L5 Semantic / RAG Memory 的关系

企业知识库是 L5 Semantic / RAG Memory 的主要来源之一。`knowledge_document`、`knowledge_chunk`、`knowledge_asset` 和 `knowledge_embedding` 负责更细粒度的摄取、chunking、引用和资产管理；既有 `agent_memory_embedding` 可继续用于 Agent 记忆向量，二者在运行时通过 RAG Retriever 统一抽象。

### 17.2 与 Safe Context Pack 的关系

Safe Context Pack 中的 `rag_citations` 来源于 `knowledge_chunk`：

```json
{
  "document_title": "考勤管理制度 v3",
  "heading_path": ["迟到与早退", "迟到认定"],
  "page": 12,
  "chunk_id": "uuid",
  "asset_refs": ["asset_uuid"]
}
```

Context Pack 不放完整原件，不放未脱敏图片，不放业务事实副本。

### 17.3 与 Context Compression Pipeline 的关系

知识库检索结果进入压缩管线时：

- 保留 citation 和 `heading_path`。
- 长文本只保留命中片段和摘要。
- 表格只保留相关行组和表头。
- 图片只保留 caption、脱敏 OCR 和资产引用。
- `assert_no_l4` 必须在进入 LLM 前通过。

### 17.4 与 MemoryGuard / Data Guard 的关系

MemoryGuard 负责写入与检索时的安全判断；Data Guard 负责用户、租户、公司、角色、字段和资产权限过滤。KB 检索不得绕过 Data Guard。

### 17.5 不应进入长期 Agent Memory 的内容

- full resumes
- salary details
- identity numbers
- bank cards
- actual payroll records
- raw attendance logs
- raw CCTV/monitoring data
- complete employee contracts

这些内容只允许留在业务系统或受控文件存储中，通过 Tool 和权限检查访问。

---

## 18. Integration With Multi-Agent Cases

| Case | 示例 KB 文档 | 检索用例 |
|------|--------------|----------|
| RecruitmentCase | JD、筛选标准、面试评分表、招聘工具手册 | 解释匹配标准、生成面试问题建议 |
| AttendanceAnomalyCase | 考勤制度、迟到规则、补卡 FAQ、申诉流程图 | 解释异常原因、指导员工申诉 |
| PayrollCase | 薪资政策、福利规则、薪资审批流程、指标口径 | 解释薪资预检流程和规则来源 |
| ContractCase | 合同模板、续签规则、到期 SOP、合同字段说明 | 解释续签流程和模板字段 |
| OnboardingCase | 入职 SOP、入职材料表、系统教程截图 | 指导 HR 创建档案和收集材料 |
| OffboardingCase | 离职交接 SOP、资产归还表、权限回收流程 | 生成离职待办说明 |
| EmployeeChangeCase | 调岗流程、晋升制度、调薪申请表 | 解释异动步骤和审批路径 |
| LeaveOvertimeCase | 请假/加班制度、审批矩阵、假种表 | 解释假期规则和审批要求 |
| DocumentRequestCase | 收入证明模板、在职证明模板、字段定义 | 指导生成文档，不暴露 L4 字段 |
| PolicyVersionCase | 政策上传规范、版本发布 SOP、知识库审核手册 | 支持政策解析、发布和 supersede |

---

## 19. Frontend UX

### 19.1 页面与组件

| 页面/组件 | 用途 |
|-----------|------|
| `KnowledgeBaseAdminPage` | 知识库管理入口 |
| `KnowledgeDocumentList` | 文档列表、版本、状态、标签筛选 |
| `KnowledgeDocumentDetail` | 文档元数据、chunk 概览、发布状态 |
| `KnowledgeChunkPreview` | 查看 chunk、heading_path、citation、payload |
| `KnowledgeAssetViewer` | 查看脱敏截图、表格、流程图资产 |
| `KnowledgeIngestionJobViewer` | 查看入库任务状态和错误 |
| `KnowledgeVersionDiff` | 对比政策版本差异 |
| `KnowledgeAccessLogViewer` | 查看检索和资产访问审计 |
| `RAGCitationPreview` | 展示回答中的来源引用 |
| `TutorialStepViewer` | 展示教程步骤、截图、按钮定位 |

### 19.2 表格展示

HR/admin 用户查看表格 chunk 时，应显示：

- 表标题、来源文档、版本、生效日期。
- 表头和行组，不隐藏分组键。
- 是否存在 deterministic Rule JSON。
- 如果表格含受限列，显示脱敏标记和权限提示。

### 19.3 截图和教程展示

截图展示应默认显示 redacted asset。教程步骤显示动作、预期结果、前置条件、警告和来源页码。原始截图只有具备权限的用户可预览，并写访问审计。

---

## 20. Python Prototype Design

### 20.1 包结构

```text
agent-prototype-python/kb/
  document_loader.py
  layout_parser.py
  chunker.py
  table_parser.py
  image_processor.py
  metadata_extractor.py
  redactor.py
  embedding_indexer.py
  retriever.py
  schemas.py
```

### 20.2 接口草案

```python
class KnowledgeDocument:
    id: str
    tenant_id: str
    company_id: str | None
    title: str
    document_type: str
    version: str
    status: str
    source_file_id: str


class KnowledgeChunk:
    id: str
    document_id: str
    parent_chunk_id: str | None
    chunk_type: str
    heading_path: list[str]
    content_text: str
    vector_text: str
    structured_payload: dict
    sensitivity_level: str


class KnowledgeAsset:
    id: str
    document_id: str
    chunk_id: str
    asset_type: str
    file_id: str
    caption: str
    ocr_text: str


class Chunker:
    def chunk(self, document: KnowledgeDocument, parsed_layout: dict) -> list[KnowledgeChunk]: ...


class TableChunker:
    def chunk_table(self, table: dict, context: dict) -> list[KnowledgeChunk]: ...
    def to_rule_json(self, table: dict) -> dict | None: ...


class TutorialImageProcessor:
    def process(self, file_id: str, page_context: dict) -> KnowledgeAsset: ...
    def redact_or_reject(self, asset: KnowledgeAsset) -> KnowledgeAsset: ...


class KnowledgeRetriever:
    def retrieve(self, query: str, principal: dict, filters: dict) -> list[KnowledgeChunk]: ...


class KnowledgeGuard:
    def check_ingestion(self, chunk: KnowledgeChunk) -> None: ...
    def filter_retrieval(self, chunks: list[KnowledgeChunk], principal: dict) -> list[KnowledgeChunk]: ...
    def assert_no_l4(self, value: object) -> None: ...
```

---

## 21. Future TypeScript / Node.js Runtime Design

### 21.1 TypeScript interfaces

```typescript
interface KnowledgeDocument {
  id: string
  tenantId: string
  companyId?: string
  title: string
  documentType: string
  businessDomain: string
  version: string
  status: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED'
  sourceFileId: string
}

interface KnowledgeChunk {
  id: string
  documentId: string
  parentChunkId?: string
  chunkType: string
  headingPath: string[]
  title: string
  contentText: string
  vectorText: string
  structuredPayload: Record<string, unknown>
  sensitivityLevel: 'L0' | 'L1' | 'L2'
}

interface KnowledgeAsset {
  id: string
  documentId: string
  chunkId: string
  assetType: string
  fileId: string
  caption?: string
  ocrText?: string
}

interface IngestionJob {
  id: string
  tenantId: string
  sourceFileId: string
  status: string
  errorCount: number
}

interface ChunkingStrategy {
  supports(documentType: string): boolean
  chunk(input: unknown): Promise<KnowledgeChunk[]>
}

interface KnowledgeRetriever {
  retrieve(query: string, ctx: RetrievalContext): Promise<RAGCitation[]>
}

interface KnowledgeGuard {
  checkChunk(chunk: KnowledgeChunk): void
  filterCitations(citations: RAGCitation[], principal: Principal): RAGCitation[]
}

interface RAGCitation {
  chunkId: string
  documentTitle: string
  headingPath: string[]
  pageStart?: number
  pageEnd?: number
  quoteSummary: string
  assetRefs: string[]
}
```

### 21.2 Node.js / TS 职责

Node.js/TS runtime 负责异步入库任务、事件驱动处理、队列 worker、SSE/WebSocket 进度更新、Vue3 集成和 Tool 编排。

Python Tool Service 可继续负责 OCR、文档解析、表格抽取、图片 caption、embedding 生成等能力。

---

## 22. Acceptance Criteria

| # | 验收项 | 通过标准 |
|---|--------|----------|
| KB-AC1 | policy document split into answerable chunks | 每个政策条款可独立回答并含 citation |
| KB-AC2 | table headers preserved in row chunks | `TABLE_ROW_GROUP` 均保留表头和适用范围 |
| KB-AC3 | screenshot tutorial linked to TUTORIAL_STEP chunk | 每张教程截图可追溯到 step chunk |
| KB-AC4 | L4 data redacted before vector_text and embedding | `vector_text` 和 embedding 输入中无 L4 |
| KB-AC5 | old/superseded policy not retrieved for current query | 默认检索不返回 SUPERSEDED |
| KB-AC6 | company A policy not retrieved for company B | 跨公司命中数为 0 |
| KB-AC7 | draft policy not visible to normal HR user | 普通 HR 检索不到 DRAFT |
| KB-AC8 | payroll rule table has deterministic rule JSON | 影响薪资的规则表必须有 Rule JSON |
| KB-AC9 | actual employee salary table rejected from KB ingestion | 真实薪资明细表进入拒绝或人工审核 |
| KB-AC10 | flowchart represented as nodes and edges | `FLOWCHART` 至少含 nodes 和 edges |
| KB-AC11 | citations include document title, heading path, page, and chunk id | 回答来源字段完整 |
| KB-AC12 | every KB retrieval writes access log | 每次检索有 `knowledge_access_log` |
| KB-AC13 | prompt injection inside document is marked UNTRUSTED | 不可信文本永不提升为指令 |

---

## 23. Implementation Roadmap

| Phase | 目标 | 主要交付 |
|-------|------|----------|
| KB-0 | documentation alignment | 本文档 + 既有文档交叉引用 |
| KB-1 | metadata schema and chunk taxonomy | 元数据 schema、chunk_type 枚举、校验规则 |
| KB-2 | Python chunking prototype for text/SOP/FAQ | 文本解析、语义 chunk、FAQ 抽取 |
| KB-3 | table handling and rule table representation | 表格结构、行组、Rule JSON |
| KB-4 | screenshot/tutorial image processing | OCR、caption、UI element、脱敏截图 |
| KB-5 | retrieval prototype with metadata filtering | hybrid retrieval、rerank、citation |
| KB-6 | integration with Safe Context Pack | RAG citation 注入、安全压缩 |
| KB-7 | Vue3 admin UI design | 知识库管理、入库任务、资产预览 |
| KB-8 | security and red-team tests | Prompt injection、跨租户、L4 泄露测试 |

---

## 24. Update Existing Docs

本文档创建后，应在既有文档中只增加短引用，不复制本文全文：

- `docs/agent/v1/memory-and-context-compression-design.md`：在 L5 Semantic / RAG Memory 下引用本文，说明企业知识库摄取、chunking、表格/图片处理和 citation 规则由本文定义。
- `docs/agent/v1/multi-agent-architecture.md`：在 RAG / 政策检索工具下引用本文，说明政策检索背后的知识库入库和检索设计。
- `docs/agent/v1/architecture-gap-addendum.md`：在 Python Tool Service 或 RAG/运行时边界处引用本文，说明 OCR、文档解析、表格抽取、向量嵌入可由 Python Tool Service 承担。
- `docs/agent/v1/agent-production-readiness-gap-analysis.md`：作为生产就绪差距、优先级、风险和上线前验收地图，引用本文的企业知识库设计作为已覆盖能力。

---

## 附录：关键不变式

```text
∀ chunk.vector_text: no_L4_raw_data
∀ embedding.input: source == chunk.vector_text && no_L4_raw_data
∀ retrieval: tenant/company/RBAC/effective_date/status filters applied before rerank
∀ citation: document_title && heading_path && chunk_id present
∀ asset access: audited
∀ business facts: fetched_by_tool, not_copied_to_kb
```
