# 🚀 MySQL 快速安装指南（macOS）

## 方式 1: 使用 Homebrew（推荐，最简单）

### 步骤 1: 安装 MySQL

```bash
brew install mysql
```

### 步骤 2: 启动 MySQL 服务

```bash
brew services start mysql
```

### 步骤 3: 创建数据库和用户

```bash
mysql -u root << EOF
CREATE DATABASE chainvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chainvault'@'localhost' IDENTIFIED BY 'chainvault';
GRANT ALL PRIVILEGES ON chainvault.* TO 'chainvault'@'localhost';
FLUSH PRIVILEGES;
EOF
```

**注意**：如果设置了 root 密码，使用：
```bash
mysql -u root -p
```
然后手动执行上面的 SQL 语句。

### 步骤 4: 验证安装

```bash
mysql -u chainvault -pchainvault -e "SHOW DATABASES;"
```

应该看到 `chainvault` 数据库。

---

## 方式 2: 下载官方安装包

1. 访问：https://dev.mysql.com/downloads/mysql/
2. 选择 **macOS** → **DMG Archive**
3. 下载并安装
4. 安装完成后，按照方式 1 的步骤 3 创建数据库

---

## 配置项目

项目已自动配置为使用 MySQL。确保 `.env` 文件中的连接字符串为：

```
DATABASE_URL=chainvault:chainvault@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local
```

## 启动后端

```bash
cd /Users/h/practice/chain-vault/backend

# 下载 Go 依赖
export GOPROXY=https://goproxy.cn,direct  # 如果网络有问题
go mod tidy

# 启动服务
go run cmd/api/main.go
```

## 验证

启动后端后，应该看到：
```
Database connected and migrated successfully
```

## 常用命令

```bash
# 启动 MySQL
brew services start mysql

# 停止 MySQL
brew services stop mysql

# 重启 MySQL
brew services restart mysql

# 查看状态
brew services list | grep mysql

# 连接数据库
mysql -u chainvault -pchainvault chainvault

# 查看表
mysql -u chainvault -pchainvault chainvault -e "SHOW TABLES;"
```

## 空间占用

MySQL 8.0 通过 Homebrew 安装：
- **安装大小**: ~500MB
- **运行内存**: ~200MB
- **数据目录**: ~100MB（初始）

比 PostgreSQL 小约 20-30%！

---

**安装完成后，运行 `go run cmd/api/main.go` 启动后端！** 🚀

