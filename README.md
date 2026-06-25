# iHRM Agent SaaS

## 项目定位

iHRM Agent SaaS 是一个基于 Java + Vue 的前后端分离 SaaS 管理系统，聚焦企业 HRM 业务场景，包含组织架构、员工、薪资、社保、考勤、审批、权限与租户安全等模块。项目当前用于演示传统 Spring Cloud 后端的本地化部署、安全边界补强、Vue3 渐进式迁移，以及面向企业系统的 Agent Chat 前端实验。

## 当前基线

* 后端：Java 8 + Spring Boot 2.0.5 + Spring Cloud Finchley.SR1
* 前端：Vue2 + Element UI + Webpack3，Vue3 + Vite + TypeScript 渐进式迁移
* 数据库：MySQL ihrm 业务库 + Activiti act 工作流库
* 架构：Eureka + Zuul + OpenFeign + Redis + MySQL
* 安全方向：Shiro Session、Gateway 认证边界、租户隔离、敏感接口收敛

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

## 当前能力

* Spring Cloud 微服务后端与 Gateway 路由。
* Vue2 旧前端保留，Vue3 新前端逐步迁移。
* WSL2 本地启动验证与脚本化检查。
* Gateway 认证边界与社保租户过滤等安全修复路线。
* Agent Chat 前端 mock stream 交互实验。

## 安全说明

当前项目仍处于安全补强与迁移演示阶段，不建议直接作为生产系统使用。真实 Agent 不应直接查询数据库，也不应开放薪资、社保、考勤、审批、权限、上传、导入、导出等敏感写操作能力。

## License

MIT License.