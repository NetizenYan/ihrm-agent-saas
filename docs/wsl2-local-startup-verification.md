# WSL2 本地启动与验证报告

> 结论状态：未实际执行，仅静态分析。  
> 代码范围：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版`、`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版`。  
> 敏感信息处理：发现疑似敏感配置时，仅标注文件路径，不展示密码、Token、AccessKey 原文。

## 1. 推荐运行版本

| 组件 | 推荐版本 | 依据文件路径 | 说明 |
|---|---:|---|---|
| JDK | 8 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\pom.xml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_* \Dockerfile` | 根 POM 配置 `java.version=1.8`；各服务 Dockerfile 使用 Java 8 镜像。 |
| Maven | 3.6.3 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\pom.xml` | Spring Boot `2.0.5.RELEASE`、Spring Cloud `Finchley.SR1` 属于旧栈，Maven 3.6.x 兼容性较稳。 |
| Node.js | 8.17.0，最高建议不超过 10.24.1 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package-lock.json` | 前端为 Vue 2、Webpack 3、`node-sass@4.7.2`，新 Node 版本大概率触发 native 构建失败。 |
| npm | 5.x 或 6.x | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package-lock.json` | `package-lock.json` 为 lockfileVersion 1，适合旧 npm。 |
| MySQL | 5.7 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_* \src\main\resources\application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql` | 配置中使用旧式 JDBC URL，未看到 MySQL 8 所需时区和认证插件配置；MySQL 8 可尝试但需额外修正。 |
| Redis | 5.x 或 6.x | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\resources\application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_common\src\main\java\com\ihrm\common\shiro\session\CustomSessionManager.java` | Shiro Session 使用 Redis；Redis 7 未验证，建议先用稳定旧版本。 |

## 2. WSL2 Ubuntu 启动步骤

以下步骤未实际执行，仅基于项目文件静态分析。

### 2.1 安装基础环境

依据文件：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\pom.xml`、`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`。

```bash
sudo apt update
sudo apt install -y openjdk-8-jdk maven mysql-server redis-server unzip

java -version
mvn -version
mysql --version
redis-server --version
```

Node 建议通过 nvm 安装旧版本，依据文件：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`。

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 8.17.0
nvm use 8.17.0
node -v
npm -v
```

### 2.2 准备数据库

业务库脚本路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql`。  
工作流服务配置路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_audit\src\main\resources\application.yml`。

```bash
sudo service mysql start
mysql -uroot -p
```

```sql
CREATE DATABASE IF NOT EXISTS ihrm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS act DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

```bash
mysql -uroot -p ihrm < /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/数据库脚本-ihrm-day17最终版.sql
```

`act` 库脚本未出现在 `_整理结果` 根目录。已在课程源目录中发现工作流脚本路径：`D:\Files\BaiDu\SaaS项目测试demo\顺序排放\IHRM项目\day16-考勤薪资管理&工作流概述\day16\03-资料\act.sql`。如果本地部署审批服务，应导入该脚本，或依赖 Activiti 自动建表；具体能否自动建全表未实际验证，证据不足。

### 2.3 修改后端配置

以下文件发现疑似敏感配置，不展示具体值。启动前需要在本地确认 MySQL、Redis 地址、端口、库名、账号配置。

| 服务 | 配置文件路径 |
|---|---|
| company | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_company\src\main\resources\application.yml` |
| system | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\resources\application.yml` |
| employee | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_employee\src\main\resources\application.yml` |
| attendance | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_attendance\src\main\resources\application.yml` |
| social-securitys | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_social_securitys\src\main\resources\application.yml` |
| salarys | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_salarys\src\main\resources\application.yml` |
| audit | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_audit\src\main\resources\application.yml` |
| gate | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_gate\src\main\resources\application.yml` |

### 2.4 后端编译与启动顺序

根目录路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版`。  
根 POM 路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\pom.xml`。

```bash
cd /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/服务端代码-day17最终版
mvn clean install -DskipTests
```

推荐启动顺序：Eureka 注册中心先启动，业务服务随后启动，Gateway 最后启动。依据文件：各服务 `application.yml` 和 `ihrm_gate\src\main\resources\application.yml` 的 Zuul 路由配置。

| 启动顺序 | 服务 | 端口 | 启动命令 | 配置文件路径 |
|---:|---|---:|---|---|
| 1 | eureka | 6868 | `cd ihrm_eureka && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_eureka\src\main\resources\application.yml` |
| 2 | system | 9002 | `cd ihrm_system && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\resources\application.yml` |
| 3 | company | 9001 | `cd ihrm_company && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_company\src\main\resources\application.yml` |
| 4 | employee | 9003 | `cd ihrm_employee && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_employee\src\main\resources\application.yml` |
| 5 | social-securitys | 9004 | `cd ihrm_social_securitys && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_social_securitys\src\main\resources\application.yml` |
| 6 | attendance | 9005 | `cd ihrm_attendance && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_attendance\src\main\resources\application.yml` |
| 7 | salarys | 9006 | `cd ihrm_salarys && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_salarys\src\main\resources\application.yml` |
| 8 | audit | 9007 | `cd ihrm_audit && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_audit\src\main\resources\application.yml` |
| 9 | gate | 9090 | `cd ihrm_gate && mvn spring-boot:run` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_gate\src\main\resources\application.yml` |

如果使用 jar 方式，依据根 POM 多模块结构，先执行：

```bash
mvn clean package -DskipTests
java -jar ihrm_eureka/target/*.jar
java -jar ihrm_system/target/*.jar
java -jar ihrm_company/target/*.jar
java -jar ihrm_employee/target/*.jar
java -jar ihrm_social_securitys/target/*.jar
java -jar ihrm_attendance/target/*.jar
java -jar ihrm_salarys/target/*.jar
java -jar ihrm_audit/target/*.jar
java -jar ihrm_gate/target/*.jar
```

## 3. 前端本地启动

前端根目录：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版`。  
前端依赖文件：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json`。  
开发代理配置：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\config\index.js`。

```bash
cd /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/客户端代码-day17最终版
nvm use 8.17.0
npm install
npm run dev
```

`config\index.js` 中开发端口为 `8080`，代理前缀为 `/api`。本地联调时应将代理目标改为后端网关 `http://127.0.0.1:9090`。当前代理目标指向远端地址，依据文件：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\config\index.js`。

## 4. 可能启动失败点

| 风险点 | 影响 | 依据文件路径 | 建议 |
|---|---|---|---|
| JDK 版本过新 | Lombok `1.16.16`、Spring Boot 2.0 老版本可能编译失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\pom.xml` | 使用 JDK 8。 |
| 根 POM 注释或编码异常 | Maven 解析可能失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\pom.xml` | 如解析失败，先定位 XML 注释和文件编码；此报告未修改。 |
| MySQL 8 认证或时区问题 | 服务连接数据库失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_* \src\main\resources\application.yml` | 优先 MySQL 5.7；若用 MySQL 8，补充驱动、时区和认证配置。 |
| Redis 未启动 | 登录 Session、Shiro 缓存异常 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\resources\application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_common\src\main\java\com\ihrm\common\shiro\session\CustomSessionManager.java` | 启动 Redis，确认 host/port 与配置一致。 |
| `act` 数据库缺失 | 审批服务启动或流程查询失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_audit\src\main\resources\application.yml` | 创建 `act` 库并导入工作流脚本；脚本路径见上文。 |
| Eureka 未启动 | 业务服务注册和网关路由失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_eureka\src\main\resources\application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_gate\src\main\resources\application.yml` | 按启动顺序先启动 Eureka。 |
| 端口占用 | 服务启动失败或前端代理失败 | 各服务 `application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\config\index.js` | 检查 6868、9001 到 9007、9090、8080。 |
| Node 版本过新 | `node-sass@4.7.2` 安装失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\package.json` | 使用 nvm 切到 Node 8.17.0。 |
| npm 镜像失效 | 依赖下载失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\.npmrc` | 如旧镜像不可用，替换为当前可用 registry。 |
| WSL 路径包含中文和空格 | 老 Maven/Node 插件可能路径解析异常 | 当前项目路径 `D:\Files\BaiDu\SaaS项目测试demo\_整理结果` | 如构建异常，复制到短英文路径再试。 |
| 文件编码不一致 | SQL 导入、中文资源、POM 解析异常 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\数据库脚本-ihrm-day17最终版.sql`；根 POM | MySQL 客户端使用 UTF-8；必要时确认文件编码。 |

## 5. 启动后建议验证项

以下为建议验证项，未实际执行。

| 验证项 | 目标 | 依据文件路径 |
|---|---|---|
| Eureka 控制台 | `http://127.0.0.1:6868` 可打开，各服务注册成功 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_eureka\src\main\resources\application.yml` |
| 网关路由 | `/api/sys/login` 能经前端代理到网关，再到 system 服务 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_gate\src\main\resources\application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\config\index.js` |
| 登录 Session | 登录返回值作为前端 Cookie Token，后续请求带 `Authorization: Bearer ...` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\java\com\ihrm\system\controller\UserController.java`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\src\utils\request.js` |
| Redis Session | system 服务可读写 Shiro Session | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_system\src\main\resources\application.yml`；`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\服务端代码-day17最终版\ihrm_common\src\main\java\com\ihrm\common\shiro\session\CustomSessionManager.java` |
| 前端页面 | `http://127.0.0.1:8080` 可打开登录页 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\客户端代码-day17最终版\config\index.js` |
