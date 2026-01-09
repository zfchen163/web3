#!/bin/bash

# ChainVault 智能一键修复脚本
# 功能：自动重新部署合约、更新配置、授权品牌、重启服务

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$PROJECT_DIR/contracts"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 杀死占用端口的进程
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        log_info "杀死占用端口 $port 的进程: $pids"
        kill -9 $pids 2>/dev/null || true
        sleep 1
    fi
}

# 启动脚本
echo ""
echo -e "${GREEN}🔧 ChainVault 智能一键修复脚本${NC}"
echo "=================================================="
echo ""

# 1. 检查必要的命令
log_step "检查必要的工具..."
check_command "node"
check_command "npx"
check_command "go"
check_command "lsof"
log_success "所有必要工具已安装"
echo ""

# 2. 检查并启动 Hardhat 节点
log_step "检查 Hardhat 节点状态..."
if check_port 8545; then
    log_success "Hardhat 节点已在运行 (端口 8545)"
else
    log_warning "Hardhat 节点未运行，正在启动..."
    cd "$CONTRACTS_DIR"
    
    # 确保 node_modules 存在
    if [ ! -d "node_modules" ]; then
        log_info "安装 Hardhat 依赖..."
        npm install
    fi
    
    # 后台启动 Hardhat 节点
    nohup npx hardhat node > /tmp/hardhat-node.log 2>&1 &
    HARDHAT_PID=$!
    log_info "Hardhat 节点已启动 (PID: $HARDHAT_PID)"
    
    # 等待节点就绪
    log_info "等待节点就绪..."
    sleep 5
    
    if check_port 8545; then
        log_success "Hardhat 节点启动成功"
    else
        log_error "Hardhat 节点启动失败，请检查日志: /tmp/hardhat-node.log"
        exit 1
    fi
fi
echo ""

# 3. 部署合约
log_step "部署 AssetRegistryV3 合约..."
cd "$CONTRACTS_DIR"

# 编译合约
log_info "编译合约..."
npx hardhat compile > /dev/null 2>&1

# 部署合约并捕获输出
log_info "部署合约到本地网络..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deployV3.ts --network localhost 2>&1)

# 提取合约地址（从 "合约地址:" 行提取）
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "📍 合约地址:" | grep -o "0x[a-fA-F0-9]\{40\}" | head -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    log_error "无法提取合约地址，部署可能失败"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

log_success "合约部署成功！"
echo -e "${GREEN}📍 新合约地址: $CONTRACT_ADDRESS${NC}"
echo ""

# 4. 更新前端配置
log_step "更新前端配置..."
FRONTEND_APP="$FRONTEND_DIR/src/AppV3.tsx"

if [ -f "$FRONTEND_APP" ]; then
    # 使用 sed 替换合约地址
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/const CONTRACT_ADDRESS = \"0x[a-fA-F0-9]\{40\}\"/const CONTRACT_ADDRESS = \"$CONTRACT_ADDRESS\"/" "$FRONTEND_APP"
    else
        # Linux
        sed -i "s/const CONTRACT_ADDRESS = \"0x[a-fA-F0-9]\{40\}\"/const CONTRACT_ADDRESS = \"$CONTRACT_ADDRESS\"/" "$FRONTEND_APP"
    fi
    log_success "前端配置已更新: $FRONTEND_APP"
else
    log_error "前端配置文件不存在: $FRONTEND_APP"
    exit 1
fi
echo ""

# 5. 更新后端配置
log_step "更新后端配置..."
BACKEND_ENV="$BACKEND_DIR/.env"

# 创建或更新 .env 文件
if [ -f "$BACKEND_ENV" ]; then
    # 更新现有的 CONTRACT_ADDRESS
    if grep -q "CONTRACT_ADDRESS=" "$BACKEND_ENV"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" "$BACKEND_ENV"
        else
            sed -i "s/CONTRACT_ADDRESS=.*/CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" "$BACKEND_ENV"
        fi
        log_success "后端配置已更新: $BACKEND_ENV"
    else
        # 添加 CONTRACT_ADDRESS
        echo "CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> "$BACKEND_ENV"
        log_success "后端配置已添加 CONTRACT_ADDRESS: $BACKEND_ENV"
    fi
else
    # 创建新的 .env 文件
    cat > "$BACKEND_ENV" << EOF
# 数据库配置
DATABASE_URL=postgres://postgres:postgres@localhost:5432/chainvault?sslmode=disable

# 以太坊节点配置
ETH_RPC_URL=http://127.0.0.1:8545

# 合约地址
CONTRACT_ADDRESS=$CONTRACT_ADDRESS

# 起始监听区块
START_BLOCK=0
EOF
    log_success "后端配置文件已创建: $BACKEND_ENV"
fi
echo ""

# 6. 更新 setupBrand.ts 中的合约地址
log_step "更新品牌授权脚本..."
SETUP_BRAND_SCRIPT="$CONTRACTS_DIR/scripts/setupBrand.ts"

if [ -f "$SETUP_BRAND_SCRIPT" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/const contractAddress = \"0x[a-fA-F0-9]\{40\}\"/const contractAddress = \"$CONTRACT_ADDRESS\"/" "$SETUP_BRAND_SCRIPT"
    else
        sed -i "s/const contractAddress = \"0x[a-fA-F0-9]\{40\}\"/const contractAddress = \"$CONTRACT_ADDRESS\"/" "$SETUP_BRAND_SCRIPT"
    fi
    log_success "品牌授权脚本已更新"
else
    log_warning "品牌授权脚本不存在: $SETUP_BRAND_SCRIPT"
fi

# 7. 运行品牌授权脚本
log_step "设置品牌授权..."
cd "$CONTRACTS_DIR"

SETUP_OUTPUT=$(npx hardhat run scripts/setupBrand.ts --network localhost 2>&1)

if echo "$SETUP_OUTPUT" | grep -q "品牌设置完成"; then
    log_success "品牌授权完成"
else
    log_warning "品牌授权可能失败，但继续执行"
    echo "$SETUP_OUTPUT"
fi
echo ""

# 8. 重启后端服务
log_step "重启后端服务..."

# 检查后端是否在运行
if check_port 8080; then
    log_info "后端服务正在运行，正在重启..."
    kill_port 8080
    sleep 2
fi

# 启动后端服务
cd "$BACKEND_DIR"

# 确保 Go 依赖已安装
if [ ! -d "vendor" ] && [ ! -f "go.sum" ]; then
    log_info "安装 Go 依赖..."
    go mod download
fi

# 后台启动后端
log_info "启动后端服务..."
nohup go run cmd/api/main.go > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
log_info "后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端就绪
sleep 3

if check_port 8080; then
    log_success "后端服务启动成功 (端口 8080)"
else
    log_warning "后端服务可能未成功启动，请检查日志: /tmp/backend.log"
fi
echo ""

# 9. 完成提示
echo "=================================================="
echo -e "${GREEN}🎉 修复完成！${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 服务状态:${NC}"
echo "  • Hardhat 节点: http://127.0.0.1:8545 ✅"
echo "  • 后端 API: http://localhost:8080 ✅"
echo "  • 合约地址: $CONTRACT_ADDRESS ✅"
echo ""
echo -e "${YELLOW}📋 下一步操作:${NC}"
echo ""
echo "  1️⃣  启动前端服务:"
echo "     cd frontend && npm run dev"
echo ""
echo "  2️⃣  访问应用:"
echo "     http://localhost:3000"
echo ""
echo "  3️⃣  连接 MetaMask:"
echo "     - 网络: Localhost 8545"
echo "     - 账户: 使用 Hardhat 测试账户"
echo "     - 账户地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "  4️⃣  测试资产注册:"
echo "     - 查看是否显示 '✨ 品牌方' 标签"
echo "     - 点击 '注册资产'"
echo "     - 点击 '✨ 一键填写所有字段'"
echo "     - 上传图片并注册"
echo ""
echo -e "${GREEN}📝 日志文件:${NC}"
echo "  • Hardhat 节点: /tmp/hardhat-node.log"
echo "  • 后端服务: /tmp/backend.log"
echo ""
echo "=================================================="
echo ""
