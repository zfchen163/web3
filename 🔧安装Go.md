# 🔧 安装 Go 语言环境

## 当前状态

❌ Go 未安装或未配置到 PATH

---

## 🚀 快速安装（推荐）

### 方法 1: 使用 Homebrew（最简单）

```bash
# 安装 Go
brew install go

# 验证安装
go version

# 配置环境变量（如果需要）
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="$HOME/go/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

### 方法 2: 官方安装包

1. **下载安装包**
   - 访问：https://go.dev/dl/
   - 下载 macOS 版本（darwin-arm64 或 darwin-amd64）
   - 通常文件名类似：`go1.21.x.darwin-arm64.pkg`

2. **安装**
   - 双击下载的 `.pkg` 文件
   - 按照安装向导完成安装
   - 默认会安装到 `/usr/local/go`

3. **配置环境变量**
   ```bash
   # 编辑 ~/.zshrc
   nano ~/.zshrc
   
   # 添加以下行到文件末尾
   export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"
   export GOPATH="$HOME/go"
   
   # 保存并退出（Ctrl+X, 然后 Y, 然后 Enter）
   
   # 重新加载配置
   source ~/.zshrc
   
   # 验证安装
   go version
   ```

---

## ✅ 验证安装

安装完成后，运行以下命令验证：

```bash
# 检查 Go 版本
go version

# 检查 Go 环境
go env GOPATH
go env GOROOT

# 应该看到类似输出：
# go version go1.21.x darwin/arm64
# /Users/h/go
# /usr/local/go
```

---

## 🎯 安装完成后启动后端

```bash
# 进入后端目录
cd /Users/h/practice/web3/chain-vault/backend

# 下载依赖（首次运行）
go mod download

# 启动后端服务
go run cmd/api/main.go
```

**预期输出：**
```
Server starting on :8080
Connected to database successfully
Listening for blockchain events...
```

---

## 🔍 检查当前系统架构

```bash
uname -m
```

- `arm64` = Apple Silicon (M1/M2/M3)
- `x86_64` = Intel 芯片

根据输出选择对应的安装包。

---

## 📝 推荐的 Go 版本

- **最低版本**: Go 1.19
- **推荐版本**: Go 1.21 或更高
- **当前最新**: Go 1.22

---

## 🐛 常见问题

### 问题 1: 安装后仍然提示 "command not found"

**解决方案：**
```bash
# 1. 重新加载配置
source ~/.zshrc

# 2. 检查 PATH
echo $PATH | grep go

# 3. 如果没有看到 go 路径，手动添加
export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"

# 4. 再次验证
go version
```

### 问题 2: 权限问题

**解决方案：**
```bash
# 确保 GOPATH 目录存在且有写权限
mkdir -p $HOME/go
chmod 755 $HOME/go
```

### 问题 3: 多个 Go 版本冲突

**解决方案：**
```bash
# 查找所有 Go 安装
which -a go

# 卸载旧版本（Homebrew）
brew uninstall go

# 删除旧版本（手动安装）
sudo rm -rf /usr/local/go

# 重新安装
brew install go
```

---

## 💡 提示

1. **使用 Homebrew 最简单**：一行命令搞定，自动配置环境变量
2. **安装后必须重启终端**：或运行 `source ~/.zshrc`
3. **检查网络**：如果下载慢，可以使用国内镜像：
   ```bash
   # 配置 Go 模块代理
   go env -w GOPROXY=https://goproxy.cn,direct
   ```

---

## 🚀 快速命令（复制粘贴）

```bash
# 一键安装 Go（使用 Homebrew）
brew install go && \
echo 'export PATH="$HOME/go/bin:$PATH"' >> ~/.zshrc && \
source ~/.zshrc && \
go version && \
echo "✅ Go 安装成功！"
```

---

**安装完成后，返回终端运行后端服务！** 🎉
