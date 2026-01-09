#!/bin/bash

echo "=========================================="
echo "🚀 执行数据库迁移并重启服务"
echo "=========================================="
echo ""

cd "$(dirname "$0")/web3/chain-vault/backend" || exit 1

echo "📊 步骤 1: 执行数据库迁移..."
echo ""

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ Go 未安装，请先安装 Go"
    exit 1
fi

# 执行迁移
go run cmd/migrate/main.go

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 迁移成功！"
    echo ""
    echo "📊 步骤 2: 检查后端服务状态..."
    
    # 检查是否有运行中的后端服务
    if pgrep -f "go run.*cmd/api/main.go" > /dev/null; then
        echo "⚠️  检测到运行中的后端服务，正在重启..."
        pkill -f "go run.*cmd/api/main.go"
        sleep 2
    fi
    
    echo ""
    echo "🚀 启动后端服务..."
    echo "提示：服务将在后台运行，日志会输出到终端"
    echo ""
    
    # 启动后端服务（后台运行）
    nohup go run cmd/api/main.go > backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
    echo "📝 日志文件: backend/backend.log"
    echo ""
    echo "等待 3 秒后检查服务状态..."
    sleep 3
    
    # 检查服务是否正常运行
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ 后端服务运行正常！"
        echo "📍 API 地址: http://localhost:8080"
    else
        echo "⚠️  后端服务可能未正常启动，请检查日志: backend/backend.log"
    fi
    
    echo ""
    echo "=========================================="
    echo "🎉 完成！"
    echo "=========================================="
    echo ""
    echo "下一步："
    echo "1. 检查前端服务是否运行: http://localhost:3000"
    echo "2. 测试图片上传功能"
    echo "3. 查看日志: tail -f backend/backend.log"
    
else
    echo ""
    echo "❌ 迁移失败，请检查错误信息"
    exit 1
fi

