#!/bin/bash
echo "更新 .env 文件为 MySQL 配置..."
cat > .env << 'ENVEOF'
DATABASE_URL=chainvault:chainvault@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local
ETH_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
START_BLOCK=0
ENVEOF
echo "✅ .env 文件已更新为 MySQL 配置"
cat .env
