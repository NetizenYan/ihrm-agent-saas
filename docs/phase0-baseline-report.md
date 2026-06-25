# Phase 0 Baseline 整理报告

> 结论状态：基于本地文件系统静态检查与复制结果。未修改 Java/Vue/SQL 业务代码，未删除原始文件，未自动格式化业务文件。  
> monorepo 根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas`。  
> 原始整理目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果`。

## 1. 完整性检查结果

| 类型 | 是否存在 | 关键证据路径 | 备注 |
| -- | ---- | ------ | -- |
| 服务端代码 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版` | 已复制到 `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy`。 |
| 客户端代码 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\config`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\build` | `package.json` 中存在 Vue、vue-router、vuex、axios、element-ui、webpack。 |
| 数据库脚本 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql` | 已复制为 `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\ihrm-day17-final.sql`。 |
| Codex 报告 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\项目架构与数据库梳理报告.md` | 已复制为 `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\codex_architecture_report.md`。 |
| Claude 报告 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\docs\claude_architecture_agent_refactor_audit_report.md` | 已复制到 monorepo `docs`。 |
| docs.zip | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\docs.zip` | 文件约 42 KB，已复制到 `archive\docs.zip`；体积较小，保留进入 Git baseline。 |
| docs 目录 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\docs` | Markdown 报告已复制到 monorepo `docs`。 |

完整性结论：客户端、服务端、数据库脚本均存在，允许继续建立 baseline。不存在需要生成 `docs/frontend-missing-or-recovery-report.md` 的客户端缺失情况。

## 2. 标准目录整理结果

```text
ihrm-agent-saas/
  backend-legacy/
  frontend-legacy-vue2/
  database/
    ihrm-day17-final.sql
  docs/
    codex_architecture_report.md
    claude_architecture_agent_refactor_audit_report.md
    wsl2-local-startup-verification.md
    api-inventory-for-agent.md
    rbac-auth-flow.md
    database-field-and-tenant-audit.md
    vue3-migration-plan.md
    agent-integration-design.md
    phase0-baseline-report.md
    phase1-wsl2-startup-plan.md
  archive/
    docs.zip
  scripts/
  docker/
```

证据路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas`。

## 3. 服务端基线确认

| 项 | 结论 | 证据路径 |
| --- | --- | --- |
| 后端根目录 | `backend-legacy` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy` |
| 根 POM | 存在 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\pom.xml` |
| Maven 模块 | `ihrm_attendance`、`ihrm_audit`、`ihrm_common`、`ihrm_common_model`、`ihrm_company`、`ihrm_employee`、`ihrm_eureka`、`ihrm_gate`、`ihrm_salarys`、`ihrm_social_securitys`、`ihrm_system` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy` |
| Java 版本 | Java 8 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\pom.xml` |
| Spring Boot | 2.0.5.RELEASE | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\pom.xml` |
| Spring Cloud | Finchley.SR1 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\pom.xml` |

启动类初步位置：

| 服务 | 启动类路径 |
| --- | --- |
| Eureka | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_eureka\src\main\java\com\ihrm\eureka\EurekaServer.java` |
| Gateway | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_gate\src\main\java\com\ihrm\gate\GateApplication.java` |
| Company | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_company\src\main\java\com\ihrm\company\CompanyApplication.java` |
| System | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_system\src\main\java\com\ihrm\system\SystemApplication.java` |
| Employee | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_employee\src\main\java\com\ihrm\employee\EmployeeApplication.java` |
| Attendance | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_attendance\src\main\java\com\ihrm\atte\AttandanceApplication.java` |
| Social Security | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_social_securitys\src\main\java\com\ihrm\social\SocialSecuritysApplication.java` |
| Salary | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_salarys\src\main\java\com\ihrm\salarys\SalarysApplication.java` |
| Audit | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_audit\src\main\java\com\ihrm\audit\AuditApplication.java` |

配置文件初步位置：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_*\src\main\resources\application.yml`。

## 4. 客户端基线确认

| 项 | 结论 | 证据路径 |
| --- | --- | --- |
| 前端根目录 | `frontend-legacy-vue2` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2` |
| package.json | 存在 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2\package.json` |
| Vue | `^2.5.2` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2\package.json` |
| Element UI | `^2.2.2` | 同上 |
| Webpack | `^3.6.0` | 同上 |
| vue-router | `^3.0.1` | 同上 |
| vuex | `^3.0.1` | 同上 |
| axios | `^0.18.0` | 同上 |
| src 路径 | 存在 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2\src` |
| config/build 路径 | 均存在 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2\config`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2\build` |

说明：`.gitignore` 按要求包含 `build/`，但前端 `frontend-legacy-vue2\build` 是 Webpack 源配置目录，不是构建产物，因此增加了 `!frontend-legacy-vue2/build/**` 例外。证据路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\.gitignore`。

## 5. 数据库基线确认

| 项 | 结论 | 证据路径 |
| --- | --- | --- |
| ihrm SQL | 存在 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\ihrm-day17-final.sql` |
| act SQL | 在原始课程目录中找到，Phase 0 未复制到 `database`，仅记录证据路径 | `D:\Files\BaiDu\SaaS项目测试demo\顺序排放\IHRM项目\day16-考勤薪资管理&工作流概述\day16\03-资料\act.sql` |
| ihrm SQL 是否包含建库语句 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\ihrm-day17-final.sql` |
| act SQL 是否包含建库语句 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\顺序排放\IHRM项目\day16-考勤薪资管理&工作流概述\day16\03-资料\act.sql` |
| 是否发现疑似敏感配置 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\backend-legacy\ihrm_attendance\src\main\resources\application.yml`；`ihrm_audit\src\main\resources\application.yml`；`ihrm_company\src\main\resources\application.yml`；`ihrm_employee\src\main\resources\application.yml`；`ihrm_salarys\src\main\resources\application.yml`；`ihrm_social_securitys\src\main\resources\application.yml`；`ihrm_system\src\main\resources\application.yml`；`ihrm_common\src\main\java\com\ihrm\common\utils\QiniuUploadUtil.java` |

敏感信息处理：仅记录“发现疑似敏感配置”和文件路径，未输出具体值。

## 6. 风险

| 风险 | 说明 | 证据路径 |
| --- | --- | --- |
| 中文路径风险 | 当前根路径包含中文，老 Java/Node 工具链在 WSL2 `/mnt/d` 下可能出现路径或编码问题。 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas` |
| Windows/WSL2 路径风险 | WSL2 访问 `/mnt/d` 有性能和权限差异，后续构建建议验证或复制到 Linux home 目录测试。 | 同上 |
| 老 Java 依赖风险 | 后端为 Java 8、Spring Boot 2.0.5、Spring Cloud Finchley.SR1、Lombok 1.16.x，Java 17 可能不兼容。 | `backend-legacy\pom.xml` |
| 老 Vue2/Webpack3 依赖风险 | 前端为 Vue2、Webpack3、node-sass 4.7.2，高版本 Node 可能安装失败。 | `frontend-legacy-vue2\package.json` |
| MySQL 版本兼容风险 | 配置为旧式 JDBC URL，MySQL 8 可能遇到认证插件和时区问题。 | `backend-legacy\ihrm_*\src\main\resources\application.yml` |
| 前端远程 API 硬编码风险 | 前端开发代理当前指向远程 API，Phase 1 需要改成本地 Gateway。 | `frontend-legacy-vue2\config\index.js` |
| 敏感配置风险 | 发现疑似敏感配置。 | 见第 5 节配置文件路径。 |
| 生成产物风险 | 源后端中存在 `target` 目录，已通过 `.gitignore` 排除，不进入 Git baseline。 | `backend-legacy\ihrm_common\target`；`backend-legacy\ihrm_common_model\target`；`.gitignore` |

