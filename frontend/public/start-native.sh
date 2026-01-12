#!/bin/bash

# ChainVault 原生 HTML 版本启动脚本

echo "🚀 启动 ChainVault 原生 HTML 版本..."
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 检查端口是否被占用
PORT=3002
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，尝试关闭..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
fi

# 启动 HTTP 服务器
echo "📡 在端口 $PORT 启动 HTTP 服务器..."
cd "$SCRIPT_DIR"
python3 -m http.server $PORT &
SERVER_PID=$!

# 等待服务器启动
sleep 2

# 打开浏览器
echo "🌐 打开浏览器..."
URL="http://localhost:$PORT/index-native.html"

# 根据操作系统打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$URL"
else
    echo "请手动打开浏览器访问: $URL"
fi

echo ""
echo "✅ 服务已启动！"
echo "📍 访问地址: $URL"
echo "🛑 按 Ctrl+C 停止服务"
echo ""

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $SERVER_PID 2>/dev/null; exit 0" INT

# 保持脚本运行
wait $SERVER_PID
