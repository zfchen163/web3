#!/bin/bash

# Docker Desktop 安装脚本
# 如果网络连接正常，运行此脚本会自动安装 Docker Desktop

set -e

echo "🐳 开始安装 Docker Desktop..."

# 检查是否已安装
if [ -d "/Applications/Docker.app" ]; then
    echo "✅ Docker Desktop 已安装"
    echo "正在启动 Docker Desktop..."
    open -a Docker
    echo "⏳ 等待 Docker Desktop 启动（约 10-30 秒）..."
    sleep 15
    
    # 等待 Docker daemon 启动
    for i in {1..30}; do
        if docker ps &>/dev/null; then
            echo "✅ Docker Desktop 已成功启动！"
            docker --version
            docker ps
            exit 0
        fi
        echo "等待中... ($i/30)"
        sleep 1
    done
    
    echo "⚠️  Docker Desktop 启动中，请稍后手动验证：docker ps"
    exit 0
fi

# 尝试通过 Homebrew 安装
echo "📦 尝试通过 Homebrew 安装..."
if brew install --cask docker; then
    echo "✅ Docker Desktop 安装成功！"
    echo "正在启动 Docker Desktop..."
    open -a Docker
    echo "⏳ 等待 Docker Desktop 启动（约 10-30 秒）..."
    sleep 15
    
    # 等待 Docker daemon 启动
    for i in {1..30}; do
        if docker ps &>/dev/null; then
            echo "✅ Docker Desktop 已成功启动！"
            docker --version
            docker ps
            exit 0
        fi
        echo "等待中... ($i/30)"
        sleep 1
    done
    
    echo "⚠️  Docker Desktop 启动中，请稍后手动验证：docker ps"
else
    echo "❌ Homebrew 安装失败（可能是网络问题）"
    echo ""
    echo "📥 请手动安装 Docker Desktop："
    echo "1. 访问：https://www.docker.com/products/docker-desktop"
    echo "2. 下载 macOS (Apple Silicon) 版本"
    echo "3. 打开下载的 .dmg 文件"
    echo "4. 将 Docker.app 拖拽到 Applications 文件夹"
    echo "5. 从 Applications 启动 Docker Desktop"
    echo "6. 运行以下命令验证："
    echo "   docker ps"
    exit 1
fi

