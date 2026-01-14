#!/bin/bash

# 一键启动脚本
# 自动启动所有服务：Hardhat 节点、智能合约部署、后端服务、前端服务

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/h/practice/web3/chain-vault"

# 环境变量
export PATH="/Users/h/.nvm/versions/node/v25.1.0/bin:/opt/homebrew/bin:$PATH"
export NVM_DIR="$HOME/.nvm"

echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           🚀 Chain Vault 一键启动脚本 🚀                  ║"
echo "║                                                            ║"
echo "║  自动启动所有服务：                                        ║"
echo "║  1. Hardhat 本地区块链节点                                ║"
echo "║  2. 智能合约部署                                          ║"
echo "║  3. 品牌注册和授权                                        ║"
echo "║  4. 后端 API 服务                                         ║"
echo "║  5. 前端开发服务器                                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查是否在正确的目录
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}❌ 错误：项目目录不存在！${NC}"
    echo -e "${YELLOW}请检查路径：$PROJECT_ROOT${NC}"
    exit 1
fi

cd "$PROJECT_ROOT" || exit 1

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}第 1 步：停止所有旧服务${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

# 停止旧的 Hardhat 节点
echo -e "${YELLOW}🔄 停止旧的 Hardhat 节点...${NC}"
pkill -f "hardhat node" 2>/dev/null || true
lsof -ti:8545 | xargs kill -9 2>/dev/null || true
sleep 1

# 停止旧的后端服务
echo -e "${YELLOW}🔄 停止旧的后端服务...${NC}"
pkill -9 -f "cmd/api/main.go" 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 1

# 停止旧的前端服务
echo -e "${YELLOW}🔄 停止旧的前端服务...${NC}"
pkill -f "vite" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

echo -e "${GREEN}✅ 所有旧服务已停止${NC}"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}第 2 步：启动 Hardhat 本地区块链节点${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

cd "$PROJECT_ROOT/contracts" || exit 1

echo -e "${YELLOW}🔄 正在启动 Hardhat 节点...${NC}"
npx hardhat node > /tmp/hardhat-node.log 2>&1 &
HARDHAT_PID=$!

# 等待 Hardhat 节点启动
echo -e "${YELLOW}⏳ 等待 Hardhat 节点启动（最多 10 秒）...${NC}"
for i in {1..10}; do
    if lsof -ti:8545 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Hardhat 节点已启动（PID: $HARDHAT_PID）${NC}"
        echo -e "${BLUE}📍 RPC 地址：http://127.0.0.1:8545${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! lsof -ti:8545 > /dev/null 2>&1; then
    echo -e "${RED}❌ Hardhat 节点启动失败！${NC}"
    echo -e "${YELLOW}查看日志：tail -f /tmp/hardhat-node.log${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}第 3 步：部署智能合约${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}🔄 正在部署智能合约...${NC}"
sleep 2  # 等待节点完全就绪

DEPLOY_OUTPUT=$(npx hardhat run scripts/deployV3.ts --network localhost 2>&1)
DEPLOY_EXIT_CODE=$?

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ 智能合约部署成功${NC}"
    
    # 提取合约地址
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "0x[a-fA-F0-9]\{40\}" | head -1)
    if [ -n "$CONTRACT_ADDRESS" ]; then
        echo -e "${BLUE}📍 合约地址：$CONTRACT_ADDRESS${NC}"
    fi
else
    echo -e "${RED}❌ 智能合约部署失败！${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}第 4 步：注册并授权品牌${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}🔄 正在注册品牌...${NC}"
sleep 1

BRAND_OUTPUT=$(npx hardhat run scripts/setupBrand.ts --network localhost 2>&1)
BRAND_EXIT_CODE=$?

if [ $BRAND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ 品牌注册和授权成功${NC}"
    echo -e "${BLUE}🏢 品牌名称：Nike${NC}"
    echo -e "${BLUE}📍 品牌地址：0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266${NC}"
    echo -e "${BLUE}✅ 授权状态：已授权${NC}"
else
    echo -e "${RED}❌ 品牌注册失败！${NC}"
    echo "$BRAND_OUTPUT"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}第 5 步：启动后端 API 服务${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

cd "$PROJECT_ROOT/backend" || exit 1

echo -e "${YELLOW}🔄 正在编译后端服务...${NC}"
go build -o main cmd/api/main.go
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 后端编译失败！${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 正在启动后端服务...${NC}"
./main > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# 等待后端服务启动
echo -e "${YELLOW}⏳ 等待后端服务启动（最多 10 秒）...${NC}"
for i in {1..10}; do
    if lsof -ti:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务已启动（PID: $BACKEND_PID）${NC}"
        echo -e "${BLUE}📍 API 地址：http://localhost:8080${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${RED}❌ 后端服务启动失败！${NC}"
    echo -e "${YELLOW}查看日志：tail -f /tmp/backend.log${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}第 6 步：启动前端开发服务器${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

cd "$PROJECT_ROOT/frontend" || exit 1

echo -e "${YELLOW}🔄 正在启动前端服务...${NC}"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端服务启动
echo -e "${YELLOW}⏳ 等待前端服务启动（最多 15 秒）...${NC}"
for i in {1..15}; do
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务已启动（PID: $FRONTEND_PID）${NC}"
        echo -e "${BLUE}📍 前端地址：http://localhost:3000${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ 前端服务启动失败！${NC}"
    echo -e "${YELLOW}查看日志：tail -f /tmp/frontend.log${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    🎉 启动完成！🎉                        ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

echo ""
echo -e "${PURPLE}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${PURPLE}│                     服务状态总览                         │${NC}"
echo -e "${PURPLE}├──────────────────────────────────────────────────────────┤${NC}"
echo -e "${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC}  ${GREEN}✅ Hardhat 节点${NC}      http://127.0.0.1:8545"
echo -e "${PURPLE}│${NC}     PID: $HARDHAT_PID"
echo -e "${PURPLE}│${NC}     日志: tail -f /tmp/hardhat-node.log"
echo -e "${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC}  ${GREEN}✅ 智能合约${NC}          $CONTRACT_ADDRESS"
echo -e "${PURPLE}│${NC}     品牌: Nike (已授权)"
echo -e "${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC}  ${GREEN}✅ 后端 API${NC}          http://localhost:8080"
echo -e "${PURPLE}│${NC}     PID: $BACKEND_PID"
echo -e "${PURPLE}│${NC}     日志: tail -f /tmp/backend.log"
echo -e "${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC}  ${GREEN}✅ 前端服务${NC}          http://localhost:3000"
echo -e "${PURPLE}│${NC}     PID: $FRONTEND_PID"
echo -e "${PURPLE}│${NC}     日志: tail -f /tmp/frontend.log"
echo -e "${PURPLE}│${NC}"
echo -e "${PURPLE}│${NC}  ${GREEN}✅ 数据库${NC}            SQLite (默认)"
echo -e "${PURPLE}│${NC}     文件: backend/chainvault.db"
echo -e "${PURPLE}│${NC}"
echo -e "${PURPLE}└──────────────────────────────────────────────────────────┘${NC}"

echo ""
echo -e "${CYAN}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│                   ⚠️  重要提示 ⚠️                        │${NC}"
echo -e "${CYAN}├──────────────────────────────────────────────────────────┤${NC}"
echo -e "${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  ${YELLOW}1. 重置 MetaMask 账户${NC}"
echo -e "${CYAN}│${NC}     MetaMask → 设置 → 高级 → 重置账户"
echo -e "${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  ${YELLOW}2. 配置 MetaMask 网络${NC}"
echo -e "${CYAN}│${NC}     网络名称: Hardhat Local"
echo -e "${CYAN}│${NC}     RPC URL: http://127.0.0.1:8545"
echo -e "${CYAN}│${NC}     链 ID: 31337"
echo -e "${CYAN}│${NC}     货币符号: ETH"
echo -e "${CYAN}│${NC}"
echo -e "${CYAN}│${NC}  ${YELLOW}3. 导入测试账户${NC}"
echo -e "${CYAN}│${NC}     私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo -e "${CYAN}│${NC}     地址: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo -e "${CYAN}│${NC}     余额: 10000 ETH"
echo -e "${CYAN}│${NC}"
echo -e "${CYAN}└──────────────────────────────────────────────────────────┘${NC}"

echo ""
echo -e "${GREEN}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│                    🚀 开始使用 🚀                        │${NC}"
echo -e "${GREEN}├──────────────────────────────────────────────────────────┤${NC}"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}1.${NC} 打开浏览器访问：${CYAN}http://localhost:3000${NC}"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}2.${NC} 连接 MetaMask 钱包"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}3.${NC} 确认看到 ${PURPLE}\"✨ 品牌方\"${NC} 标签"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}4.${NC} 点击 ${PURPLE}\"✨ 一键填写所有字段\"${NC} 按钮"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}5.${NC} 上传图片"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}6.${NC} 点击 ${PURPLE}\"🚀 注册资产并上架\"${NC}"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}7.${NC} 在 MetaMask 中确认交易"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}│${NC}  ${BLUE}8.${NC} 等待 1-2 秒，查看结果！"
echo -e "${GREEN}│${NC}"
echo -e "${GREEN}└──────────────────────────────────────────────────────────┘${NC}"

echo ""
echo -e "${YELLOW}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│                    📋 常用命令 📋                        │${NC}"
echo -e "${YELLOW}├──────────────────────────────────────────────────────────┤${NC}"
echo -e "${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${CYAN}查看 Hardhat 日志：${NC}"
echo -e "${YELLOW}│${NC}  tail -f /tmp/hardhat-node.log"
echo -e "${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${CYAN}查看后端日志：${NC}"
echo -e "${YELLOW}│${NC}  tail -f /tmp/backend.log"
echo -e "${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${CYAN}查看前端日志：${NC}"
echo -e "${YELLOW}│${NC}  tail -f /tmp/frontend.log"
echo -e "${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${CYAN}停止所有服务：${NC}"
echo -e "${YELLOW}│${NC}  pkill -f \"hardhat node\""
echo -e "${YELLOW}│${NC}  pkill -f \"cmd/api/main.go\""
echo -e "${YELLOW}│${NC}  pkill -f \"vite\""
echo -e "${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${CYAN}重新启动：${NC}"
echo -e "${YELLOW}│${NC}  bash /Users/h/practice/web3/chain-vault/一键启动.sh"
echo -e "${YELLOW}│${NC}"
echo -e "${YELLOW}└──────────────────────────────────────────────────────────┘${NC}"

echo ""
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}                  🎊 祝您使用愉快！🎊                      ${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}"
echo ""

# 保持脚本运行，等待用户中断
echo -e "${CYAN}💡 提示：按 Ctrl+C 可以停止所有服务并退出${NC}"
echo ""

# 等待用户中断
trap "echo -e '\n${YELLOW}🔄 正在停止所有服务...${NC}'; kill $HARDHAT_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '${GREEN}✅ 所有服务已停止${NC}'; exit 0" INT TERM

# 保持脚本运行
wait
