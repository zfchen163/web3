# MySQL 安装和配置指南

## 为什么选择 MySQL？

- ✅ **占用空间更小**：MySQL 8.0 镜像约 500MB，PostgreSQL 15 约 600MB+
- ✅ **启动更快**：MySQL 启动速度通常更快
- ✅ **资源占用更少**：适合本地开发和测试
- ✅ **完全兼容**：GORM 完美支持 MySQL

## 安装方式

### 方式 1: 使用 Docker（推荐，最简单）

```bash
cd /Users/h/practice/chain-vault/backend
docker compose up -d
```

这会启动 MySQL 8.0，配置如下：
- 端口: `3306`
- 数据库名: `chainvault`
- 用户名: `chainvault`
- 密码: `chainvault`
- Root 密码: `root`

### 方式 2: 使用 Homebrew（macOS）

```bash
# 安装 MySQL
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 创建数据库和用户
mysql -u root -p << EOF
CREATE DATABASE chainvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chainvault'@'localhost' IDENTIFIED BY 'chainvault';
GRANT ALL PRIVILEGES ON chainvault.* TO 'chainvault'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 方式 3: 下载安装包

1. 访问 https://dev.mysql.com/downloads/mysql/
2. 下载 macOS 安装包（.dmg）
3. 安装并启动 MySQL
4. 创建数据库和用户（同上）

## 验证安装

```bash
# 检查 MySQL 是否运行
mysql --version

# 测试连接（Docker 方式）
docker exec -it chainvault-db mysql -u chainvault -pchainvault -e "SHOW DATABASES;"

# 测试连接（本地安装）
mysql -u chainvault -pchainvault -e "SHOW DATABASES;"
```

## 配置项目

项目已自动配置为使用 MySQL，`.env` 文件中的连接字符串：

```
DATABASE_URL=chainvault:chainvault@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local
```

## 启动后端

```bash
cd /Users/h/practice/chain-vault/backend

# 下载 Go 依赖（包含 MySQL 驱动）
export GOPROXY=https://goproxy.cn,direct  # 如果网络有问题
go mod tidy

# 启动服务
go run cmd/api/main.go
```

## 常见问题

### 1. Docker 端口冲突

如果 3306 端口被占用：

```yaml
# 修改 docker-compose.yml
ports:
  - "3307:3306"  # 改为其他端口
```

然后更新 `.env`：
```
DATABASE_URL=chainvault:chainvault@tcp(localhost:3307)/chainvault?charset=utf8mb4&parseTime=True&loc=Local
```

### 2. 连接失败

检查：
- MySQL 是否运行：`docker ps | grep chainvault-db` 或 `brew services list`
- 端口是否正确
- 用户名密码是否正确

### 3. 字符集问题

MySQL 8.0 默认使用 `utf8mb4`，项目已配置，无需额外设置。

## 数据库管理工具推荐

- **MySQL Workbench**（官方工具）
- **Sequel Pro**（macOS，轻量级）
- **TablePlus**（跨平台，现代化）
- **DBeaver**（免费，功能强大）

## 空间占用对比

| 数据库 | Docker 镜像大小 | 运行内存占用 |
|--------|---------------|-------------|
| MySQL 8.0 | ~500MB | ~200MB |
| PostgreSQL 15 | ~600MB+ | ~300MB+ |

**结论**：MySQL 占用空间更小，更适合本地测试！✅

