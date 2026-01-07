# MySQL 安装问题解决方案

## 问题：架构不兼容

检测到 Homebrew 依赖架构不匹配（arm64 vs x86_64）。

## 解决方案

### 方案 1: 重新安装依赖（推荐）

```bash
# 重新安装依赖以匹配当前架构
brew reinstall ca-certificates openssl@3 xz pkgconf

# 然后安装 MySQL
brew install mysql

# 启动服务
brew services start mysql
```

### 方案 2: 使用官方安装包（最简单）

1. 访问：https://dev.mysql.com/downloads/mysql/
2. 选择：
   - **macOS** → **ARM, 64-bit** (Apple Silicon)
   - 或 **macOS** → **x86, 64-bit** (Intel)
3. 下载 **DMG Archive**
4. 双击安装
5. 安装完成后，MySQL 会自动启动

### 方案 3: 使用 Docker（如果已安装 Docker Desktop）

```bash
cd /Users/h/practice/chain-vault/backend
docker compose up -d
```

这会自动启动 MySQL 8.0，无需手动安装。

### 方案 4: 使用 MariaDB（MySQL 的替代品，更轻量）

```bash
brew install mariadb
brew services start mariadb

# 创建数据库（连接方式相同）
mysql -u root << EOF
CREATE DATABASE chainvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chainvault'@'localhost' IDENTIFIED BY 'chainvault';
GRANT ALL PRIVILEGES ON chainvault.* TO 'chainvault'@'localhost';
FLUSH PRIVILEGES;
EOF
```

MariaDB 与 MySQL 完全兼容，项目无需修改！

## 验证安装

安装完成后，运行：

```bash
mysql --version
mysql -u root -e "SHOW DATABASES;"
```

## 创建数据库

无论使用哪种方式，都需要创建数据库：

```bash
mysql -u root << EOF
CREATE DATABASE chainvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chainvault'@'localhost' IDENTIFIED BY 'chainvault';
GRANT ALL PRIVILEGES ON chainvault.* TO 'chainvault'@'localhost';
FLUSH PRIVILEGES;
EOF
```

**注意**：如果设置了 root 密码，使用 `mysql -u root -p` 然后手动执行 SQL。

## 推荐方案

**最快最简单**：使用官方 DMG 安装包（方案 2）
**最轻量**：使用 MariaDB（方案 4）
**最灵活**：使用 Docker（方案 3）

---

**项目已配置为 MySQL，安装完成后直接启动后端即可！** 🚀

