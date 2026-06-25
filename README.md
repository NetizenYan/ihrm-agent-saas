# iHRM Agent SaaS Refactor

## 项目定位

本项目基于 day17 最终版 SaaS HRM 教学项目，目标是进行老式 Java SaaS 系统的工程化整理、WSL2 本地部署、权限与租户隔离补强、旁路 Agent 改造、Vue3 渐进式升级和准 SaaS 平台化改造。

## 当前基线

* 后端：Java 8 + Spring Boot 2.0.5 + Spring Cloud Finchley.SR1
* 前端：Vue2 + Element UI + Webpack3
* 数据库：MySQL ihrm 业务库 + Activiti act 工作流库
* 架构：Eureka + Zuul + OpenFeign + Redis + MySQL
* 当前阶段：Phase 0 baseline 整理

## 目录结构

| 目录 | 作用 |
| --- | --- |
| `backend-legacy/` | day17 最终版 Java/Spring Cloud 后端遗留代码。 |
| `frontend-legacy-vue2/` | day17 最终版 Vue2 + Element UI + Webpack3 前端遗留代码。 |
| `database/` | day17 最终版业务库 SQL 脚本。 |
| `docs/` | 架构、数据库、权限、WSL2、Agent、Vue3 等分析报告。 |
| `scripts/` | 后续工程脚本预留目录；Phase 0 暂不新增业务脚本。 |
| `docker/` | 后续容器化配置预留目录；Phase 0 暂不改造服务 Dockerfile。 |
| `archive/` | 原始文档压缩包等归档文件。 |

## 后续改造路线

* Phase 1：WSL2 本地启动验证
* Phase 2：认证、权限、租户隔离验证
* Phase 3：RBAC、TenantContext、审计日志补强
* Phase 4：只读 Agent MVP
* Phase 5：Vue3 新前端渐进式迁移
* Phase 6：准 SaaS 平台能力
* Phase 7：后端现代化升级

## Phase 0 边界

本阶段只做基线整理和文档化，不做 Agent，不做 Vue3，不升级依赖，不重构，不修改业务逻辑，不自动格式化 Java/Vue/SQL 文件。
