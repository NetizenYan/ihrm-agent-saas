# Phase 1-A 启动前置阻塞项修复报告

> 结论状态：已在 `phase1-wsl2-startup` 分支执行文件级修复，未实际启动 WSL2 服务。  
> monorepo 根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas`。  
> 约束执行情况：未写 Agent、未做 Vue3、未重构业务代码、未升级依赖、未删除原始文件、未自动格式化 Java/Vue/SQL、未输出密码/Token/Secret/AccessKey 原文。

## 1. 修复摘要

| 项目 | 结果 | 证据路径 | 备注 |
|---|---|---|---|
| act.sql 是否已补齐 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\act-activiti.sql` | 从原始课程资料复制，未手写生成。 |
| Gateway Redis host 是否已处理 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_gate\src\main\resources\application-dev.yml` | 不改原始 `application.yml`，通过 dev profile 覆盖为本地 Redis。 |
| .iml 是否已从 Git 索引移除 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\.gitignore` | 12 个 `.iml` 从 Git 索引移除；本地文件保留。 |
| 是否仍有阻塞项 | 否 | 本报告；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-wsl2-startup-plan.md` | 可以进入 Phase 1-B：实际 WSL2 启动验证。 |

初始 Git 状态记录：

| 命令 | 结果 | 证据路径 |
|---|---|---|
| `git status` | 当前分支为 `phase1-wsl2-startup`；发现一个未跟踪 Claude 交叉审计文档 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas` |
| `git branch --show-current` | `phase1-wsl2-startup` | 同上 |
| `git tag` | `baseline-day17` | 同上 |
| `git log --oneline --decorate -5` | `9e01172 (HEAD -> phase1-wsl2-startup, tag: baseline-day17, master) baseline: organize day17 SaaS HRM backend frontend database and docs` | 同上 |

## 2. act.sql 恢复记录

| 项目 | 结果 | 证据路径 | 备注 |
|---|---|---|---|
| act SQL 是否找到 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\顺序排放\IHRM项目\day16-考勤薪资管理&工作流概述\day16\03-资料\act.sql` | 搜索范围包含当前项目目录、archive、原始整理目录、历史 day16/day17 资料。仅找到一个候选。 |
| 是否复制到 database/mysql/act-activiti.sql | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\act-activiti.sql` | 复制原始脚本，不修改脚本正文。 |
| act 表数量 | 25 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\act-activiti.sql` | 按 `CREATE TABLE` 静态统计。 |
| 是否包含 ACT_RE/ACT_RU/ACT_HI/ACT_GE 表 | 是 | 同上 | 静态扫描命中 `act_re_deployment`、`act_ru_task`、`act_hi_procinst`、`act_ge_property` 等表。 |

候选列表：

| 候选脚本 | 大小 | 结论 |
|---|---:|---|
| `D:\Files\BaiDu\SaaS项目测试demo\顺序排放\IHRM项目\day16-考勤薪资管理&工作流概述\day16\03-资料\act.sql` | 31712 bytes | 选择该脚本；包含 Activiti 工作流表，且与 `ihrm_audit` 配置需要的 `act` 库一致。 |

适配性说明：

| 检查项 | 结论 | 证据路径 |
|---|---|---|
| Audit 服务依赖 Activiti | 是，`activiti-spring-boot-starter` 版本为 `7.0.0.Beta3` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_audit\pom.xml` |
| Audit 服务连接 `act` 工作流库 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_audit\src\main\resources\application.yml` |
| act SQL 是否完全等同 Activiti 7 运行期要求 | 证据不足 | 未实际启动 Audit 服务、未执行数据库迁移校验。 |

## 3. Redis 本地配置记录

Redis 配置位置：

| 模块 | 配置文件 | 原问题 | 修复方式 | 启动参数 |
|---|---|---|---|---|
| Gateway | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_gate\src\main\resources\application.yml` | Redis host 为 `127.0.0.2`，WSL2 本地默认 Redis 通常为 `127.0.0.1` | 新增 `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_gate\src\main\resources\application-dev.yml`，仅覆盖 `spring.redis.host` 和 `spring.redis.port` | `--spring.profiles.active=dev` |
| Attendance | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_attendance\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |
| Audit | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_audit\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |
| Company | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_company\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |
| Employee | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_employee\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |
| Salary | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_salarys\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |
| Social Security | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_social_securitys\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |
| System | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_system\src\main\resources\application.yml` | 未发现该阻塞项 | 保持原样 | 不需要 dev profile 覆盖 |

Java 侧读取 Redis host 的位置：

| 模块 | 证据路径 |
|---|---|
| Attendance | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_attendance\src\main\java\com\ihrm\atte\ShiroConfiguration.java` |
| Audit | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_audit\src\main\java\com\ihrm\audit\ShiroConfiguration.java` |
| Company | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_company\src\main\java\com\ihrm\company\ShiroConfiguration.java` |
| Employee | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_employee\src\main\java\com\ihrm\employee\ShiroConfiguration.java` |
| Gateway | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_gate\src\main\java\com\ihrm\gate\ShiroConfiguration.java` |
| Salary | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_salarys\src\main\java\com\ihrm\salarys\ShiroConfiguration.java` |
| Social Security | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_social_securitys\src\main\java\com\ihrm\social\ShiroConfiguration.java` |
| System | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_system\src\main\java\com\ihrm\system\ShiroConfiguration.java` |

是否影响原始 baseline：不影响 `baseline-day17` tag，不修改 `master` 历史；本次只在 `phase1-wsl2-startup` 分支新增 Gateway dev profile，并更新 Phase 1 启动计划。证据路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-wsl2-startup-plan.md`。

敏感配置处理：扫描过程中发现疑似敏感配置，仅记录文件路径，不展示具体值。相关路径包括：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_attendance\src\main\resources\application.yml`、`ihrm_audit\src\main\resources\application.yml`、`ihrm_company\src\main\resources\application.yml`、`ihrm_employee\src\main\resources\application.yml`、`ihrm_salarys\src\main\resources\application.yml`、`ihrm_social_securitys\src\main\resources\application.yml`、`ihrm_system\src\main\resources\application.yml`。

## 4. Git 清理记录

| 项目 | 结果 | 证据路径 |
|---|---|---|
| `.gitignore` 是否加入 `*.iml` | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\.gitignore` |
| 移除的 `.iml` 文件数量 | 12 | Git 索引；本地路径仍在 `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy` |
| 本地 `.iml` 是否仍保留 | 是，仍有 12 个 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\*.iml` |
| 是否仍有 `node_modules` 被跟踪 | 否，数量 0 | Git 索引 |
| 是否仍有 `target` 被跟踪 | 否，数量 0 | Git 索引 |
| 是否仍有 `.env` 被跟踪 | 否，数量 0 | Git 索引 |
| 是否仍有日志文件被跟踪 | 否，数量 0 | Git 索引 |

## 5. 是否可以进入 Phase 1-B

判断：可以进入 Phase 1-B：实际 WSL2 启动验证。

进入 Phase 1-B 前置条件核对：

| 条件 | 状态 | 证据路径 |
|---|---|---|
| `database/mysql/act-activiti.sql` 已补齐 | 通过 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\act-activiti.sql` |
| Gateway Redis dev profile 已补齐 | 通过 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_gate\src\main\resources\application-dev.yml` |
| Gateway 启动参数已写入计划 | 通过 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-wsl2-startup-plan.md` |
| `.iml` 从 Git 索引移除 | 通过 | Git 索引；`.gitignore` |
| 启动前阻塞项 | 暂未发现 | 本报告 |

仍需在 Phase 1-B 实际验证的事项：

| 事项 | 说明 | 证据路径 |
|---|---|---|
| Maven 构建 | 尚未实际执行 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\pom.xml` |
| MySQL 导入 | 尚未实际执行 | `database\ihrm-day17-final.sql`；`database\mysql\act-activiti.sql` |
| Redis 连接 | 尚未实际执行 | `backend-legacy\ihrm_gate\src\main\resources\application-dev.yml` |
| Audit 服务启动 | 尚未实际执行 | `backend-legacy\ihrm_audit\pom.xml`；`backend-legacy\ihrm_audit\src\main\resources\application.yml` |
