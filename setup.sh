#!/bin/bash

# ChainVault 一键设置脚本
# 自动安装依赖、启动数据库、部署合约

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 ChainVault 一键设置脚本${NC}\n"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go 未安装，请先安装 Go${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}\n"

# 1. 安装合约依赖
echo -e "${BLUE}📦 安装合约依赖...${NC}"
cd contracts
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "合约依赖已安装，跳过"
fi
cd ..

# 2. 安装前端依赖
echo -e "${BLUE}📦 安装前端依赖...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "前端依赖已安装，跳过"
fi
cd ..

# 3. 安装 Go 依赖
echo -e "${BLUE}📦 安装 Go 依赖...${NC}"
cd backend
go mod tidy
cd ..

# 4. 启动 PostgreSQL
echo -e "${BLUE}🗄️  启动 PostgreSQL 数据库...${NC}"
cd backend
if docker ps | grep -q chainvault-db; then
    echo "数据库已在运行"
else
    docker-compose up -d
    echo "等待数据库启动..."
    sleep 5
fi
cd ..

echo -e "\n${GREEN}✅ 设置完成！${NC}\n"
echo -e "${YELLOW}下一步：${NC}"
echo "1. 启动 Hardhat 节点: cd contracts && npx hardhat node"
echo "2. 部署合约: cd contracts && npx hardhat run scripts/deploy.ts --network localhost"
echo "3. 配置合约地址:"
echo "   - 前端: 编辑 frontend/src/App.tsx 中的 CONTRACT_ADDRESS"
echo "   - 后端: cd backend && cp .env.example .env && 编辑 .env 设置 CONTRACT_ADDRESS"
echo "4. 启动后端: cd backend && go run cmd/api/main.go"
echo "5. 启动前端: cd frontend && npm run dev"

