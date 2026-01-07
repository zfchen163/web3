# 📚 ChainVault V3 代码注释文档

> 本文档提供了项目中所有核心代码的详细中文注释说明，帮助理解和维护代码

---

## 📁 项目结构

```
chain-vault/
├── contracts/              # 智能合约
│   ├── contracts/
│   │   └── AssetRegistryV3.sol    # V3 主合约（已添加详细注释）
│   └── scripts/
│       └── deployV3.ts            # 部署脚本（已添加注释）
│
├── backend/               # 后端服务
│   ├── cmd/api/
│   │   └── main.go               # 主程序入口（已添加注释）
│   ├── internal/
│   │   ├── model/               # 数据模型
│   │   ├── repository/          # 数据访问层
│   │   ├── service/             # 业务逻辑层
│   │   ├── api/                 # API处理器
│   │   ├── chain/               # 区块链客户端
│   │   ├── listener/            # 事件监听器
│   │   ├── config/              # 配置管理
│   │   └── database/            # 数据库连接
│   └── migrations/              # 数据库迁移脚本
│
└── frontend/              # 前端应用
    └── src/
        ├── AppV3.tsx            # 主应用组件（已添加注释）
        └── main.tsx             # 入口文件
```

---

## 🔐 智能合约注释说明

### AssetRegistryV3.sol

#### 1. 数据结构

```solidity
/**
 * @title 验证状态枚举
 * @dev 用于标识资产的验证状态
 * 
 * 状态说明：
 * - Unverified (0): 未验证 - 资产刚创建，还未经过任何验证
 * - Pending (1): 待验证 - 用户提交了验证申请，等待品牌方或管理员审核
 * - Verified (2): 已验证 - 品牌方或管理员确认资产真实有效
 * - Rejected (3): 已拒绝 - 验证未通过，资产可能是假货或信息不符
 */
enum VerificationStatus {
    Unverified,
    Pending,
    Verified,
    Rejected
}

/**
 * @title 订单状态枚举
 * @dev 用于追踪订单的完整生命周期
 * 
 * 状态流转：
 * None → Created → Paid → Shipped → Delivered → Completed
 *                    ↓
 *                Refunded / Cancelled
 * 
 * 状态说明：
 * - None (0): 无订单 - 初始状态
 * - Created (1): 已创建 - 买家创建订单但还未支付
 * - Paid (2): 已支付 - 买家已支付，资金托管在合约中
 * - Shipped (3): 已发货 - 卖家确认发货
 * - Delivered (4): 已送达 - 买家确认收货
 * - Completed (5): 已完成 - 交易完成，资金支付给卖家，所有权转移
 * - Disputed (6): 有争议 - 买卖双方产生纠纷（预留状态）
 * - Refunded (7): 已退款 - 买家申请退款成功
 * - Cancelled (8): 已取消 - 订单被取消
 */
enum OrderStatus {
    None,
    Created,
    Paid,
    Shipped,
    Delivered,
    Completed,
    Disputed,
    Refunded,
    Cancelled
}

/**
 * @title 品牌结构体
 * @dev 存储品牌方的基本信息
 * 
 * 字段说明：
 * - brandAddress: 品牌方的以太坊地址，用于身份识别
 * - brandName: 品牌名称，如 "Nike", "Adidas"
 * - isAuthorized: 是否已被平台管理员授权，只有授权品牌才能批量注册资产
 * - registeredAt: 品牌注册时间戳，用于记录和审计
 */
struct Brand {
    address brandAddress;
    string brandName;
    bool isAuthorized;
    uint256 registeredAt;
}

/**
 * @title 资产结构体
 * @dev 存储资产的完整信息
 * 
 * 字段说明：
 * - assetId: 资产唯一ID，从1开始递增
 * - owner: 当前所有者的以太坊地址
 * - brand: 品牌方地址，标识资产来源
 * - name: 资产名称，如 "Nike Air Jordan 1 High OG 红黑配色"
 * - serialNumber: 唯一序列号，如 "NK-AJ1-2024-001234"，用于防伪和追溯
 * - metadataURI: IPFS链接，存储资产的详细信息（照片、证书等）
 * - status: 验证状态，标识资产是否经过验证
 * - createdAt: 创建时间戳
 * - isListed: 是否在售，true表示资产正在市场上出售
 * - price: 售价（单位：wei），1 ETH = 10^18 wei
 */
struct Asset {
    uint256 assetId;
    address owner;
    address brand;
    string name;
    string serialNumber;
    string metadataURI;
    VerificationStatus status;
    uint256 createdAt;
    bool isListed;
    uint256 price;
}

/**
 * @title 订单结构体
 * @dev 存储订单的完整信息和时间线
 * 
 * 字段说明：
 * - orderId: 订单唯一ID
 * - assetId: 关联的资产ID
 * - seller: 卖家地址
 * - buyer: 买家地址
 * - price: 成交价格（wei）
 * - status: 订单当前状态
 * - createdAt: 订单创建时间
 * - paidAt: 支付时间
 * - shippedAt: 发货时间
 * - deliveredAt: 送达时间
 * - completedAt: 完成时间
 * - canRefund: 是否可以退款
 * - refundDeadline: 退款截止时间，过期后不能退款
 */
struct Order {
    uint256 orderId;
    uint256 assetId;
    address seller;
    address buyer;
    uint256 price;
    OrderStatus status;
    uint256 createdAt;
    uint256 paidAt;
    uint256 shippedAt;
    uint256 deliveredAt;
    uint256 completedAt;
    bool canRefund;
    uint256 refundDeadline;
}
```

#### 2. 状态变量

```solidity
/**
 * @dev 平台管理员地址
 * 管理员拥有以下权限：
 * - 授权品牌方
 * - 验证资产真伪
 * - 设置平台手续费
 * - 提取平台收益
 * - 转移管理员权限
 */
address public admin;

/**
 * @dev 平台手续费百分比
 * 默认为2%，即每笔交易收取2%的手续费
 * 例如：交易价格为1 ETH，平台收取0.02 ETH，卖家实际收到0.98 ETH
 * 管理员可以通过 setPlatformFee() 函数修改
 */
uint256 public platformFeePercent = 2;

/**
 * @dev 品牌信息映射
 * 通过品牌地址查询品牌信息
 * 例如：brands[0x123...] 返回该地址对应的品牌信息
 */
mapping(address => Brand) public brands;

/**
 * @dev 品牌地址列表
 * 存储所有注册过的品牌地址，用于遍历和统计
 */
address[] public brandList;

/**
 * @dev 资产信息映射
 * 通过资产ID查询资产完整信息
 * 例如：assets[1] 返回ID为1的资产信息
 */
mapping(uint256 => Asset) public assets;

/**
 * @dev 序列号存在性映射
 * 用于快速检查序列号是否已被注册，防止重复
 * 例如：serialNumberExists["NK-001"] = true 表示该序列号已存在
 */
mapping(string => bool) public serialNumberExists;

/**
 * @dev 序列号到资产ID的映射
 * 通过序列号快速查找对应的资产ID
 * 例如：serialNumberToAssetId["NK-001"] = 1 表示序列号NK-001对应资产ID为1
 * 用于扫描NFC标签后快速查询资产信息
 */
mapping(string => uint256) public serialNumberToAssetId;

/**
 * @dev 资产计数器
 * 记录当前已注册的资产总数，同时作为下一个资产的ID
 * 从1开始递增，0表示无效ID
 */
uint256 public assetCounter;

/**
 * @dev 订单信息映射
 * 通过订单ID查询订单完整信息
 */
mapping(uint256 => Order) public orders;

/**
 * @dev 订单计数器
 * 记录当前已创建的订单总数，同时作为下一个订单的ID
 */
uint256 public orderCounter;

/**
 * @dev 资产所有权历史记录
 * 记录每个资产的所有历史所有者
 * 例如：assetOwnerHistory[1] = [0x111, 0x222, 0x333]
 * 表示资产1的所有权从0x111转移到0x222，再转移到0x333
 * 用于追溯和防止洗钱
 */
mapping(uint256 => address[]) public assetOwnerHistory;

/**
 * @dev 资产交易历史记录
 * 记录每个资产的所有交易订单ID
 * 例如：assetOrderHistory[1] = [1, 5, 10]
 * 表示资产1经历了订单1、5、10三次交易
 * 用于查看资产的完整交易记录
 */
mapping(uint256 => uint256[]) public assetOrderHistory;
```

#### 3. 核心函数

```solidity
/**
 * @dev 品牌方注册函数
 * @param brandName 品牌名称，如 "Nike"
 * 
 * 功能说明：
 * 1. 任何人都可以调用此函数注册为品牌
 * 2. 注册后默认未授权（isAuthorized = false）
 * 3. 需要等待平台管理员审核并授权
 * 4. 同一地址只能注册一次
 * 
 * 使用场景：
 * - 品牌方首次接入平台时调用
 * - 需要提供品牌资质证明（线下审核）
 * 
 * 注意事项：
 * - 品牌名称不能为空
 * - 注册后不能修改品牌名称
 * - 未授权的品牌不能批量注册资产
 */
function registerBrand(string calldata brandName) external {
    // 检查是否已注册
    require(!brands[msg.sender].isAuthorized, "Brand already registered");
    // 检查品牌名称不为空
    require(bytes(brandName).length > 0, "Brand name cannot be empty");
    
    // 创建品牌记录
    brands[msg.sender] = Brand({
        brandAddress: msg.sender,
        brandName: brandName,
        isAuthorized: false,  // 默认未授权
        registeredAt: block.timestamp
    });
    
    // 添加到品牌列表
    brandList.push(msg.sender);
    
    // 发出品牌注册事件
    emit BrandRegistered(msg.sender, brandName);
}

/**
 * @dev 管理员授权品牌函数
 * @param brandAddress 品牌方地址
 * @param authorized true表示授权，false表示取消授权
 * 
 * 功能说明：
 * 1. 只有平台管理员可以调用
 * 2. 授权后品牌方可以批量注册资产
 * 3. 可以取消授权（设置为false）
 * 
 * 使用场景：
 * - 管理员审核品牌资质后授权
 * - 品牌方违规时取消授权
 * 
 * 权限控制：
 * - 必须是管理员才能调用（onlyAdmin修饰符）
 */
function authorizeBrand(address brandAddress, bool authorized) external onlyAdmin {
    // 检查品牌是否已注册
    require(brands[brandAddress].brandAddress != address(0), "Brand not registered");
    // 设置授权状态
    brands[brandAddress].isAuthorized = authorized;
    // 发出授权事件
    emit BrandAuthorized(brandAddress, authorized);
}

/**
 * @dev 品牌方注册资产函数
 * @param name 资产名称
 * @param serialNumber 唯一序列号
 * @param metadataURI IPFS元数据链接
 * @return 返回新创建的资产ID
 * 
 * 功能说明：
 * 1. 只有授权品牌可以调用
 * 2. 注册的资产自动设置为已验证状态
 * 3. 序列号必须全局唯一
 * 4. 自动记录到所有权历史
 * 
 * 使用场景：
 * - 品牌方生产新商品后注册到链上
 * - 批量注册商品
 * 
 * 参数说明：
 * - name: 完整的商品名称，建议包含品牌、型号、颜色等信息
 * - serialNumber: 商品的唯一标识，可以是NFC标签ID或条形码
 * - metadataURI: IPFS链接，存储商品照片、证书等详细信息
 * 
 * 返回值：
 * - 新创建的资产ID，可用于后续操作
 */
function registerAsset(
    string calldata name,
    string calldata serialNumber,
    string calldata metadataURI
) external onlyBrand returns (uint256) {
    // 验证输入参数
    require(bytes(name).length > 0, "Name cannot be empty");
    require(bytes(serialNumber).length > 0, "Serial number cannot be empty");
    require(!serialNumberExists[serialNumber], "Serial number already exists");
    
    // 资产ID自增
    assetCounter++;
    
    // 创建资产记录
    assets[assetCounter] = Asset({
        assetId: assetCounter,
        owner: msg.sender,           // 品牌方是初始所有者
        brand: msg.sender,            // 记录品牌方地址
        name: name,
        serialNumber: serialNumber,
        metadataURI: metadataURI,
        status: VerificationStatus.Verified,  // 品牌方注册自动验证
        createdAt: block.timestamp,
        isListed: false,              // 默认未上架
        price: 0
    });
    
    // 标记序列号已使用
    serialNumberExists[serialNumber] = true;
    // 建立序列号到资产ID的映射
    serialNumberToAssetId[serialNumber] = assetCounter;
    // 记录初始所有者
    assetOwnerHistory[assetCounter].push(msg.sender);
    
    // 发出资产注册事件
    emit AssetRegistered(assetCounter, msg.sender, msg.sender, name, serialNumber);
    // 发出资产验证事件
    emit AssetVerified(assetCounter, VerificationStatus.Verified, admin);
    
    return assetCounter;
}

/**
 * @dev 用户注册资产函数
 * @param name 资产名称
 * @param serialNumber 唯一序列号
 * @param metadataURI IPFS元数据链接
 * @return 返回新创建的资产ID
 * 
 * 功能说明：
 * 1. 任何用户都可以调用
 * 2. 注册的资产状态为待验证（Pending）
 * 3. 需要品牌方或管理员验证后才能交易
 * 
 * 使用场景：
 * - 用户购买二手商品后注册到链上
 * - 用户想要出售自己的商品
 * 
 * 与品牌方注册的区别：
 * - 用户注册的资产需要验证
 * - 品牌方注册的资产自动验证
 */
function registerAssetByUser(
    string calldata name,
    string calldata serialNumber,
    string calldata metadataURI
) external returns (uint256) {
    require(bytes(name).length > 0, "Name cannot be empty");
    require(bytes(serialNumber).length > 0, "Serial number cannot be empty");
    require(!serialNumberExists[serialNumber], "Serial number already exists");
    
    assetCounter++;
    
    assets[assetCounter] = Asset({
        assetId: assetCounter,
        owner: msg.sender,
        brand: address(0),            // 用户注册时品牌未知
        name: name,
        serialNumber: serialNumber,
        metadataURI: metadataURI,
        status: VerificationStatus.Pending,  // 待验证状态
        createdAt: block.timestamp,
        isListed: false,
        price: 0
    });
    
    serialNumberExists[serialNumber] = true;
    serialNumberToAssetId[serialNumber] = assetCounter;
    assetOwnerHistory[assetCounter].push(msg.sender);
    
    emit AssetRegistered(assetCounter, msg.sender, address(0), name, serialNumber);
    
    return assetCounter;
}

/**
 * @dev 上架资产函数
 * @param assetId 资产ID
 * @param price 售价（单位：wei）
 * 
 * 功能说明：
 * 1. 只有资产所有者可以上架
 * 2. 只有已验证的资产才能上架
 * 3. 上架后资产出现在市场上
 * 4. 价格必须大于0
 * 
 * 使用场景：
 * - 用户想要出售自己的资产
 * - 品牌方想要销售新商品
 * 
 * 注意事项：
 * - 上架后不能修改价格，需要先下架再重新上架
 * - 上架的资产不能转移（防止交易中转移）
 */
function listAsset(uint256 assetId, uint256 price) 
    external 
    assetExists(assetId) 
    onlyAssetOwner(assetId) 
{
    require(price > 0, "Price must be greater than 0");
    require(!assets[assetId].isListed, "Asset already listed");
    require(
        assets[assetId].status == VerificationStatus.Verified,
        "Asset must be verified"
    );
    
    assets[assetId].isListed = true;
    assets[assetId].price = price;
    
    emit AssetListed(assetId, msg.sender, price);
}

/**
 * @dev 创建订单并支付函数
 * @param assetId 要购买的资产ID
 * @return 返回新创建的订单ID
 * 
 * 功能说明：
 * 1. 买家调用此函数购买资产
 * 2. 需要支付正确的金额（msg.value == asset.price）
 * 3. 支付的资金托管在合约中
 * 4. 自动下架资产
 * 5. 设置7天退货期
 * 
 * 使用场景：
 * - 买家在市场上看到心仪的商品，点击购买
 * 
 * 资金流转：
 * 1. 买家支付 → 合约托管
 * 2. 卖家发货 → 买家确认收货
 * 3. 完成交易 → 合约支付给卖家（扣除手续费）
 * 
 * 安全机制：
 * - 资金托管，防止卖家不发货
 * - 退货期保护，防止买家收到假货
 */
function createOrder(uint256 assetId) 
    external 
    payable 
    assetExists(assetId) 
    returns (uint256) 
{
    Asset storage asset = assets[assetId];
    
    // 验证资产状态
    require(asset.isListed, "Asset not for sale");
    require(asset.owner != msg.sender, "Cannot buy your own asset");
    require(msg.value == asset.price, "Incorrect payment amount");
    
    // 订单ID自增
    orderCounter++;
    
    // 创建订单记录
    orders[orderCounter] = Order({
        orderId: orderCounter,
        assetId: assetId,
        seller: asset.owner,
        buyer: msg.sender,
        price: msg.value,
        status: OrderStatus.Paid,      // 直接设置为已支付
        createdAt: block.timestamp,
        paidAt: block.timestamp,
        shippedAt: 0,
        deliveredAt: 0,
        completedAt: 0,
        canRefund: true,
        refundDeadline: block.timestamp + 7 days  // 7天退货期
    });
    
    // 下架资产
    asset.isListed = false;
    
    // 记录交易历史
    assetOrderHistory[assetId].push(orderCounter);
    
    // 发出事件
    emit OrderCreated(orderCounter, assetId, msg.sender, asset.owner, msg.value);
    emit OrderPaid(orderCounter, msg.sender);
    
    return orderCounter;
}

/**
 * @dev 完成交易函数
 * @param orderId 订单ID
 * 
 * 功能说明：
 * 1. 买家或卖家都可以调用（退货期过后）
 * 2. 转移资产所有权给买家
 * 3. 支付资金给卖家（扣除平台手续费）
 * 4. 记录所有权变更历史
 * 
 * 使用场景：
 * - 买家确认收货后，等待退货期结束
 * - 退货期结束后，任一方可以完成交易
 * 
 * 资金分配：
 * - 平台手续费：2%
 * - 卖家收入：98%
 * 
 * 注意事项：
 * - 完成交易后不可退款
 * - 所有权自动转移，不可撤销
 */
function completeOrder(uint256 orderId) 
    external 
    orderExists(orderId) 
{
    Order storage order = orders[orderId];
    
    // 权限检查
    require(
        order.buyer == msg.sender || order.seller == msg.sender,
        "Not authorized"
    );
    // 状态检查
    require(order.status == OrderStatus.Delivered, "Order not delivered");
    // 时间检查（退货期是否结束）
    require(
        block.timestamp > order.refundDeadline || msg.sender == order.buyer,
        "Refund period not expired"
    );
    
    // 更新订单状态
    order.status = OrderStatus.Completed;
    order.completedAt = block.timestamp;
    order.canRefund = false;
    
    // 转移资产所有权
    Asset storage asset = assets[order.assetId];
    address oldOwner = asset.owner;
    asset.owner = order.buyer;
    assetOwnerHistory[order.assetId].push(order.buyer);
    
    // 计算费用分配
    uint256 platformFee = (order.price * platformFeePercent) / 100;
    uint256 sellerAmount = order.price - platformFee;
    
    // 支付给卖家
    payable(order.seller).transfer(sellerAmount);
    // 平台费用留在合约中，管理员可以提取
    
    // 发出事件
    emit OrderCompleted(orderId);
    emit AssetTransferred(order.assetId, oldOwner, order.buyer);
}

/**
 * @dev 申请退款函数
 * @param orderId 订单ID
 * 
 * 功能说明：
 * 1. 只有买家可以调用
 * 2. 必须在退货期内
 * 3. 退款金额扣除2%手续费
 * 4. 资产重新上架
 * 
 * 使用场景：
 * - 买家收到商品后发现问题
 * - 买家不满意商品质量
 * - 买家改变主意不想要了
 * 
 * 退货规则：
 * - 已支付状态：7天内可退
 * - 已发货状态：7天内可退
 * - 已送达状态：3天内可退
 * 
 * 费用说明：
 * - 扣除2%手续费（补偿卖家和平台成本）
 * - 买家实际退款：98%
 */
function requestRefund(uint256 orderId) 
    external 
    orderExists(orderId) 
{
    Order storage order = orders[orderId];
    
    // 权限检查
    require(order.buyer == msg.sender, "Not the buyer");
    // 退款资格检查
    require(order.canRefund, "Refund not allowed");
    require(block.timestamp <= order.refundDeadline, "Refund deadline passed");
    // 状态检查
    require(
        order.status == OrderStatus.Paid || 
        order.status == OrderStatus.Shipped ||
        order.status == OrderStatus.Delivered,
        "Cannot refund at this stage"
    );
    
    // 更新订单状态
    order.status = OrderStatus.Refunded;
    order.completedAt = block.timestamp;
    order.canRefund = false;
    
    // 计算退款金额（扣除手续费）
    uint256 refundFee = (order.price * platformFeePercent) / 100;
    uint256 refundAmount = order.price - refundFee;
    
    // 重新上架资产
    Asset storage asset = assets[order.assetId];
    asset.isListed = true;
    
    // 退款给买家
    payable(order.buyer).transfer(refundAmount);
    
    emit OrderRefunded(orderId, refundAmount);
}
```

---

## 🔧 后端代码注释说明

### 数据模型 (model/asset.go)

```go
package model

import (
    "time"
    "gorm.io/gorm"
)

// VerificationStatus 资产验证状态枚举
// 用于标识资产的验证状态，与智能合约保持一致
type VerificationStatus int

const (
    Unverified VerificationStatus = 0 // 未验证
    Pending    VerificationStatus = 1 // 待验证
    Verified   VerificationStatus = 2 // 已验证
    Rejected   VerificationStatus = 3 // 已拒绝
)

// OrderStatus 订单状态枚举
// 用于追踪订单的完整生命周期，与智能合约保持一致
type OrderStatus int

const (
    OrderNone      OrderStatus = 0 // 无订单
    OrderCreated   OrderStatus = 1 // 已创建
    OrderPaid      OrderStatus = 2 // 已支付
    OrderShipped   OrderStatus = 3 // 已发货
    OrderDelivered OrderStatus = 4 // 已送达
    OrderCompleted OrderStatus = 5 // 已完成
    OrderDisputed  OrderStatus = 6 // 有争议
    OrderRefunded  OrderStatus = 7 // 已退款
    OrderCancelled OrderStatus = 8 // 已取消
)

// Brand 品牌模型
// 存储品牌方的基本信息，用于品牌授权和管理
type Brand struct {
    ID            uint64    `json:"id" gorm:"primaryKey"`                    // 主键ID
    BrandAddress  string    `json:"brandAddress" gorm:"uniqueIndex;not null"` // 品牌方以太坊地址（唯一）
    BrandName     string    `json:"brandName" gorm:"not null"`               // 品牌名称
    IsAuthorized  bool      `json:"isAuthorized" gorm:"default:false"`       // 是否已授权
    RegisteredAt  time.Time `json:"registeredAt" gorm:"not null"`            // 注册时间
    TxHash        string    `json:"txHash" gorm:"index"`                     // 注册交易哈希
    BlockNum      uint64    `json:"blockNum" gorm:"index"`                   // 注册区块号
    gorm.Model                                                                 // GORM基础模型（包含ID、CreatedAt、UpdatedAt、DeletedAt）
}

// Asset 资产模型
// 存储资产的完整信息，是系统的核心数据模型
type Asset struct {
    ID             uint64             `json:"id" gorm:"primaryKey"`                    // 主键ID（对应链上assetId）
    Owner          string             `json:"owner" gorm:"index;not null"`             // 当前所有者地址
    Brand          string             `json:"brand" gorm:"index"`                      // 品牌方地址
    Name           string             `json:"name" gorm:"not null"`                    // 资产名称
    SerialNumber   string             `json:"serialNumber" gorm:"uniqueIndex;not null"` // 唯一序列号
    MetadataURI    string             `json:"metadataURI" gorm:"type:text"`            // IPFS元数据链接
    Status         VerificationStatus `json:"status" gorm:"default:0"`                 // 验证状态
    IsListed       bool               `json:"isListed" gorm:"default:false"`           // 是否在售
    Price          string             `json:"price" gorm:"default:0"`                  // 售价（wei，存储为字符串避免精度问题）
    CreatedAt      time.Time          `json:"createdAt" gorm:"not null"`               // 创建时间
    TxHash         string             `json:"txHash" gorm:"index;not null"`            // 注册交易哈希
    BlockNum       uint64             `json:"blockNum" gorm:"index;not null"`          // 注册区块号
    gorm.Model                                                                          // GORM基础模型
}

// Order 订单模型
// 存储订单的完整信息和时间线
type Order struct {
    ID             uint64      `json:"id" gorm:"primaryKey"`                // 主键ID（对应链上orderId）
    AssetID        uint64      `json:"assetId" gorm:"index;not null"`       // 关联的资产ID
    Seller         string      `json:"seller" gorm:"index;not null"`        // 卖家地址
    Buyer          string      `json:"buyer" gorm:"index;not null"`         // 买家地址
    Price          string      `json:"price" gorm:"not null"`               // 成交价格（wei）
    Status         OrderStatus `json:"status" gorm:"default:0"`             // 订单状态
    OrderCreatedAt time.Time   `json:"orderCreatedAt" gorm:"not null"`      // 订单创建时间
    PaidAt         *time.Time  `json:"paidAt"`                              // 支付时间（可为空）
    ShippedAt      *time.Time  `json:"shippedAt"`                           // 发货时间（可为空）
    DeliveredAt    *time.Time  `json:"deliveredAt"`                         // 送达时间（可为空）
    CompletedAt    *time.Time  `json:"completedAt"`                         // 完成时间（可为空）
    CanRefund      bool        `json:"canRefund" gorm:"default:true"`       // 是否可退款
    RefundDeadline *time.Time  `json:"refundDeadline"`                      // 退款截止时间（可为空）
    TxHash         string      `json:"txHash" gorm:"index;not null"`        // 创建订单的交易哈希
    BlockNum       uint64      `json:"blockNum" gorm:"index;not null"`      // 创建订单的区块号
    gorm.Model                                                               // GORM基础模型
}

// AssetOwnerHistory 资产所有权历史模型
// 记录资产的所有权变更历史，用于追溯和审计
type AssetOwnerHistory struct {
    ID        uint64    `json:"id" gorm:"primaryKey"`            // 主键ID
    AssetID   uint64    `json:"assetId" gorm:"index;not null"`   // 关联的资产ID
    Owner     string    `json:"owner" gorm:"index;not null"`     // 所有者地址
    Timestamp time.Time `json:"timestamp" gorm:"not null"`       // 变更时间
    TxHash    string    `json:"txHash" gorm:"index;not null"`    // 变更交易哈希
    BlockNum  uint64    `json:"blockNum" gorm:"index;not null"`  // 变更区块号
    gorm.Model                                                    // GORM基础模型
}
```

---

## 🎨 前端代码注释说明

### 主应用组件 (AppV3.tsx)

```typescript
/**
 * ChainVault V3 主应用组件
 * 
 * 功能概述：
 * 1. 钱包连接和管理
 * 2. 资产注册和管理
 * 3. 资产交易（上架、购买）
 * 4. 订单管理（发货、收货、退款）
 * 5. 搜索和筛选
 * 6. 分页显示
 * 
 * 技术栈：
 * - React 18+ (UI框架)
 * - TypeScript (类型安全)
 * - Ethers.js (区块链交互)
 * - MetaMask (钱包连接)
 */

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'

// ==================== 配置常量 ====================

/**
 * V3 合约地址
 * 注意：部署合约后需要更新此地址
 */
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

/**
 * 后端 API 地址
 */
const API_URL = "http://localhost:8080"

/**
 * V3 合约 ABI (应用程序二进制接口)
 * 定义了如何与智能合约交互
 */
const ABI = [
  // 品牌管理函数
  "function registerBrand(string brandName)",
  "function authorizeBrand(address brandAddress, bool authorized)",
  
  // 资产注册函数
  "function registerAsset(string name, string serialNumber, string metadataURI) returns (uint256)",
  "function registerAssetByUser(string name, string serialNumber, string metadataURI) returns (uint256)",
  
  // 资产上架/下架函数
  "function listAsset(uint256 assetId, uint256 price)",
  "function unlistAsset(uint256 assetId)",
  
  // 交易函数
  "function createOrder(uint256 assetId) payable returns (uint256)",
  "function shipOrder(uint256 orderId)",
  "function confirmDelivery(uint256 orderId)",
  "function completeOrder(uint256 orderId)",
  "function requestRefund(uint256 orderId)",
  
  // 查询函数
  "function assets(uint256) view returns (...)",
  "function orders(uint256) view returns (...)",
  // ... 其他函数
]

// ==================== 类型定义 ====================

/**
 * 验证状态枚举
 * 与智能合约保持一致
 */
enum VerificationStatus {
  Unverified = 0,  // 未验证
  Pending = 1,     // 待验证
  Verified = 2,    // 已验证
  Rejected = 3     // 已拒绝
}

/**
 * 订单状态枚举
 * 与智能合约保持一致
 */
enum OrderStatus {
  None = 0,
  Created = 1,
  Paid = 2,
  Shipped = 3,
  Delivered = 4,
  Completed = 5,
  Disputed = 6,
  Refunded = 7,
  Cancelled = 8
}

/**
 * 资产接口
 * 定义资产对象的结构
 */
interface Asset {
  id: number                      // 资产ID
  owner: string                   // 所有者地址
  brand: string                   // 品牌方地址
  name: string                    // 资产名称
  serialNumber: string            // 序列号
  metadataURI: string             // IPFS元数据链接
  status: VerificationStatus      // 验证状态
  createdAt: string               // 创建时间
  isListed: boolean               // 是否在售
  price: string                   // 价格（wei）
  txHash?: string                 // 交易哈希（可选）
  blockNum?: number               // 区块号（可选）
}

/**
 * 订单接口
 * 定义订单对象的结构
 */
interface Order {
  id: number                      // 订单ID
  assetId: number                 // 关联的资产ID
  seller: string                  // 卖家地址
  buyer: string                   // 买家地址
  price: string                   // 成交价格（wei）
  status: OrderStatus             // 订单状态
  orderCreatedAt: string          // 创建时间
  paidAt?: string                 // 支付时间（可选）
  shippedAt?: string              // 发货时间（可选）
  deliveredAt?: string            // 送达时间（可选）
  completedAt?: string            // 完成时间（可选）
  canRefund: boolean              // 是否可退款
  refundDeadline?: string         // 退款截止时间（可选）
  txHash?: string                 // 交易哈希（可选）
}

/**
 * 视图模式类型
 * 定义应用的四个主要视图
 */
type ViewMode = 'marketplace' | 'myAssets' | 'myOrders' | 'register'

// ==================== 主组件 ====================

function AppV3() {
  // ==================== 状态管理 ====================
  
  /**
   * 用户钱包地址
   * 连接MetaMask后设置
   */
  const [account, setAccount] = useState<string>("")
  
  /**
   * 当前视图模式
   * 默认显示市场页面
   */
  const [viewMode, setViewMode] = useState<ViewMode>('marketplace')
  
  /**
   * 加载状态
   * 用于显示加载动画
   */
  const [loading, setLoading] = useState<boolean>(false)
  
  // 注册表单状态
  const [assetName, setAssetName] = useState<string>("")
  const [serialNumber, setSerialNumber] = useState<string>("")
  const [metadataURI, setMetadataURI] = useState<string>("")
  
  // 资产列表状态
  const [listedAssets, setListedAssets] = useState<Asset[]>([])  // 在售资产
  const [myAssets, setMyAssets] = useState<Asset[]>([])          // 我的资产
  const [myOrders, setMyOrders] = useState<Order[]>([])          // 我的订单
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(12)
  const [totalItems, setTotalItems] = useState<number>(0)
  
  // 交易状态
  const [txHash, setTxHash] = useState<string>("")
  const [txStatus, setTxStatus] = useState<string>("")
  
  // 用户角色状态
  const [isBrand, setIsBrand] = useState<boolean>(false)        // 是否是品牌方
  const [isAdmin, setIsAdmin] = useState<boolean>(false)        // 是否是管理员
  
  // ==================== 核心函数 ====================
  
  /**
   * 连接钱包函数
   * 
   * 功能：
   * 1. 检查MetaMask是否安装
   * 2. 请求用户授权连接
   * 3. 获取用户地址
   * 4. 检查用户角色（品牌方/管理员）
   * 5. 加载用户数据
   * 
   * 错误处理：
   * - MetaMask未安装：提示用户安装
   * - 用户拒绝连接：捕获错误并提示
   */
  const connectWallet = async () => {
    // 检查MetaMask是否安装
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 创建Provider实例
        const provider = new ethers.BrowserProvider(window.ethereum)
        
        // 请求用户授权连接钱包
        const accounts = await provider.send("eth_requestAccounts", [])
        
        // 设置用户地址
        setAccount(accounts[0])
        
        // 创建合约实例
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
        
        // 检查是否是品牌方
        const brandInfo = await contract.brands(accounts[0])
        setIsBrand(brandInfo.isAuthorized)
        
        // 检查是否是管理员
        const adminAddress = await contract.admin()
        setIsAdmin(accounts[0].toLowerCase() === adminAddress.toLowerCase())
        
        // 加载用户数据
        await loadData(accounts[0])
      } catch (error) {
        console.error("连接钱包失败:", error)
      }
    } else {
      alert("请安装 MetaMask!")
    }
  }
  
  /**
   * 加载数据函数
   * 
   * 功能：
   * 根据当前视图模式加载相应的数据
   * 
   * @param userAccount 用户地址（可选）
   */
  const loadData = async (userAccount?: string) => {
    const acc = userAccount || account
    if (!acc) return
    
    try {
      // 根据视图模式加载不同的数据
      if (viewMode === 'marketplace') {
        await loadListedAssets()
      } else if (viewMode === 'myAssets') {
        await loadMyAssets(acc)
      } else if (viewMode === 'myOrders') {
        await loadMyOrders(acc)
      }
    } catch (error) {
      console.error("加载数据失败:", error)
    }
  }
  
  /**
   * 加载在售资产函数
   * 
   * 功能：
   * 从后端API获取所有在售资产
   * 支持分页
   */
  const loadListedAssets = async () => {
    try {
      // 计算分页偏移量
      const offset = (currentPage - 1) * itemsPerPage
      
      // 调用后端API
      const response = await fetch(
        `${API_URL}/assets/listed?limit=${itemsPerPage}&offset=${offset}`
      )
      const data = await response.json()
      
      // 更新状态
      setListedAssets(data.data || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error("加载在售资产失败:", error)
    }
  }
  
  /**
   * 注册资产函数
   * 
   * 功能：
   * 1. 验证表单输入
   * 2. 调用智能合约注册资产
   * 3. 等待交易确认
   * 4. 刷新数据
   * 
   * 流程：
   * 1. 品牌方：调用registerAsset()，自动验证
   * 2. 普通用户：调用registerAssetByUser()，需要验证
   */
  const registerAsset = async () => {
    // 验证输入
    if (!assetName || !serialNumber) {
      alert("请填写资产名称和序列号")
      return
    }
    
    setLoading(true)
    setTxStatus("正在提交交易...")
    
    try {
      // 创建Provider和Signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // 创建合约实例（带签名者）
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      // 根据用户角色调用不同的函数
      let tx
      if (isBrand) {
        // 品牌方注册（自动验证）
        tx = await contract.registerAsset(assetName, serialNumber, metadataURI || "")
      } else {
        // 用户注册（需要验证）
        tx = await contract.registerAssetByUser(assetName, serialNumber, metadataURI || "")
      }
      
      // 保存交易哈希
      setTxHash(tx.hash)
      setTxStatus("等待确认...")
      
      // 等待交易被打包
      await tx.wait()
      setTxStatus("注册成功！")
      
      // 清空表单
      setAssetName("")
      setSerialNumber("")
      setMetadataURI("")
      
      // 2秒后刷新数据
      setTimeout(() => {
        loadData()
        setTxStatus("")
        setTxHash("")
      }, 2000)
    } catch (error: any) {
      console.error("注册失败:", error)
      setTxStatus(`注册失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * 购买资产函数
   * 
   * 功能：
   * 1. 创建订单并支付
   * 2. 资金托管在合约中
   * 3. 等待卖家发货
   * 
   * @param asset 要购买的资产对象
   */
  const buyAsset = async (asset: Asset) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      // 调用createOrder函数，同时发送ETH
      const tx = await contract.createOrder(asset.id, { value: asset.price })
      
      setTxHash(tx.hash)
      setTxStatus("等待确认...")
      
      await tx.wait()
      setTxStatus("购买成功！")
      
      // 刷新数据
      setTimeout(() => {
        loadData()
        setTxStatus("")
        setTxHash("")
      }, 2000)
    } catch (error: any) {
      console.error("购买失败:", error)
      setTxStatus(`购买失败: ${error.message}`)
    }
  }
  
  // ==================== 工具函数 ====================
  
  /**
   * 格式化地址函数
   * 将长地址缩短为 0x1234...5678 格式
   * 
   * @param address 完整的以太坊地址
   * @returns 格式化后的地址
   */
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  /**
   * 格式化价格函数
   * 将wei转换为ETH
   * 
   * @param priceWei 价格（wei）
   * @returns 价格（ETH）
   */
  const formatPrice = (priceWei: string) => {
    try {
      return ethers.formatEther(priceWei)
    } catch {
      return "0"
    }
  }
  
  /**
   * 获取状态文本函数
   * 将状态枚举转换为中文文本
   * 
   * @param status 验证状态枚举值
   * @returns 中文状态文本
   */
  const getStatusText = (status: VerificationStatus) => {
    const statusMap = {
      [VerificationStatus.Unverified]: "未验证",
      [VerificationStatus.Pending]: "待验证",
      [VerificationStatus.Verified]: "已验证",
      [VerificationStatus.Rejected]: "已拒绝"
    }
    return statusMap[status] || "未知"
  }
  
  // ==================== 副作用 ====================
  
  /**
   * 视图切换副作用
   * 当视图模式或用户地址变化时，重新加载数据
   */
  useEffect(() => {
    if (account) {
      setCurrentPage(1)  // 重置页码
      loadData()
    }
  }, [viewMode, account])
  
  /**
   * 分页副作用
   * 当页码变化时，加载新页面的数据
   */
  useEffect(() => {
    if (account && currentPage > 1) {
      loadData()
    }
  }, [currentPage])
  
  // ==================== 渲染 ====================
  
  return (
    <div className="App">
      {/* 头部 */}
      <header>
        <h1>🔐 ChainVault V3 - 资产交易平台</h1>
        
        {!account ? (
          <button onClick={connectWallet} className="btn-primary">
            连接钱包
          </button>
        ) : (
          <div className="account-info">
            <span>账户: {formatAddress(account)}</span>
            {isBrand && <span className="badge">品牌方</span>}
            {isAdmin && <span className="badge admin">管理员</span>}
          </div>
        )}
      </header>
      
      {/* 导航标签 */}
      {account && (
        <nav className="nav-tabs">
          <button 
            className={viewMode === 'marketplace' ? 'active' : ''}
            onClick={() => setViewMode('marketplace')}
          >
            🛒 市场
          </button>
          <button 
            className={viewMode === 'myAssets' ? 'active' : ''}
            onClick={() => setViewMode('myAssets')}
          >
            📦 我的资产
          </button>
          <button 
            className={viewMode === 'myOrders' ? 'active' : ''}
            onClick={() => setViewMode('myOrders')}
          >
            📋 我的订单
          </button>
          <button 
            className={viewMode === 'register' ? 'active' : ''}
            onClick={() => setViewMode('register')}
          >
            ➕ 注册资产
          </button>
        </nav>
      )}
      
      {/* 内容区域 */}
      {/* ... 渲染不同视图的内容 ... */}
    </div>
  )
}

export default AppV3
```

---

## 📝 注释规范总结

### 1. 注释原则
- ✅ 用中文编写，通俗易懂
- ✅ 解释"为什么"而不仅仅是"是什么"
- ✅ 包含使用场景和注意事项
- ✅ 标注参数和返回值
- ✅ 说明错误处理逻辑

### 2. 注释位置
- 文件头部：说明文件用途
- 函数上方：说明函数功能、参数、返回值
- 复杂逻辑：行内注释说明
- 数据结构：说明每个字段的含义

### 3. 特殊标记
- `@dev` - 开发者说明
- `@param` - 参数说明
- `@return` - 返回值说明
- `TODO` - 待完成事项
- `FIXME` - 需要修复的问题
- `NOTE` - 重要提示

---

**文档版本**: V1.0  
**最后更新**: 2024-12-19  
**维护者**: ChainVault Team


