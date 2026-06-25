# Phase 1-C WSL2 环境补齐与重跑准备计划

> 结论状态：已执行项目迁移、路径整理和本地启动配置准备；未实际安装 JDK/Maven/Node/Docker/MySQL/Redis，未启动 Docker Compose，未重跑 Phase 1-B。  
> Windows monorepo 路径：`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas`。  
> WSL Linux 文件系统路径：`/home/linux/projects/ihrm-agent-saas`。  
> 约束执行情况：未写 Agent、未做 Vue3、未做 PostgreSQL 迁移、未修复认证/权限/租户隔离、未升级 Spring Boot/Spring Cloud、未升级 Vue/Webpack 依赖、未自动格式化 Java/Vue/SQL、未删除原始文件、未输出密码/Token/Secret/AccessKey 原文。

## 1. 当前阻塞项

| 阻塞项 | 当前状态 | 证据路径 | 处理计划 |
|---|---|---|---|
| JDK 未安装 | Phase 1-B 中 `java -version` 失败 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-wsl2-startup-verification-result.md` | 使用 SDKMAN 安装 JDK 8。 |
| Maven 因 `JAVA_HOME` 不正确不可用 | Phase 1-B 中 `mvn -version` 失败 | 同上 | 安装 JDK 8 后安装/启用 Maven 3.6.3。 |
| MySQL 未安装 | Phase 1-B 中 `mysql --version` 失败 | 同上 | 使用 Docker Compose 启动 MySQL 5.7。 |
| Redis 未安装 | Phase 1-B 中 `redis-server`、`redis-cli` 均失败 | 同上 | 使用 Docker Compose 启动 Redis 6.2。 |
| Node.js 未安装 | Phase 1-B 中 `node -v` 失败 | 同上 | 使用 nvm 安装 Node.js 8.17.0。 |
| npm 来自 Windows PATH | `which npm` 指向 `/mnt/d/Developer/Soft/NodeJS/npm` | WSL PATH 检查命令；本报告第 2 节 | 配置 `/etc/wsl.conf` 禁止自动追加 Windows PATH。 |
| Maven 来自 Windows PATH | `which mvn` 指向 `/mnt/d/Developer/Soft/apache-maven-3.9.16/bin/mvn` | WSL PATH 检查命令；本报告第 2 节 | 配置 `/etc/wsl.conf` 后在 WSL 内安装 Maven 3.6.3。 |
| Maven/Node 不应在 `/mnt/d` 下运行 | Phase 1-B 在 `/mnt/d` 下执行 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-wsl2-startup-verification-result.md` | 已 rsync 到 `/home/linux/projects/ihrm-agent-saas`。 |
| SQL 路径不一致 | Phase 1-B 发现 `database/mysql/ihrm-day17-final.sql` 不存在 | 同上 | 已用 `git mv` 统一到 `database\mysql\ihrm-day17-final.sql`。 |
| 前端代理指向远程 API | Phase 1-B 静态检查发现 dev proxy 非本地 Gateway | 同上 | 已在 Phase 1 本地启动配置中改为本地 Gateway。 |

## 2. WSL Linux 文件系统迁移

已执行迁移命令：

```bash
mkdir -p "$HOME/projects"
rsync -a --delete --exclude node_modules --exclude target \
  /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/ \
  "$HOME/projects/ihrm-agent-saas/"
cd "$HOME/projects/ihrm-agent-saas"
git config core.autocrlf true
```

| 项 | 结果 | 证据 |
|---|---|---|
| 推荐路径 | `/home/linux/projects/ihrm-agent-saas` | `pwd` 输出 `/home/linux/projects/ihrm-agent-saas` |
| 是否使用 rsync | 是 | rsync 版本为 `3.4.1` |
| 是否排除 `node_modules` | 是 | rsync 命令包含 `--exclude node_modules` |
| 是否排除 `target` | 是 | rsync 命令包含 `--exclude target` |
| WSL 副本分支 | `phase1-wsl2-startup` | WSL 副本中 `git branch --show-current` |
| WSL 副本最近提交 | `c02c915 docs: record phase1 startup verification attempt` | WSL 副本中 `git log --oneline --decorate -3` |
| WSL 副本工作区 | 通过本地 `core.autocrlf=true` 处理换行识别后干净 | WSL 副本中 `git status --short` 无输出 |

说明：`core.autocrlf=true` 只写入 WSL 副本本地 `.git/config`，不提交，不改业务文件内容。

## 3. Windows PATH 混入检查

已执行：

```bash
which node || true
which npm || true
which mvn || true
echo "$PATH"
```

| 命令 | 结果 | 说明 |
|---|---|---|
| `which node` | 无输出 | WSL 内未安装 Node。 |
| `which npm` | `/mnt/d/Developer/Soft/NodeJS//npm` | npm 来自 Windows 挂载路径，不适合作为 WSL 项目运行环境。 |
| `which mvn` | `/mnt/d/Developer/Soft/apache-maven-3.9.16/bin/mvn` | Maven 来自 Windows 挂载路径，且 Phase 1-B 已因 `JAVA_HOME` 不正确失败。 |
| `PATH` | 包含大量 `/mnt/c`、`/mnt/d` 条目 | WSL 自动追加 Windows PATH。 |

建议配置：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[interop]
appendWindowsPath=false
EOF
```

然后在 Windows PowerShell 执行：

```powershell
wsl --shutdown
```

重新打开 WSL 后再运行 `which node`、`which npm`、`which mvn`。

## 4. 环境安装方案

详细命令已写入：

`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\scripts\setup-wsl-env.md`

| 组件 | 方案 | 证据路径 |
|---|---|---|
| Java 8 | 优先 SDKMAN 安装 JDK 8 | `scripts\setup-wsl-env.md` |
| Maven 3.6.3 | 使用 Apache Maven 3.6.3 压缩包安装到 `/opt/maven` | `scripts\setup-wsl-env.md` |
| Node.js 8.17.0 | 使用 nvm 安装 Node 8.17.0 | `scripts\setup-wsl-env.md` |
| Docker | 优先 Docker Desktop WSL 集成；否则按 Docker Engine 方案安装 | `scripts\setup-wsl-env.md` |
| MySQL/Redis | 使用 Docker Compose 启动 MySQL 5.7 和 Redis 6.2 | `docker\docker-compose.infra.yml` |

实际安装状态：本阶段没有执行 JDK/Maven/Node/Docker/MySQL/Redis 安装，不伪造成功。

## 5. Docker MySQL/Redis 方案

Compose 文件：

`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docker\docker-compose.infra.yml`

| 服务 | 镜像 | 端口 | 配置 |
|---|---|---:|---|
| MySQL | `mysql:5.7` | 3306 | 密码从 `docker/.env` 读取；数据目录为 `docker/mysql-data/` |
| Redis | `redis:6.2` | 6379 | 暴露本地 6379 |

`.gitignore` 已排除：

| 路径 | 状态 | 证据路径 |
|---|---|---|
| `docker/.env` | 已排除 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\.gitignore` |
| `docker/mysql-data/` | 已排除 | 同上 |

手动创建 `docker/.env` 时不要提交，不要在报告里写密码原文。

## 6. SQL 路径修复

已执行：

```bash
git mv database/ihrm-day17-final.sql database/mysql/ihrm-day17-final.sql
```

| 项 | 结果 | 证据路径 |
|---|---|---|
| ihrm 主库 SQL | 已统一到 `database\mysql\ihrm-day17-final.sql` | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\ihrm-day17-final.sql` |
| act 工作流 SQL | 仍存在 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\database\mysql\act-activiti.sql` |
| 是否修改 SQL 内容 | 否 | 使用 `git mv` 移动路径，不改 SQL 正文。 |
| 启动计划是否更新 | 是 | `D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\docs\phase1-wsl2-startup-plan.md` |

## 7. 前端代理修复

检查文件：

`D:\Files\BaiDu\SaaS项目测试demo\_整理结果\ihrm-agent-saas\frontend-legacy-vue2\config\index.js`

处理结果：已在 Phase 1 本地启动配置中将开发代理 `/api` 指向本地 Gateway `http://127.0.0.1:9090`。

| 项 | 结果 | 证据路径 |
|---|---|---|
| 原问题 | dev proxy 指向远程 API | `frontend-legacy-vue2\config\index.js` |
| 修复方式 | 最小本地配置修改，指向本地 Gateway | `frontend-legacy-vue2\config\index.js` |
| 是否生产配置 | 否 | 本修改仅用于 Phase 1 WSL2 本地启动验证。 |
| 启动计划是否记录 | 是 | `docs\phase1-wsl2-startup-plan.md` |

## 8. 重跑 Phase 1-B 的命令

在 WSL 中进入 Linux 文件系统副本：

```bash
cd ~/projects/ihrm-agent-saas
```

确认基础工具：

```bash
java -version
mvn -version
docker version
docker compose version
node -v
npm -v
```

启动基础设施：

```bash
cd ~/projects/ihrm-agent-saas/docker
docker compose -f docker-compose.infra.yml --env-file .env up -d
docker compose -f docker-compose.infra.yml ps
redis-cli -h 127.0.0.1 -p 6379 ping
```

导入数据库：

```bash
cd ~/projects/ihrm-agent-saas
mysql -h 127.0.0.1 -P 3306 -uroot -p < database/mysql/ihrm-day17-final.sql
mysql -h 127.0.0.1 -P 3306 -uroot -p < database/mysql/act-activiti.sql
```

构建后端：

```bash
cd ~/projects/ihrm-agent-saas/backend-legacy
mvn clean package -DskipTests
```

启动 Gateway 时使用 dev profile：

```bash
cd ~/projects/ihrm-agent-saas/backend-legacy/ihrm_gate
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev
```

前端：

```bash
cd ~/projects/ihrm-agent-saas/frontend-legacy-vue2
nvm use 8.17.0
npm install
npm run dev
```

## 9. 不做事项

* 不写 Agent
* 不做 Vue3
* 不做 PostgreSQL 迁移
* 不修复认证、权限、租户隔离
* 不升级 Spring Boot/Spring Cloud
* 不升级 Vue/Webpack 依赖
* 不自动格式化 Java/Vue/SQL
* 不提交 `docker/.env`
* 不提交 `docker/mysql-data/`
* 不提交 `node_modules/`、`target/`、日志文件、数据库 dump

## 10. 验收标准

| 验收项 | 标准 |
|---|---|
| WSL 路径 | 项目在 `~/projects/ihrm-agent-saas` 下运行，不在 `/mnt/d` 下跑 Maven/Node。 |
| PATH | `which node`、`which npm`、`which mvn` 不指向 `/mnt/c` 或 `/mnt/d`。 |
| Java/Maven | `java -version` 为 JDK 8，`mvn -version` 为 Maven 3.6.x。 |
| Node/npm | `node -v` 为 8.17.0 或 10.x，npm 为 5.x/6.x。 |
| Docker Infra | MySQL 5.7 和 Redis 6.2 容器启动成功。 |
| Redis | `redis-cli -h 127.0.0.1 -p 6379 ping` 返回 `PONG`。 |
| Database | `ihrm` 导入后约 51 张表，`act` 导入后约 25 张 Activiti 表。 |
| 后端构建 | `mvn clean package -DskipTests` 成功。 |
| Gateway | 使用 `--spring.profiles.active=dev` 启动，并连接本地 Redis。 |
| 前端 | `npm install` 和 `npm run dev` 成功，代理指向本地 Gateway。 |

## 11. 本阶段真实执行结果

| 项 | 是否实际执行 | 结果 |
|---|---|---|
| rsync 迁移到 WSL home | 是 | 成功，目标 `/home/linux/projects/ihrm-agent-saas`。 |
| PATH 混入检查 | 是 | 发现 npm 和 Maven 来自 `/mnt/d`，需要配置 `/etc/wsl.conf` 并重启 WSL。 |
| JDK/Maven/Node 安装 | 否 | 未执行，不伪造成功。 |
| Docker 安装 | 否 | 未执行，不伪造成功。 |
| Docker Compose 启动 MySQL/Redis | 否 | 未执行，不伪造成功。 |
| SQL 内容修改 | 否 | 仅移动路径。 |
| 前端代理本地化 | 是 | 已将 Phase 1 dev proxy 指向本地 Gateway。 |
