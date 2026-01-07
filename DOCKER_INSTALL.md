# 🐳 Docker Desktop 安装指南

## 当前状态

✅ Docker CLI 已安装 (v29.1.3)  
❌ Docker Desktop 需要安装（用于运行容器）

## 安装方法

### 方法 1: 自动安装（推荐，网络正常时）

```bash
cd /Users/h/practice/chain-vault
./install-docker.sh
```

### 方法 2: 手动安装

如果自动安装失败（网络问题），请按以下步骤操作：

1. **下载 Docker Desktop**
   - 访问：https://www.docker.com/products/docker-desktop
   - 或直接下载：https://desktop.docker.com/mac/main/arm64/Docker.dmg
   - 选择 macOS (Apple Silicon) 版本

2. **安装**
   - 打开下载的 `Docker.dmg` 文件
   - 将 `Docker.app` 拖拽到 `Applications` 文件夹
   - 等待复制完成

3. **启动 Docker Desktop**
   ```bash
   open -a Docker
   ```
   - 首次启动需要授权（输入密码）
   - 等待 Docker Desktop 完全启动（约 10-30 秒）
   - 看到菜单栏有 Docker 图标表示启动成功

4. **验证安装**
   ```bash
   docker --version
   docker ps
   ```
   如果 `docker ps` 没有报错，说明安装成功！

## 安装后启动数据库

Docker Desktop 启动后，运行：

```bash
cd /Users/h/practice/chain-vault/backend
docker compose up -d
docker ps | grep chainvault-db
```

## 常见问题

### Docker Desktop 启动失败
- 检查系统权限设置
- 重启 Docker Desktop
- 查看 Docker Desktop 日志

### 网络连接问题
- 检查网络连接
- 尝试使用 VPN 或代理
- 稍后重试自动安装脚本

### 端口被占用
如果 3306 端口被占用：
```bash
# 检查端口占用
lsof -i :3306

# 修改 docker-compose.yml 中的端口映射
```

## 下一步

安装完成后，继续按照 `START_GUIDE.md` 的步骤启动项目。

