# ChainVault Backend

Go 后端服务，负责：
- 监听链上事件
- 索引数据到 PostgreSQL
- 提供 REST API

## 快速开始

### 1. 启动 PostgreSQL

使用 Docker Compose：

```bash
docker-compose up -d
```

或手动安装 PostgreSQL，创建数据库：

```sql
CREATE DATABASE chainvault;
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/chainvault?sslmode=disable
ETH_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
START_BLOCK=0
```

**重要**：`CONTRACT_ADDRESS` 需要填写部署后的合约地址。

### 3. 安装依赖

```bash
go mod tidy
```

### 4. 运行服务

```bash
go run cmd/api/main.go
```

服务会在 `http://localhost:8080` 启动。

## API 端点

### GET /health
健康检查

### GET /assets
获取资产列表

查询参数：
- `limit` (默认: 20, 最大: 100)
- `offset` (默认: 0)
- `owner` (可选，筛选特定所有者的资产)

示例：
```bash
curl http://localhost:8080/assets?limit=10&offset=0
```

### GET /assets/:id
获取特定资产详情

示例：
```bash
curl http://localhost:8080/assets/1
```

### GET /stats
获取统计信息

示例：
```bash
curl http://localhost:8080/stats
```

## 事件监听

后端会自动监听链上的 `AssetRegistered` 事件，并将数据保存到数据库。

监听器会在服务启动时自动开始工作，如果 `CONTRACT_ADDRESS` 未设置，监听器会被禁用。

## 数据库结构

GORM 会自动创建表结构。主要表：

- `assets`: 资产表
  - `id`: 资产 ID（主键）
  - `owner`: 所有者地址
  - `name`: 资产名称
  - `created_at`: 创建时间
  - `tx_hash`: 交易哈希
  - `block_num`: 区块号

## 开发

### 项目结构

```
backend/
├── cmd/api/           # 应用入口
├── internal/
│   ├── api/           # HTTP 处理器
│   ├── service/       # 业务逻辑层
│   ├── repository/    # 数据访问层
│   ├── model/         # 数据模型
│   ├── chain/         # 区块链客户端
│   ├── listener/      # 事件监听器
│   ├── database/      # 数据库连接
│   └── config/        # 配置管理
├── migrations/        # 数据库迁移脚本
└── docker-compose.yml # PostgreSQL 配置
```

## 故障排查

### 数据库连接失败
- 检查 PostgreSQL 是否运行
- 检查 `DATABASE_URL` 是否正确
- 检查数据库是否存在

### 事件监听不工作
- 检查 `CONTRACT_ADDRESS` 是否设置
- 检查 `ETH_RPC_URL` 是否可访问
- 检查 Hardhat 节点是否运行
- 查看日志输出

### 端口被占用
修改 `cmd/api/main.go` 中的端口号，或使用环境变量。

