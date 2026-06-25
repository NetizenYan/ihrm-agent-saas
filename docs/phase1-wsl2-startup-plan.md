# Phase 1 WSL2 启动计划

> 结论状态：Phase 1 计划文档，未实际执行启动验证。  
> monorepo 根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas`。

## 1. 推荐环境版本

| 组件 | 推荐版本 | 不建议直接使用新版的原因 | 证据路径 |
| --- | --- | --- | --- |
| JDK | 8 | Java 17 与 Spring Boot 2.0.5、Lombok 1.16.x 兼容风险高。 | `backend-legacy\pom.xml` |
| Maven | 3.6.3 | 老 Spring Cloud 工程用 Maven 3.6.x 更稳，避免过新插件行为差异。 | `backend-legacy\pom.xml` |
| MySQL | 5.7 | MySQL 8 可能遇到认证插件、时区、驱动兼容问题。 | `backend-legacy\ihrm_*\src\main\resources\application.yml`；`database\mysql\ihrm-day17-final.sql` |
| Redis | 5.x 或 6.x | 项目使用 Shiro/Redis Session，Redis 7 未静态验证。 | `backend-legacy\ihrm_system\src\main\resources\application.yml`；`backend-legacy\ihrm_common\src\main\java\com\ihrm\common\shiro\session\CustomSessionManager.java` |
| Node.js | 8.17.0，最高建议不超过 10.24.1 | Node 18 与 `node-sass@4.7.2`、Webpack3 不兼容风险高。 | `frontend-legacy-vue2\package.json` |
| npm | 5.x 或 6.x | `package-lock.json` 为 lockfileVersion 1，适配旧 npm。 | `frontend-legacy-vue2\package-lock.json` |

## 2. 后端启动分析

| 服务 | 模块路径 | 启动类 | 端口 | 配置文件 | 依赖中间件 |
| -- | ---- | --- | -: | ---- | ----- |
| Eureka | `backend-legacy\ihrm_eureka` | `backend-legacy\ihrm_eureka\src\main\java\com\ihrm\eureka\EurekaServer.java` | 6868 | `backend-legacy\ihrm_eureka\src\main\resources\application.yml` | 无外部中间件证据，证据不足 |
| Gateway | `backend-legacy\ihrm_gate` | `backend-legacy\ihrm_gate\src\main\java\com\ihrm\gate\GateApplication.java` | 9090 | `backend-legacy\ihrm_gate\src\main\resources\application.yml`；本地覆盖配置 `backend-legacy\ihrm_gate\src\main\resources\application-dev.yml` | Eureka、Redis |
| Company | `backend-legacy\ihrm_company` | `backend-legacy\ihrm_company\src\main\java\com\ihrm\company\CompanyApplication.java` | 9001 | `backend-legacy\ihrm_company\src\main\resources\application.yml` | MySQL、Eureka |
| System | `backend-legacy\ihrm_system` | `backend-legacy\ihrm_system\src\main\java\com\ihrm\system\SystemApplication.java` | 9002 | `backend-legacy\ihrm_system\src\main\resources\application.yml` | MySQL、Redis、Eureka |
| Employee | `backend-legacy\ihrm_employee` | `backend-legacy\ihrm_employee\src\main\java\com\ihrm\employee\EmployeeApplication.java` | 9003 | `backend-legacy\ihrm_employee\src\main\resources\application.yml` | MySQL、Eureka |
| Attendance | `backend-legacy\ihrm_attendance` | `backend-legacy\ihrm_attendance\src\main\java\com\ihrm\atte\AttandanceApplication.java` | 9005 | `backend-legacy\ihrm_attendance\src\main\resources\application.yml` | MySQL、Redis、Eureka |
| Social Security | `backend-legacy\ihrm_social_securitys` | `backend-legacy\ihrm_social_securitys\src\main\java\com\ihrm\social\SocialSecuritysApplication.java` | 9004 | `backend-legacy\ihrm_social_securitys\src\main\resources\application.yml` | MySQL、Eureka |
| Salary | `backend-legacy\ihrm_salarys` | `backend-legacy\ihrm_salarys\src\main\java\com\ihrm\salarys\SalarysApplication.java` | 9006 | `backend-legacy\ihrm_salarys\src\main\resources\application.yml` | MySQL、Redis、Eureka |
| Audit | `backend-legacy\ihrm_audit` | `backend-legacy\ihrm_audit\src\main\java\com\ihrm\audit\AuditApplication.java` | 9007 | `backend-legacy\ihrm_audit\src\main\resources\application.yml` | MySQL `ihrm`、MySQL `act`、Redis、Eureka |
| Common | `backend-legacy\ihrm_common` | 无独立启动类 | 不适用 | `backend-legacy\ihrm_common\pom.xml` | 公共依赖模块 |
| Common Model | `backend-legacy\ihrm_common_model` | 无独立启动类 | 不适用 | `backend-legacy\ihrm_common_model\pom.xml` | 公共模型模块 |

建议后端构建：

```bash
cd /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/backend-legacy
mvn clean install -DskipTests
```

Gateway 在 WSL2 本地启动时需要启用 dev profile，以覆盖本地 Redis host：

```bash
cd /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/backend-legacy/ihrm_gate
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev
```

配置依据：`backend-legacy\ihrm_gate\src\main\resources\application.yml`；`backend-legacy\ihrm_gate\src\main\resources\application-dev.yml`。

## 3. 数据库启动分析

| 数据库 | 脚本路径 | 是否存在 | 备注 |
| --- | ---- | ---- | -- |
| ihrm 主库 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\ihrm-day17-final.sql` | 是 | 包含建库语句；未在报告中输出任何账号或敏感值。 |
| act 工作流库 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\act-activiti.sql` | 是 | 已从原始课程目录 `D:\Files\BaiDu\SaaS项目测试demo\顺序排放\IHRM项目\day16-考勤薪资管理&工作流概述\day16\03-资料\act.sql` 复制。 |
| 默认账号 | `database\mysql\ihrm-day17-final.sql` | 证据不足 | 静态检查未确认默认账号插入语句；不输出任何疑似账号值。 |
| 疑似敏感配置 | `backend-legacy\ihrm_*\src\main\resources\application.yml`；`backend-legacy\ihrm_common\src\main\java\com\ihrm\common\utils\QiniuUploadUtil.java` | 是 | 发现疑似敏感配置。 |

建议数据库命令：

```bash
mysql -uroot -p < /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/database/mysql/ihrm-day17-final.sql
mysql -uroot -p < /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/database/mysql/act-activiti.sql
```

act 脚本恢复记录见：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-blocker-fix-report.md`。

## 4. 前端启动分析

| 项 | 结论 | 证据路径 |
| --- | --- | --- |
| package.json | 存在 | `frontend-legacy-vue2\package.json` |
| Vue | `^2.5.2` | `frontend-legacy-vue2\package.json` |
| Element UI | `^2.2.2` | `frontend-legacy-vue2\package.json` |
| Webpack | `^3.6.0` | `frontend-legacy-vue2\package.json` |
| Axios 封装位置 | 存在 | `frontend-legacy-vue2\src\utils\request.js` |
| 前端代理配置位置 | 存在 | `frontend-legacy-vue2\config\index.js` |
| 当前 API 地址 | Phase 1 本地启动配置已将开发代理 `/api` 指向本地 Gateway。 | `frontend-legacy-vue2\config\index.js` |
| 本地 Gateway 修改方式 | dev proxy `/api` 的 target 为 `http://127.0.0.1:9090`；这是 Phase 1 本地启动配置，不代表生产配置。 | `frontend-legacy-vue2\config\index.js`；`backend-legacy\ihrm_gate\src\main\resources\application.yml` |

建议前端启动：

```bash
cd /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/frontend-legacy-vue2
nvm use 8.17.0
npm install
npm run dev
```

## 5. 推荐启动顺序

1. MySQL
2. Redis
3. 导入 ihrm
4. 导入 act
5. 启动 Eureka
6. 启动各业务服务：System、Company、Employee、Social Security、Attendance、Salary、Audit
7. 启动 Gateway
8. 启动 Vue2 前端
9. 登录验证
10. 部门/用户/员工页面验证

服务与端口证据路径：`backend-legacy\ihrm_*\src\main\resources\application.yml`；前端启动证据路径：`frontend-legacy-vue2\package.json`。

## 6. 可能报错与解决方向

| 报错类型 | 可能原因 | 解决方向 | 证据路径 |
| --- | --- | --- | --- |
| Maven 依赖下载失败 | 老依赖或镜像不可用 | 配置可用 Maven 镜像，保持 Maven 3.6.x | `backend-legacy\pom.xml` |
| JDK 版本不兼容 | Java 17 与老 Spring/Lombok 组合不兼容 | 使用 JDK 8 | `backend-legacy\pom.xml` |
| Lombok 编译问题 | Lombok 1.16.x 较老 | 使用 JDK 8，必要时只在后续阶段评估升级 | `backend-legacy\pom.xml` |
| MySQL 8 认证插件问题 | 旧驱动与 MySQL 8 默认认证不匹配 | 优先 MySQL 5.7，或后续补连接参数和用户认证配置 | `backend-legacy\ihrm_*\src\main\resources\application.yml` |
| MySQL 时区问题 | JDBC URL 未体现时区参数 | 优先 MySQL 5.7；后续验证时再补参数 | 同上 |
| Redis 连接失败 | Redis 未启动或配置不一致 | 启动 Redis，确认端口 6379 | `backend-legacy\ihrm_system\src\main\resources\application.yml` |
| Eureka 服务未注册 | Eureka 未启动或服务名/地址不一致 | 先启动 Eureka，再启动业务服务 | `backend-legacy\ihrm_eureka\src\main\resources\application.yml` |
| Gateway 路由失败 | 服务未注册或 Zuul 路由未匹配 | 确认 Eureka 和 Gateway 路由 | `backend-legacy\ihrm_gate\src\main\resources\application.yml` |
| Node-sass 安装失败 | Node 版本过高 | 使用 Node 8.17.0 | `frontend-legacy-vue2\package.json` |
| Webpack3 与高版本 Node 不兼容 | Webpack3 与 Node 18 组合过新 | 使用 Node 8 或 10 | `frontend-legacy-vue2\package.json` |
| 前端代理仍指向远程 API | Phase 1-C 前曾存在该问题 | 已在 Phase 1 本地启动配置中改为本地 Gateway `http://127.0.0.1:9090` | `frontend-legacy-vue2\config\index.js` |
| WSL2 `/mnt/d` 路径性能问题 | Windows 盘挂载性能较低且路径含中文 | 需要时复制到 WSL home 下短英文路径测试 | monorepo 根路径 |

## 7. Phase 1 验收标准

| 验收项 | 证明方式 |
| --- | --- |
| Maven 能构建 | `backend-legacy` 下 `mvn clean install -DskipTests` 成功。 |
| MySQL/Redis 正常 | MySQL 可导入 ihrm/act，Redis 可连接。 |
| Eureka 能看到服务注册 | `http://127.0.0.1:6868` 可看到业务服务。 |
| Gateway 可访问 | `http://127.0.0.1:9090` 可转发 `/sys/**`、`/company/**` 等路由。 |
| Vue2 前端可启动 | `npm run dev` 成功，默认 8080 可访问。 |
| 登录成功 | 前端能调用 `POST /sys/login` 并保存 Session。 |
| 部门页面可访问 | 部门页面通过 Gateway 读取部门接口。 |
| 用户页面可访问 | 用户页面通过 Gateway 读取用户接口。 |
| 员工基础页面可访问 | 员工页面基础查询可访问。 |

## 8. 本阶段不做事项

* 不做 Agent
* 不做 Vue3
* 不升级 Spring Boot
* 不升级 Spring Cloud
* 不升级数据库结构
* 不修业务 bug
* 不做权限修复
* 不做租户隔离修复
