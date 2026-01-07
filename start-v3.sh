#!/bin/bash

# ChainVault V3 快速启动脚本

set -e

echo "🚀 ChainVault V3 启动脚本"
echo "=========================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查依赖
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 未安装${NC}"
        echo "请安装 $1: $2"
        exit 1
    else
        echo -e "${GREEN}✅ $1 已安装${NC}"
    fi
}

echo "📦 检查依赖..."
check_dependency "node" "https://nodejs.org/"
check_dependency "go" "https://golang.org/"
check_dependency "mysql" "https://dev.mysql.com/downloads/"
echo ""

# 检查 Hardhat 节点是否运行
check_hardhat() {
    if curl -s http://localhost:8545 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Hardhat 节点正在运行${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Hardhat 节点未运行${NC}"
        return 1
    fi
}

# 检查后端是否运行
check_backend() {
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务正在运行${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  后端服务未运行${NC}"
        return 1
    fi
}

# 检查前端是否运行
check_frontend() {
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务正在运行${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  前端服务未运行${NC}"
        return 1
    fi
}

# 主菜单
show_menu() {
    echo ""
    echo "请选择操作："
    echo "1) 🔧 完整部署（首次使用）"
    echo "2) 🚀 启动所有服务"
    echo "3) 📊 检查服务状态"
    echo "4) 🧪 运行测试"
    echo "5) 🛑 停止所有服务"
    echo "6) 📝 查看日志"
    echo "0) 退出"
    echo ""
    read -p "请输入选项 [0-6]: " choice
}

# 完整部署
full_deploy() {
    echo ""
    echo "🔧 开始完整部署..."
    echo ""
    
    # 1. 安装合约依赖
    echo "📦 安装合约依赖..."
    cd contracts
    npm install
    cd ..
    
    # 2. 编译合约
    echo "🔨 编译合约..."
    cd contracts
    npx hardhat compile
    cd ..
    
    # 3. 检查数据库
    echo "🗄️  配置数据库..."
    read -p "MySQL root 密码: " -s mysql_password
    echo ""
    
    mysql -u root -p$mysql_password -e "CREATE DATABASE IF NOT EXISTS chainvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
        echo -e "${RED}❌ 数据库创建失败${NC}"
        exit 1
    }
    
    mysql -u root -p$mysql_password chainvault < backend/migrations/001_init.sql 2>/dev/null || true
    mysql -u root -p$mysql_password chainvault < backend/migrations/002_v3_upgrade.sql 2>/dev/null || true
    
    echo -e "${GREEN}✅ 数据库配置完成${NC}"
    
    # 4. 配置后端
    echo "⚙️  配置后端..."
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ETH_RPC_URL=http://localhost:8545
DATABASE_URL=root:$mysql_password@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local
IPFS_API_URL=http://localhost:5001/api/v0
PORT=8080
EOF
        echo -e "${GREEN}✅ 后端配置完成${NC}"
    else
        echo -e "${YELLOW}⚠️  后端配置已存在，跳过${NC}"
    fi
    
    # 5. 安装后端依赖
    echo "📦 安装后端依赖..."
    cd backend
    go mod download
    cd ..
    
    # 6. 安装前端依赖
    echo "📦 安装前端依赖..."
    cd frontend
    npm install
    cd ..
    
    echo ""
    echo -e "${GREEN}✅ 完整部署完成！${NC}"
    echo ""
    echo "下一步："
    echo "1. 运行 './start-v3.sh' 并选择选项 2 启动所有服务"
    echo "2. 部署合约后更新合约地址"
    echo ""
}

# 启动所有服务
start_all() {
    echo ""
    echo "🚀 启动所有服务..."
    echo ""
    
    # 启动 Hardhat 节点
    if ! check_hardhat; then
        echo "🔗 启动 Hardhat 节点..."
        cd contracts
        npx hardhat node > ../logs/hardhat.log 2>&1 &
        echo $! > ../logs/hardhat.pid
        cd ..
        sleep 3
        echo -e "${GREEN}✅ Hardhat 节点已启动${NC}"
    fi
    
    # 部署合约
    echo "📜 部署智能合约..."
    cd contracts
    CONTRACT_OUTPUT=$(npx hardhat run scripts/deployV3.ts --network localhost 2>&1)
    echo "$CONTRACT_OUTPUT"
    CONTRACT_ADDRESS=$(echo "$CONTRACT_OUTPUT" | grep "deployed to:" | awk '{print $NF}')
    cd ..
    
    if [ ! -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${GREEN}✅ 合约部署成功: $CONTRACT_ADDRESS${NC}"
        
        # 更新后端配置
        if [ -f backend/.env ]; then
            sed -i.bak "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" backend/.env
            echo -e "${GREEN}✅ 后端配置已更新${NC}"
        fi
        
        # 更新前端配置
        if [ -f frontend/src/AppV3.tsx ]; then
            sed -i.bak "s/const CONTRACT_ADDRESS = \".*\"/const CONTRACT_ADDRESS = \"$CONTRACT_ADDRESS\"/" frontend/src/AppV3.tsx
            echo -e "${GREEN}✅ 前端配置已更新${NC}"
        fi
    fi
    
    # 启动后端
    if ! check_backend; then
        echo "🔧 启动后端服务..."
        mkdir -p logs
        cd backend
        go run cmd/api/main.go > ../logs/backend.log 2>&1 &
        echo $! > ../logs/backend.pid
        cd ..
        sleep 2
        echo -e "${GREEN}✅ 后端服务已启动${NC}"
    fi
    
    # 启动前端
    if ! check_frontend; then
        echo "🎨 启动前端服务..."
        cd frontend
        npm run dev > ../logs/frontend.log 2>&1 &
        echo $! > ../logs/frontend.pid
        cd ..
        sleep 2
        echo -e "${GREEN}✅ 前端服务已启动${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ 所有服务已启动！${NC}"
    echo ""
    echo "📊 服务地址："
    echo "  - 前端: http://localhost:5173"
    echo "  - 后端: http://localhost:8080"
    echo "  - 区块链: http://localhost:8545"
    echo ""
    echo "📝 日志文件："
    echo "  - Hardhat: logs/hardhat.log"
    echo "  - 后端: logs/backend.log"
    echo "  - 前端: logs/frontend.log"
    echo ""
}

# 检查服务状态
check_status() {
    echo ""
    echo "📊 检查服务状态..."
    echo ""
    
    check_hardhat
    check_backend
    check_frontend
    
    echo ""
}

# 停止所有服务
stop_all() {
    echo ""
    echo "🛑 停止所有服务..."
    echo ""
    
    # 停止前端
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm logs/frontend.pid
        echo -e "${GREEN}✅ 前端服务已停止${NC}"
    fi
    
    # 停止后端
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm logs/backend.pid
        echo -e "${GREEN}✅ 后端服务已停止${NC}"
    fi
    
    # 停止 Hardhat
    if [ -f logs/hardhat.pid ]; then
        kill $(cat logs/hardhat.pid) 2>/dev/null || true
        rm logs/hardhat.pid
        echo -e "${GREEN}✅ Hardhat 节点已停止${NC}"
    fi
    
    echo ""
}

# 查看日志
view_logs() {
    echo ""
    echo "📝 选择要查看的日志："
    echo "1) Hardhat 节点"
    echo "2) 后端服务"
    echo "3) 前端服务"
    echo "4) 全部日志"
    echo ""
    read -p "请输入选项 [1-4]: " log_choice
    
    case $log_choice in
        1)
            tail -f logs/hardhat.log
            ;;
        2)
            tail -f logs/backend.log
            ;;
        3)
            tail -f logs/frontend.log
            ;;
        4)
            tail -f logs/*.log
            ;;
        *)
            echo "无效选项"
            ;;
    esac
}

# 运行测试
run_tests() {
    echo ""
    echo "🧪 运行测试..."
    echo ""
    
    # 合约测试
    echo "📜 测试智能合约..."
    cd contracts
    npx hardhat test || true
    cd ..
    
    # 后端测试
    echo "🔧 测试后端..."
    cd backend
    go test ./... || true
    cd ..
    
    echo ""
    echo -e "${GREEN}✅ 测试完成${NC}"
    echo ""
}

# 创建日志目录
mkdir -p logs

# 主循环
while true; do
    show_menu
    
    case $choice in
        1)
            full_deploy
            ;;
        2)
            start_all
            ;;
        3)
            check_status
            ;;
        4)
            run_tests
            ;;
        5)
            stop_all
            ;;
        6)
            view_logs
            ;;
        0)
            echo "👋 再见！"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选项${NC}"
            ;;
    esac
    
    read -p "按回车键继续..."
done


