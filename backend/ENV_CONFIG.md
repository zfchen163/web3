# 环境变量配置说明

创建 `.env` 文件（在 `backend/` 目录下），内容如下：

```env
# 数据库配置
# 默认使用 SQLite (chainvault.db)，无需额外配置。
# 如果想使用 MySQL，请使用以下格式:
# DATABASE_URL=root:root@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/chainvault?sslmode=disable

# 以太坊节点配置
ETH_RPC_URL=http://127.0.0.1:8545

# 合约地址（部署后填写，格式: 0x...）
# 如果不设置，事件监听器将被禁用
CONTRACT_ADDRESS=

# 起始监听区块（可选，默认从最新区块开始）
# 设置为 0 表示从当前最新区块开始监听
START_BLOCK=0
```

## 快速配置

```bash
cd backend
cat > .env << EOF
DATABASE_URL=postgres://postgres:postgres@localhost:5432/chainvault?sslmode=disable
ETH_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=你的合约地址
START_BLOCK=0
EOF
```

## 说明

- `DATABASE_URL`: PostgreSQL 连接字符串，默认使用 Docker Compose 中的配置
- `ETH_RPC_URL`: 以太坊节点 RPC 地址，默认是 Hardhat 本地节点
- `CONTRACT_ADDRESS`: **必须设置**，部署合约后获得的地址
- `START_BLOCK`: 可选，设置为 0 表示从最新区块开始监听

