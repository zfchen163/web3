# 🔐 ChainVault V3 - 完整的区块链资产交易平台

> 一个具备品牌授权、序列号验证、交易托管、退货机制的完整 Web3 应用

---

## 🎯 项目简介

ChainVault V3 是一个完整的区块链资产注册和交易平台，解决了真实世界中的商品溯源、真伪验证、所有权证明和安全交易等核心问题。

### 核心特性

✅ **品牌授权机制** - 三级授权体系，确保商品来源可信  
✅ **序列号唯一性** - 防止伪造和重复注册  
✅ **完整交易流程** - 上架、购买、发货、收货、完成  
✅ **托管机制** - 保护买卖双方利益  
✅ **退货支持** - 灵活的退货政策和费用机制  
✅ **生命周期追踪** - 完整的所有权和交易历史  
✅ **IPFS 集成** - 去中心化的照片和元数据存储  
✅ **搜索筛选** - 强大的搜索和筛选功能  

---

## 🚀 快速开始

### 方法 1：使用启动脚本（推荐）

```bash
cd chain-vault

# 运行启动脚本
./start-v3.sh

# 选择选项：
# 1 - 完整部署（首次使用）
# 2 - 启动所有服务
```

### 方法 2：手动启动

```bash
# 1. 启动 Hardhat 节点
cd contracts
npx hardhat node

# 2. 部署合约（新终端）
npx hardhat run scripts/deployV3.ts --network localhost

# 3. 启动后端（新终端）
cd backend
go run cmd/api/main.go

# 4. 启动前端（新终端）
cd frontend
npm run dev
```

### 访问应用

- 🎨 前端：http://localhost:5173
- 🔧 后端 API：http://localhost:8080
- ⛓️ 区块链节点：http://localhost:8545

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [V3_IMPLEMENTATION_GUIDE.md](./V3_IMPLEMENTATION_GUIDE.md) | 📖 完整的实现指南和核心问题解答 |
| [V3_DEPLOYMENT_GUIDE.md](./V3_DEPLOYMENT_GUIDE.md) | 🚀 详细的部署步骤和使用流程 |
| [V3_COMPLETE_SUMMARY.md](./V3_COMPLETE_SUMMARY.md) | 📊 功能总结和项目回顾 |

---

## 🏗️ 技术栈

### 智能合约
- **Solidity** ^0.8.20
- **Hardhat** - 开发和测试框架
- **Ethers.js** - 区块链交互

### 后端
- **Go** 1.19+
- **Gin** - Web 框架
- **GORM** - ORM
- **MySQL** 8.0+
- **IPFS** - 去中心化存储

### 前端
- **React** 18+
- **TypeScript**
- **Vite** - 构建工具
- **Ethers.js** - Web3 集成
- **MetaMask** - 钱包连接

---

## 💡 核心功能

### 1. 品牌授权（完全动态，无限制）

```solidity
// 任何人都可以注册品牌（品牌名称完全自定义）
registerBrand("Nike")        // 可以注册 Nike
registerBrand("Adidas")      // 可以注册 Adidas
registerBrand("你的品牌")    // 可以注册任何品牌
registerBrand("李宁")        // 支持中文
registerBrand("🎨 工作室")   // 支持表情符号

// 管理员授权品牌（审核后授权）
authorizeBrand(brandAddress, true)   // 授权
authorizeBrand(brandAddress, false)  // 取消授权

// 注意：品牌不是写死的，可以动态添加无数个品牌！
```

**解决问题**：谁来授权厂家生成序列号？

### 2. 资产注册

```solidity
// 品牌方注册（自动验证）
registerAsset(name, serialNumber, metadataURI)

// 用户注册（需要验证）
registerAssetByUser(name, serialNumber, metadataURI)
```

**解决问题**：序列号唯一性和防伪

### 3. 交易流程

```solidity
// 1. 上架
listAsset(assetId, price)

// 2. 购买
createOrder(assetId) payable

// 3. 发货
shipOrder(orderId)

// 4. 确认收货
confirmDelivery(orderId)

// 5. 完成交易
completeOrder(orderId)
```

**解决问题**：安全的交易流程和托管机制

### 4. 退货机制

```solidity
// 申请退款（扣除 2% 手续费）
requestRefund(orderId)
```

**退货规则**：
- 已支付：7天内可退
- 已发货：7天内可退
- 已送达：3天内可退

### 5. 生命周期追踪

```solidity
// 查看所有权历史
getAssetOwnerHistory(assetId)

// 查看交易历史
getAssetOrderHistory(assetId)
```

**特点**：自动记录，无需人工介入

---

## 🎨 前端功能

### 多视图切换

- 🛒 **市场**：浏览在售商品
- 📦 **我的资产**：管理自己的资产
- 📋 **我的订单**：查看买卖订单
- ➕ **注册资产**：注册新资产

### 搜索和筛选

- 关键词搜索（名称/序列号）
- 状态筛选（验证状态）
- 价格排序
- 分页显示（每页 12 条）

### 交易操作

- 上架/下架资产
- 购买商品
- 发货/收货
- 申请退款
- 转移资产

---

## 🔌 API 端点

### 资产 API

```bash
GET  /assets                      # 资产列表
GET  /assets/:id                  # 资产详情
GET  /assets/serial/:serialNumber # 序列号查询
GET  /assets/listed               # 在售资产
GET  /search?q=keyword            # 搜索
```

### 品牌 API

```bash
GET  /brands                      # 品牌列表
GET  /brands/:address             # 品牌详情
POST /brands/authorize            # 授权品牌
```

### 订单 API

```bash
GET  /orders?user=address         # 用户订单
GET  /orders/:id                  # 订单详情
GET  /orders/asset/:assetId       # 交易历史
```

### IPFS API

```bash
POST /ipfs/upload/image           # 上传图片
POST /ipfs/upload/images          # 批量上传
POST /ipfs/metadata               # 生成元数据
GET  /ipfs/metadata?uri=xxx       # 获取元数据
```

---

## 📊 使用场景

### 场景 1：品牌方注册商品

1. 注册品牌并获得授权
2. 上传商品照片到 IPFS
3. 生成元数据（包含照片、证书等）
4. 注册资产到链上（自动验证）
5. 上架销售

### 场景 2：用户购买商品

1. 浏览市场或搜索商品
2. 查看商品详情和验证状态
3. 下单并支付（资金托管）
4. 等待卖家发货
5. 确认收货
6. 完成交易（所有权转移）

### 场景 3：验证商品真伪

1. 扫描商品 NFC 标签
2. 获取序列号
3. 查询链上记录
4. 验证：
   - 序列号存在 ✅
   - 品牌已授权 ✅
   - 状态已验证 ✅
   - 照片匹配 ✅
   - 所有者正确 ✅

### 场景 4：退货

1. 在退货期内申请退款
2. 自动扣除 2% 手续费
3. 退款到账
4. 商品重新上架

---

## 🧪 测试

### 合约测试

```bash
cd contracts
npx hardhat test
```

### 后端测试

```bash
cd backend
go test ./...
```

### 完整流程测试

```bash
# 使用启动脚本
./start-v3.sh

# 选择选项 4 - 运行测试
```

---

## 📈 项目统计

| 指标 | 数量 |
|------|------|
| 智能合约 | 1 个（AssetRegistryV3） |
| 合约函数 | 30+ |
| 后端 API | 20+ |
| 前端组件 | 1 个主组件 |
| 数据表 | 4 个 |
| 代码行数 | ~3000+ |

---

## 🎯 核心问题解答

### 1. 谁来授权厂家生成序列号？

**答案**：三级授权机制
- 平台管理员授权品牌
- 品牌方注册资产
- 序列号唯一性由合约保证

### 2. NFC 码如何和实物绑定？

**答案**：物理标签 + 链上登记
- 品牌方生产时贴上 NFC 标签
- 标签 ID 作为序列号注册到链上
- 扫描标签即可验证真伪

### 3. 如何验证真伪？

**答案**：多重验证
- 序列号唯一性（合约验证）
- 品牌授权（管理员验证）
- 资产状态（品牌方验证）
- 照片对比（用户判断）

### 4. 是否可以退货？

**答案**：支持退货
- 7天/3天退货期
- 扣除 2% 手续费
- 自动退款

### 5. 如何追溯生命周期？

**答案**：自动追踪
- 所有权历史自动记录
- 交易历史自动记录
- 无需人工介入

---

## 🚧 未来计划

### 短期（1-2周）
- [ ] 完善前端图片上传 UI
- [ ] 优化移动端响应式设计
- [ ] 添加单元测试

### 中期（1个月）
- [ ] 实现推荐算法
- [ ] 添加数据分析面板
- [ ] 优化性能

### 长期（3个月）
- [ ] 部署到测试网
- [ ] 集成真实 NFC 读取
- [ ] 实现 AI 图像识别
- [ ] 开发移动端 App

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

---

## 📄 许可证

MIT License

---

## 📞 联系方式

如有问题或建议，欢迎联系。

---

## 🌟 项目亮点

### 为什么选择 ChainVault V3？

1. **完整的功能** - 不仅是演示，而是可用的产品
2. **真实的场景** - 解决实际的商业问题
3. **优秀的架构** - 分层清晰，易于扩展
4. **详细的文档** - 从部署到使用，一应俱全
5. **简历价值** - 展示全栈和区块链能力

### 技术深度

- ✅ 复杂的智能合约逻辑（托管、状态机）
- ✅ 完整的后端架构（分层设计）
- ✅ 现代化的前端（React + TypeScript）
- ✅ 去中心化存储（IPFS）
- ✅ 事件驱动架构

### 业务价值

- ✅ 防伪溯源
- ✅ 所有权证明
- ✅ 安全交易
- ✅ 退货保障
- ✅ 完整追溯

---

**版本**: V3.0.0  
**状态**: ✅ 核心功能完成  
**最后更新**: 2024-12-19

---

## 🎓 学习资源

- [Solidity 文档](https://docs.soliditylang.org/)
- [Hardhat 文档](https://hardhat.org/docs)
- [Ethers.js 文档](https://docs.ethers.org/)
- [Go 文档](https://golang.org/doc/)
- [React 文档](https://react.dev/)
- [IPFS 文档](https://docs.ipfs.tech/)

---

**开始使用 ChainVault V3，构建你的区块链资产交易平台！** 🚀


