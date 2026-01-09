#!/bin/bash

echo "======================================"
echo "🚀 快速安装 Go"
echo "======================================"
echo ""

# 禁用 Homebrew 自动更新
export HOMEBREW_NO_AUTO_UPDATE=1

echo "📦 正在安装 Go（跳过 Homebrew 自动更新）..."
brew install go

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✅ Go 安装成功！"
    echo "======================================"
    echo ""
    
    # 配置环境变量
    echo "🔧 配置环境变量..."
    
    # 检查 .zshrc 中是否已有 Go 配置
    if ! grep -q "GOPATH" ~/.zshrc; then
        echo "" >> ~/.zshrc
        echo "# Go 环境配置" >> ~/.zshrc
        echo 'export GOPATH="$HOME/go"' >> ~/.zshrc
        echo 'export PATH="$GOPATH/bin:$PATH"' >> ~/.zshrc
        echo "✅ 环境变量已添加到 ~/.zshrc"
    else
        echo "✅ 环境变量已存在"
    fi
    
    # 重新加载配置
    source ~/.zshrc
    
    echo ""
    echo "======================================"
    echo "📋 Go 版本信息"
    echo "======================================"
    go version
    go env GOPATH
    go env GOROOT
    
    echo ""
    echo "======================================"
    echo "🎯 下一步操作"
    echo "======================================"
    echo ""
    echo "1. 重新加载终端配置："
    echo "   source ~/.zshrc"
    echo ""
    echo "2. 启动后端服务："
    echo "   cd /Users/h/practice/web3/chain-vault/backend"
    echo "   go run cmd/api/main.go"
    echo ""
    echo "======================================"
else
    echo ""
    echo "======================================"
    echo "❌ 安装失败"
    echo "======================================"
    echo ""
    echo "请尝试以下方法："
    echo ""
    echo "方法 1: 手动安装（官方安装包）"
    echo "  1. 访问: https://go.dev/dl/"
    echo "  2. 下载 macOS 版本"
    echo "  3. 双击安装"
    echo ""
    echo "方法 2: 重试 Homebrew"
    echo "  brew update"
    echo "  brew install go"
    echo ""
fi
