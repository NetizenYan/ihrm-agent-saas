# WSL2 基础环境安装方案

> 适用目录：`~/projects/ihrm-agent-saas`。  
> 当前阶段只补齐运行环境，不升级 Java/Spring/Vue/Webpack 项目依赖，不修改业务代码。  
> 不要把 `docker/.env` 提交到 Git；该路径已写入 `.gitignore`。

## 1. 迁移到 Linux 文件系统

建议不要在 `/mnt/d` 下运行 Maven 或 Node。推荐使用：

```bash
mkdir -p ~/projects
rsync -a --delete --exclude node_modules --exclude target \
  /mnt/d/Files/BaiDu/SaaS项目测试demo/_整理结果/ihrm-agent-saas/ \
  ~/projects/ihrm-agent-saas/
cd ~/projects/ihrm-agent-saas
git config core.autocrlf true
```

说明：`core.autocrlf true` 是 WSL 副本的本地 Git 配置，用于避免从 Windows 工作区复制来的 CRLF 文件在 WSL 中被误判为全量修改；不改业务文件内容。

## 2. 检查 Windows PATH 混入

```bash
which node || true
which npm || true
which mvn || true
echo "$PATH"
```

如果 `node`、`npm`、`mvn` 来自 `/mnt/c` 或 `/mnt/d`，建议创建或编辑：

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

重新打开 WSL 后，再检查 `which node`、`which npm`、`which mvn`。

## 3. Java 8 安装方案

优先使用 SDKMAN 管理 JDK：

```bash
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk list java
sdk install java 8.0.392-tem
sdk use java 8.0.392-tem
java -version
```

如果 SDKMAN 不可用，可使用 Ubuntu 软件源中的 OpenJDK 8；Ubuntu 26.04 是否直接提供 OpenJDK 8 证据不足。

## 4. Maven 3.6.3 安装方案

```bash
cd /tmp
curl -LO https://archive.apache.org/dist/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz
sudo mkdir -p /opt/maven
sudo tar -xzf apache-maven-3.6.3-bin.tar.gz -C /opt/maven
cat >> ~/.bashrc <<'EOF'
export MAVEN_HOME=/opt/maven/apache-maven-3.6.3
export PATH=$MAVEN_HOME/bin:$PATH
EOF
source ~/.bashrc
mvn -version
```

## 5. Node.js 8.17.0 安装方案

使用 nvm 安装旧 Node，避免 `node-sass@4.7.2` 与高版本 Node 不兼容：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 8.17.0
nvm use 8.17.0
node -v
npm -v
```

预期版本：Node.js `v8.17.0`，npm 通常为 6.x。

## 6. Docker 安装方案

如果使用 Docker Desktop 的 WSL 集成，先确认：

```bash
docker version
docker compose version
```

如果 WSL 内没有 Docker CLI，可安装 Docker Engine，具体步骤以 Docker 官方文档为准。安装完成后需要确认当前用户可以执行：

```bash
docker ps
```

## 7. Redis/MySQL 使用 Docker Compose

创建本地私有环境文件：

```bash
cd ~/projects/ihrm-agent-saas/docker
cat > .env <<'EOF'
MYSQL_ROOT_PASSWORD=请在本机填写，不要提交
EOF
```

启动基础设施：

```bash
docker compose -f docker-compose.infra.yml --env-file .env up -d
docker compose -f docker-compose.infra.yml ps
```

验证 Redis：

```bash
redis-cli -h 127.0.0.1 -p 6379 ping
```

导入数据库：

```bash
cd ~/projects/ihrm-agent-saas
mysql -h 127.0.0.1 -P 3306 -uroot -p < database/mysql/ihrm-day17-final.sql
mysql -h 127.0.0.1 -P 3306 -uroot -p < database/mysql/act-activiti.sql
```

不要在命令或文档中记录数据库密码原文。
