#!/bin/bash

echo "🔄 重启后端服务..."
echo ""

# 查找并停止旧的后端进程
echo "1️⃣ 停止旧的后端进程..."
PID=$(lsof -ti :8080)
if [ -n "$PID" ]; then
    echo "   找到进程 PID: $PID"
    kill -9 $PID 2>/dev/null
    sleep 1
    echo "   ✅ 已停止旧进程"
else
    echo "   ℹ️  没有找到运行中的后端进程"
fi

echo ""
echo "2️⃣ 启动新的后端服务..."
cd /Users/h/practice/web3/chain-vault/backend

# 在后台启动后端服务
nohup go run cmd/api/main.go > /tmp/chainvault-backend.log 2>&1 &
NEW_PID=$!

sleep 2

# 检查是否启动成功
if lsof -ti :8080 > /dev/null 2>&1; then
    echo "   ✅ 后端服务启动成功！"
    echo "   📝 PID: $NEW_PID"
    echo "   📡 监听端口: 8080"
    echo "   📄 日志文件: /tmp/chainvault-backend.log"
    echo ""
    echo "查看日志："
    echo "   tail -f /tmp/chainvault-backend.log"
else
    echo "   ❌ 后端服务启动失败"
    echo "   查看日志: cat /tmp/chainvault-backend.log"
    exit 1
fi

echo ""
echo "3️⃣ 测试后端接口..."
sleep 1
curl -s http://localhost:8080/health | python3 -m json.tool

echo ""
echo "🎉 后端服务重启完成！"
