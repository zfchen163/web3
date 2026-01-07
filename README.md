# 🔐 ChainVault V3

> 基于区块链的资产注册和交易平台 - 完整的 Web3 全栈项目

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Go](https://img.shields.io/badge/Go-1.19+-00ADD8)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)](https://www.typescriptlang.org/)

---

## 🎓 新手？从这里开始！

**如果你是 Web3 新手，强烈建议先阅读**：

📖 **[WEB3新手入门指南.md](./WEB3新手入门指南.md)** - 从零开始学习  
🎨 **[图解教程.md](./图解教程.md)** - 用图表理解项目  
⚡ **[开始使用.md](./开始使用.md)** - 3分钟快速启动

---

## 🎯 项目简介

ChainVault V3 是一个完整的区块链资产注册和交易平台，解决了商品溯源、真伪验证、所有权证明和安全交易等核心问题。

### 核心特性

✅ **品牌授权机制** - 三级授权体系，确保商品来源可信  
✅ **序列号唯一性** - 防止伪造和重复注册  
✅ **完整交易流程** - 上架→购买→发货→收货→完成  
✅ **托管机制** - 保护买卖双方利益  
✅ **退货支持** - 7天/3天退货期，扣除2%手续费  
✅ **生命周期追踪** - 完整的所有权和交易历史  
✅ **IPFS 集成** - 去中心化的照片和元数据存储  
✅ **搜索筛选** - 强大的搜索和分页功能  

---

## 🚀 快速开始

### 方法 1：使用启动脚本（推荐）

```bash
# 运行启动脚本
./start-v3.sh

# 选择选项：
# 1 - 完整部署（首次使用）
# 2 - 启动所有服务
```

### 方法 2：手动启动

```bash
# 1. 启动 Hardhat 节点（终端1）
cd contracts
npx hardhat node

# 2. 部署合约（终端2）
npx hardhat run scripts/deployV3.ts --network localhost

# 3. 启动后端（终端3）
cd backend
go run cmd/api/main.go

# 4. 启动前端（终端4）
cd frontend
npm run dev
```

### 访问应用

- 🎨 前端：http://localhost:5173
- 🔧 后端 API：http://localhost:8080
- ⛓️ 区块链节点：http://localhost:8545

---

## 🏗️ 技术栈

### 智能合约
- **Solidity** ^0.8.20 - 智能合约语言
- **Hardhat** - 开发和测试框架
- **Ethers.js** - 区块链交互库

### 后端
- **Go** 1.19+ - 后端语言
- **Gin** - Web 框架
- **GORM** - ORM 框架
- **MySQL** 8.0+ - 数据库
- **IPFS** - 去中心化存储

### 前端
- **React** 18+ - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ethers.js** - Web3 集成
- **MetaMask** - 钱包连接

---

## 💡 核心功能

### 1. 品牌授权（动态添加，无限制）

```solidity
// 任何人都可以注册品牌（不是写死的！）
// 品牌名称可以是任何文字，不限于 Nike

// 示例1：注册 Nike
registerBrand("Nike")

// 示例2：注册 Adidas
registerBrand("Adidas")

// 示例3：注册任何品牌
registerBrand("你的品牌名称")

// 管理员授权品牌（授权后才能批量注册资产）
authorizeBrand(brandAddress, true)

// 管理员也可以取消授权
authorizeBrand(brandAddress, false)
```

**说明**：
- ✅ 任何人都可以注册品牌（调用 `registerBrand()`）
- ✅ 品牌名称完全自定义，没有限制
- ✅ 可以注册无数个品牌
- ⚠️ 注册后需要管理员审核授权
- ✅ 管理员可以随时授权/取消授权

### 2. 资产注册

```solidity
// 品牌方注册（自动验证）
registerAsset(name, serialNumber, metadataURI)

// 用户注册（需要验证）
registerAssetByUser(name, serialNumber, metadataURI)
```

### 3. 交易流程

```solidity
// 1. 上架
listAsset(assetId, price)

// 2. 购买（资金托管）
createOrder(assetId) payable

// 3. 发货
shipOrder(orderId)

// 4. 确认收货
confirmDelivery(orderId)

// 5. 完成交易（所有权转移）
completeOrder(orderId)
```

### 4. 退货机制

```solidity
// 申请退款（扣除 2% 手续费）
requestRefund(orderId)
```

---

## 📚 文档导航

### 🎓 新手必读

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| [WEB3新手入门指南.md](./WEB3新手入门指南.md) | 🎓 从零开始学习 Web3 | ⭐⭐⭐⭐⭐ 新手 |
| [开始使用.md](./开始使用.md) | ⚡ 3分钟快速启动 | 所有人 |
| [V3_DEPLOYMENT_GUIDE.md](./V3_DEPLOYMENT_GUIDE.md) | 🚀 详细部署步骤 | 所有人 |

### 📖 深入了解

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| [V3_README.md](./V3_README.md) | 📖 项目详细介绍 | 所有人 |
| [V3_IMPLEMENTATION_GUIDE.md](./V3_IMPLEMENTATION_GUIDE.md) | 💡 10个核心问题解答 | 开发者 |
| [CODE_DOCUMENTATION.md](./CODE_DOCUMENTATION.md) | 📝 代码注释文档 | 开发者 |

### 🔒 安全和优化

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) | 🔒 安全审计报告 | 开发者 |
| [QUICK_FIX_GUIDE.md](./QUICK_FIX_GUIDE.md) | ⚡ 快速修复指南 | 开发者 |

### 📊 项目状态

| 文档 | 说明 | 适合人群 |
|------|------|---------|
| [REQUIREMENTS_CHECKLIST.md](./REQUIREMENTS_CHECKLIST.md) | ✅ 需求检查清单 | 项目经理 |
| [FINAL_STATUS.md](./FINAL_STATUS.md) | 📊 最终完成状态 | 所有人 |
| [完成报告.md](./完成报告.md) | 🎉 项目完成报告 | 所有人 |

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

参见：[V3_DEPLOYMENT_GUIDE.md](./V3_DEPLOYMENT_GUIDE.md)

---

## 🚨 安全说明

**当前安全评分**: 7.4/10

**已发现的问题**:
- 🔴 重入攻击风险（需要添加 ReentrancyGuard）
- 🟡 权限控制需要加强
- 🟡 价格操纵风险

**修复指南**: 参见 [QUICK_FIX_GUIDE.md](./QUICK_FIX_GUIDE.md)

---

## 📈 项目统计

- **智能合约**: 1 个（703 行）
- **合约函数**: 30+ 个
- **后端 API**: 20+ 个
- **数据表**: 4 个
- **总代码量**: 8500+ 行
- **文档**: 5000+ 行

---

## 🎓 学习价值

通过这个项目，您将学到：

- ✅ Solidity 智能合约开发
- ✅ Go 后端开发
- ✅ React + TypeScript 前端开发
- ✅ Web3 集成（ethers.js）
- ✅ IPFS 去中心化存储
- ✅ 系统架构设计
- ✅ 安全最佳实践

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

---

## 📄 许可证

MIT License

---

## 🌟 项目亮点

### 为什么选择 ChainVault V3？

1. **完整的功能** - 不仅是演示，而是可用的产品
2. **真实的场景** - 解决实际的商业问题
3. **优秀的架构** - 分层清晰，易于扩展
4. **详细的文档** - 从部署到使用，一应俱全
5. **简历价值** - 展示全栈和区块链能力

---

**开始使用 ChainVault V3，构建你的区块链资产交易平台！** 🚀

**版本**: V3.0.0  
**最后更新**: 2024-12-19  
**作者**: ChainVault Team
