#!/bin/bash

echo "======================================"
echo "🚀 启动前端服务"
echo "======================================"
echo ""

# 设置 Node.js 路径
export PATH="/Users/h/.nvm/versions/node/v25.1.0/bin:$PATH"

# 进入前端目录
cd /Users/h/practice/web3/chain-vault/frontend

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未找到"
    echo ""
    echo "请在您的终端中运行："
    echo "  source ~/.zshrc"
    echo "  cd /Users/h/practice/web3/chain-vault/frontend"
    echo "  npm run dev"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""
echo "🚀 正在启动前端服务..."
echo ""

# 启动前端
npm run dev
