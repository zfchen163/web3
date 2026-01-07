# 🚀 ChainVault V3 部署和使用指南

## 📋 快速开始

### 前置要求

- Node.js >= 16
- Go >= 1.19
- MySQL >= 8.0
- IPFS Desktop 或 IPFS 命令行工具（可选）
- MetaMask 浏览器扩展

---

## 🔧 完整部署流程

### 步骤 1: 启动 Hardhat 本地节点

```bash
cd contracts

# 安装依赖
npm install

# 启动本地节点（保持运行）
npx hardhat node
```

**输出示例：**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts:
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

### 步骤 2: 部署智能合约

**新开一个终端：**

```bash
cd contracts

# 编译合约
npx hardhat compile

# 部署 V3 合约
npx hardhat run scripts/deployV3.ts --network localhost
```

**输出示例：**
```
🚀 Deploying AssetRegistryV3...
📝 Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Account balance: 9999.99 ETH
✅ AssetRegistryV3 deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🔍 Verifying deployment...
👤 Admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💵 Platform Fee: 2%
📦 Total Assets: 0
🛒 Total Orders: 0

📋 Next Steps:
1. Update CONTRACT_ADDRESS in frontend/src/AppV3.tsx
2. Update CONTRACT_ADDRESS in backend/.env
3. Update ABI in frontend and backend

📄 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**⚠️ 重要：复制合约地址！**

### 步骤 3: 配置 MetaMask

1. **添加 Hardhat 网络**：
   - 网络名称：Hardhat Local
   - RPC URL：http://127.0.0.1:8545
   - Chain ID：31337
   - 货币符号：ETH

2. **导入测试账户**：
   - 复制 Hardhat 输出的私钥
   - MetaMask → 导入账户 → 粘贴私钥

3. **验证余额**：
   - 应该显示 10000 ETH

### 步骤 4: 配置数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE chainvault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出
exit

# 运行迁移
cd backend
mysql -u root -p chainvault < migrations/001_init.sql
mysql -u root -p chainvault < migrations/002_v3_upgrade.sql
```

### 步骤 5: 配置后端

```bash
cd backend

# 创建 .env 文件
cat > .env << EOF
# 合约地址（从步骤 2 复制）
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# 以太坊 RPC
ETH_RPC_URL=http://localhost:8545

# 数据库配置
DATABASE_URL=root:your_password@tcp(localhost:3306)/chainvault?charset=utf8mb4&parseTime=True&loc=Local

# IPFS 配置（可选）
IPFS_API_URL=http://localhost:5001/api/v0

# API 端口
PORT=8080
EOF

# 安装依赖
go mod download

# 启动后端（保持运行）
go run cmd/api/main.go
```

**输出示例：**
```
Loaded config: ContractAddress=0x5FbDB2315678afecb367f032d93F642f64180aa3, EthRPCURL=http://localhost:8545
Connected to database
Starting event listener with contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Event listener started, scanning from block 0
API server starting on :8080
```

### 步骤 6: 配置前端

```bash
cd frontend

# 安装依赖
npm install

# 更新 main.tsx
# 将 import App from './App' 改为 import App from './AppV3'
```

**编辑 `src/main.tsx`：**
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './AppV3'  // 改这里
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**更新 `src/AppV3.tsx` 中的合约地址：**
```typescript
// 第 6 行
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"  // 粘贴你的合约地址
```

**启动前端：**
```bash
npm run dev
```

**输出示例：**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 步骤 7: 配置 IPFS（可选）

**方法 1：使用 IPFS Desktop**
1. 下载安装：https://docs.ipfs.tech/install/ipfs-desktop/
2. 启动 IPFS Desktop
3. 默认 API 端口：5001

**方法 2：使用命令行**
```bash
# 安装 IPFS
brew install ipfs  # macOS
# 或下载：https://dist.ipfs.tech/#go-ipfs

# 初始化
ipfs init

# 启动守护进程
ipfs daemon
```

**验证 IPFS：**
```bash
curl http://localhost:5001/api/v0/version
```

---

## 🎯 使用流程

### 场景 1：品牌方注册和授权

#### 1.1 注册品牌

```javascript
// 在浏览器控制台或前端
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// 注册品牌
const tx = await contract.registerBrand("Nike");
await tx.wait();
console.log("品牌注册成功！");
```

#### 1.2 管理员授权品牌

```javascript
// 使用管理员账户（Account #0）
const brandAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account #1
const tx = await contract.authorizeBrand(brandAddress, true);
await tx.wait();
console.log("品牌授权成功！");
```

#### 1.3 验证授权

```javascript
const brandInfo = await contract.brands(brandAddress);
console.log("品牌名称:", brandInfo.brandName);
console.log("是否授权:", brandInfo.isAuthorized);
```

### 场景 2：品牌方注册资产（带照片）

#### 2.1 上传照片到 IPFS

```bash
# 方法 1：使用后端 API
curl -X POST http://localhost:8080/ipfs/upload/image \
  -F "image=@/path/to/shoe-front.jpg"

# 响应：
{
  "hash": "QmXxx...",
  "uri": "ipfs://QmXxx...",
  "url": "https://ipfs.io/ipfs/QmXxx..."
}

# 方法 2：批量上传
curl -X POST http://localhost:8080/ipfs/upload/images \
  -F "images=@shoe-front.jpg" \
  -F "images=@shoe-side.jpg" \
  -F "images=@shoe-sole.jpg"
```

#### 2.2 生成元数据

```bash
curl -X POST http://localhost:8080/ipfs/metadata \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nike Air Jordan 1 High OG",
    "description": "经典复刻配色，全新未穿",
    "serialNumber": "NK-AJ1-2024-001234",
    "brandName": "Nike",
    "brandAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "category": "鞋类",
    "model": "Air Jordan 1 High OG",
    "imageHashes": ["QmXxx1...", "QmXxx2...", "QmXxx3..."]
  }'

# 响应：
{
  "uri": "ipfs://QmMetadata...",
  "url": "https://ipfs.io/ipfs/QmMetadata..."
}
```

#### 2.3 注册资产到链上

```javascript
// 前端或控制台
const tx = await contract.registerAsset(
  "Nike Air Jordan 1 High OG",
  "NK-AJ1-2024-001234",
  "ipfs://QmMetadata..."
);
await tx.wait();
console.log("资产注册成功！");
```

### 场景 3：用户购买流程

#### 3.1 品牌方上架资产

```javascript
const assetId = 1;
const price = ethers.parseEther("0.5"); // 0.5 ETH

const tx = await contract.listAsset(assetId, price);
await tx.wait();
console.log("资产上架成功！");
```

#### 3.2 买家浏览和搜索

**前端操作：**
1. 打开 http://localhost:5173
2. 连接钱包
3. 点击"市场"标签
4. 搜索"Nike"或浏览在售商品

**API 查询：**
```bash
# 获取在售资产
curl http://localhost:8080/assets/listed

# 搜索
curl http://localhost:8080/search?q=Nike

# 通过序列号查询
curl http://localhost:8080/assets/serial/NK-AJ1-2024-001234
```

#### 3.3 买家下单

```javascript
// 切换到买家账户（Account #2）
const assetId = 1;
const asset = await contract.assets(assetId);
const price = asset.price;

const tx = await contract.createOrder(assetId, { value: price });
const receipt = await tx.wait();

// 获取订单 ID
const orderEvent = receipt.logs.find(log => log.fragment.name === 'OrderCreated');
const orderId = orderEvent.args.orderId;
console.log("订单创建成功！订单 ID:", orderId);
```

#### 3.4 卖家发货

```javascript
// 切换回卖家账户
const orderId = 1;
const tx = await contract.shipOrder(orderId);
await tx.wait();
console.log("已发货！");
```

#### 3.5 买家确认收货

```javascript
// 切换到买家账户
const tx = await contract.confirmDelivery(orderId);
await tx.wait();
console.log("已确认收货！");
```

#### 3.6 完成交易

```javascript
// 任一方都可以调用（退货期过后）
const tx = await contract.completeOrder(orderId);
await tx.wait();
console.log("交易完成！资产所有权已转移！");
```

### 场景 4：退货流程

#### 4.1 买家申请退款

```javascript
// 买家在退货期内
const orderId = 1;
const tx = await contract.requestRefund(orderId);
await tx.wait();
console.log("退款成功！");
```

**退款规则：**
- 已支付状态：7天内可退
- 已发货状态：7天内可退
- 已送达状态：3天内可退
- 扣除 2% 手续费

### 场景 5：验证真伪

#### 5.1 扫描 NFC 标签（模拟）

```javascript
// 假设扫描到序列号
const serialNumber = "NK-AJ1-2024-001234";

// 查询链上记录
const asset = await contract.getAssetBySerialNumber(serialNumber);

console.log("资产信息：");
console.log("- 名称:", asset.name);
console.log("- 所有者:", asset.owner);
console.log("- 品牌:", asset.brand);
console.log("- 验证状态:", asset.status); // 2 = Verified
console.log("- 创建时间:", new Date(Number(asset.createdAt) * 1000));
```

#### 5.2 查看所有权历史

```javascript
const assetId = 1;
const history = await contract.getAssetOwnerHistory(assetId);

console.log("所有权历史：");
history.forEach((owner, index) => {
  console.log(`${index + 1}. ${owner}`);
});
```

#### 5.3 查看交易历史

```javascript
const orderIds = await contract.getAssetOrderHistory(assetId);

console.log("交易历史：");
for (const orderId of orderIds) {
  const order = await contract.orders(orderId);
  console.log(`订单 #${orderId}:`, {
    seller: order.seller,
    buyer: order.buyer,
    price: ethers.formatEther(order.price),
    status: order.status
  });
}
```

---

## 📊 数据查询示例

### 查询统计数据

```bash
# 总资产数
curl http://localhost:8080/stats

# 用户的资产
curl http://localhost:8080/assets?owner=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# 用户的订单
curl http://localhost:8080/orders?user=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# 品牌列表
curl http://localhost:8080/brands

# 已授权的品牌
curl http://localhost:8080/brands?authorized=true
```

---

## 🧪 测试脚本

创建一个完整的测试脚本：

```bash
cd chain-vault
cat > test-v3-flow.sh << 'EOF'
#!/bin/bash

echo "🧪 ChainVault V3 完整流程测试"
echo "================================"

# 合约地址
CONTRACT="0x5FbDB2315678afecb367f032d93F642f64180aa3"

# 账户地址（从 Hardhat 输出复制）
ADMIN="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
BRAND="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BUYER="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

echo ""
echo "📋 测试账户："
echo "管理员: $ADMIN"
echo "品牌方: $BRAND"
echo "买家: $BUYER"

echo ""
echo "1️⃣ 测试品牌注册..."
# 这里需要使用 ethers.js 或 cast 命令

echo ""
echo "2️⃣ 测试资产注册..."

echo ""
echo "3️⃣ 测试上架和购买..."

echo ""
echo "4️⃣ 测试交易流程..."

echo ""
echo "5️⃣ 测试 API 查询..."
curl -s http://localhost:8080/assets | jq '.total'
curl -s http://localhost:8080/brands | jq '.total'
curl -s http://localhost:8080/orders?user=$BUYER | jq '.total'

echo ""
echo "✅ 测试完成！"
EOF

chmod +x test-v3-flow.sh
```

---

## 🐛 常见问题

### 1. 合约调用失败

**错误：** "execution reverted"

**解决：**
- 检查账户是否有足够的 ETH
- 检查是否使用了正确的账户（品牌方/管理员）
- 检查资产/订单状态是否符合要求

### 2. 后端连接失败

**错误：** "Failed to connect to database"

**解决：**
```bash
# 检查 MySQL 是否运行
mysql -u root -p -e "SELECT 1"

# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES LIKE 'chainvault'"

# 重新创建数据库
mysql -u root -p < backend/migrations/001_init.sql
mysql -u root -p < backend/migrations/002_v3_upgrade.sql
```

### 3. IPFS 上传失败

**错误：** "Failed to upload to IPFS"

**解决：**
```bash
# 检查 IPFS 是否运行
curl http://localhost:5001/api/v0/version

# 如果没有运行，启动 IPFS
ipfs daemon

# 或使用公共网关（不推荐生产环境）
# 在 backend/.env 中设置：
# IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
```

### 4. MetaMask 交易失败

**错误：** "Nonce too high" 或 "Nonce too low"

**解决：**
1. MetaMask → 设置 → 高级 → 重置账户
2. 清除交易历史

### 5. 事件监听器不同步

**问题：** 链上有交易，但数据库没有数据

**解决：**
```bash
# 重启后端，会自动扫描历史区块
cd backend
go run cmd/api/main.go

# 查看日志
# 应该看到：Event listener started, scanning from block 0
```

---

## 📚 API 完整文档

### 资产 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /assets | 获取资产列表 |
| GET | /assets/:id | 获取资产详情 |
| GET | /assets/serial/:serialNumber | 通过序列号查询 |
| GET | /assets/listed | 获取在售资产 |

### 搜索 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /search?q=keyword | 搜索资产 |

### 品牌 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /brands | 获取品牌列表 |
| GET | /brands/:address | 获取品牌详情 |
| POST | /brands/authorize | 授权品牌（管理员） |

### 订单 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /orders?user=address | 获取用户订单 |
| GET | /orders/:id | 获取订单详情 |
| GET | /orders/asset/:assetId | 获取资产交易历史 |

### IPFS API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /ipfs/upload/image | 上传单张图片 |
| POST | /ipfs/upload/images | 批量上传图片 |
| POST | /ipfs/metadata | 生成元数据 |
| GET | /ipfs/metadata?uri=xxx | 获取元数据 |
| GET | /ipfs/file/:hash | 获取文件 |

---

## 🎉 完成！

现在你已经成功部署了 ChainVault V3！

**下一步：**
1. 测试完整的交易流程
2. 上传真实的商品照片
3. 邀请其他用户测试
4. 部署到测试网（Sepolia/Goerli）
5. 准备生产环境部署

**生产环境建议：**
- 使用 Pinata 或 NFT.Storage 作为 IPFS 服务
- 使用 Infura 或 Alchemy 作为以太坊节点
- 添加 SSL 证书
- 实现用户认证和授权
- 添加监控和日志
- 实现备份策略

---

**文档版本**: V3.0.0  
**最后更新**: 2024-12-19


