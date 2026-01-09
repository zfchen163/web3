#!/bin/zsh

# 加载 zsh 配置
source ~/.zshrc 2>/dev/null || true

# 如果 nvm 存在，加载它
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 添加常见的 Go 路径
export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"

# 添加 Homebrew 路径
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "======================================"
echo "🔍 检查环境..."
echo "======================================"

# 检查 Go
if command -v go &> /dev/null; then
    echo "✅ Go: $(go version)"
else
    echo "❌ Go 未找到"
    echo "   请在新的终端窗口中运行以下命令："
    echo "   source ~/.zshrc"
    echo "   go version"
fi

# 检查 Node
if command -v node &> /dev/null; then
    echo "✅ Node: $(node --version)"
else
    echo "❌ Node 未找到"
fi

# 检查 npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm 未找到"
fi

echo ""
echo "======================================"
echo "🚀 启动服务..."
echo "======================================"

# 检查 MySQL
echo "📊 检查 MySQL..."
if docker ps | grep -q chainvault-db; then
    echo "✅ MySQL 容器正在运行"
else
    echo "⚠️  MySQL 容器未运行，正在启动..."
    cd /Users/h/practice/web3/chain-vault/backend
    docker-compose up -d
    sleep 3
fi

echo ""
echo "======================================"
echo "📝 启动说明"
echo "======================================"
echo ""
echo "请在 **两个不同的终端窗口** 中分别运行："
echo ""
echo "终端 1 - 启动后端："
echo "  cd /Users/h/practice/web3/chain-vault/backend"
echo "  go run cmd/api/main.go"
echo ""
echo "终端 2 - 启动前端："
echo "  cd /Users/h/practice/web3/chain-vault/frontend"
echo "  npm run dev"
echo ""
echo "======================================"
echo ""
echo "💡 提示："
echo "  - 如果命令找不到，请先运行: source ~/.zshrc"
echo "  - 后端地址: http://localhost:8080"
echo "  - 前端地址: http://localhost:3000"
echo ""
echo "======================================"
