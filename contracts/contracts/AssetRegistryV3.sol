// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AssetRegistryV3
 * @dev 完整的资产注册和交易平台
 * 
 * 核心功能：
 * 1. 品牌方授权管理
 * 2. 序列号唯一性验证
 * 3. 资产验证状态
 * 4. 交易托管（买卖、退货）
 * 5. 完整的生命周期追踪
 */
contract AssetRegistryV3 {
    // ============ 数据结构 ============
    
    enum VerificationStatus {
        Unverified,     // 未验证
        Pending,        // 待验证
        Verified,       // 已验证
        Rejected        // 已拒绝
    }
    
    enum OrderStatus {
        None,           // 无订单
        Created,        // 已创建
        Paid,           // 已支付
        Shipped,        // 已发货
        Delivered,      // 已送达
        Completed,      // 已完成
        Disputed,       // 有争议
        Refunded,       // 已退款
        Cancelled       // 已取消
    }
    
    struct Brand {
        address brandAddress;
        string brandName;
        bool isAuthorized;
        uint256 registeredAt;
    }
    
    struct Asset {
        uint256 assetId;
        address owner;
        address brand;          // 品牌方地址
        string name;
        string serialNumber;    // 唯一序列号
        string metadataURI;     // IPFS 元数据链接（照片等）
        VerificationStatus status;
        uint256 createdAt;
        bool isListed;          // 是否在售
        uint256 price;          // 售价（wei）
    }
    
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
        bool canRefund;         // 是否可退款
        uint256 refundDeadline; // 退款截止时间
    }
    
    // ============ 状态变量 ============
    
    address public admin;
    uint256 public platformFeePercent = 2; // 平台手续费 2%
    
    mapping(address => Brand) public brands;
    address[] public brandList;
    
    mapping(uint256 => Asset) public assets;
    mapping(string => bool) public serialNumberExists;
    mapping(string => uint256) public serialNumberToAssetId;
    uint256 public assetCounter;
    
    mapping(uint256 => Order) public orders;
    uint256 public orderCounter;
    
    mapping(uint256 => address[]) public assetOwnerHistory; // 资产所有权历史
    mapping(uint256 => uint256[]) public assetOrderHistory; // 资产交易历史
    
    // ============ 事件 ============
    
    event BrandRegistered(address indexed brandAddress, string brandName);
    event BrandAuthorized(address indexed brandAddress, bool isAuthorized);
    
    event AssetRegistered(
        uint256 indexed assetId,
        address indexed owner,
        address indexed brand,
        string name,
        string serialNumber
    );
    
    event AssetVerified(
        uint256 indexed assetId,
        VerificationStatus status,
        address verifier
    );
    
    event AssetListed(
        uint256 indexed assetId,
        address indexed seller,
        uint256 price
    );
    
    event AssetUnlisted(uint256 indexed assetId);
    
    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed assetId,
        address indexed buyer,
        address seller,
        uint256 price
    );
    
    event OrderPaid(uint256 indexed orderId, address indexed buyer);
    event OrderShipped(uint256 indexed orderId);
    event OrderDelivered(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId);
    event OrderRefunded(uint256 indexed orderId, uint256 refundAmount);
    event OrderCancelled(uint256 indexed orderId);
    
    event AssetTransferred(
        uint256 indexed assetId,
        address indexed from,
        address indexed to
    );
    
    // ============ 修饰符 ============
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyBrand() {
        require(brands[msg.sender].isAuthorized, "Not an authorized brand");
        _;
    }
    
    modifier onlyAssetOwner(uint256 assetId) {
        require(assets[assetId].owner == msg.sender, "Not the asset owner");
        _;
    }
    
    modifier assetExists(uint256 assetId) {
        require(assetId > 0 && assetId <= assetCounter, "Asset does not exist");
        _;
    }
    
    modifier orderExists(uint256 orderId) {
        require(orderId > 0 && orderId <= orderCounter, "Order does not exist");
        _;
    }
    
    // ============ 构造函数 ============
    
    constructor() {
        admin = msg.sender;
    }
    
    // ============ 品牌管理 ============
    
    /**
     * @dev 品牌方注册
     */
    function registerBrand(string calldata brandName) external {
        require(!brands[msg.sender].isAuthorized, "Brand already registered");
        require(bytes(brandName).length > 0, "Brand name cannot be empty");
        
        brands[msg.sender] = Brand({
            brandAddress: msg.sender,
            brandName: brandName,
            isAuthorized: false, // 需要管理员授权
            registeredAt: block.timestamp
        });
        
        brandList.push(msg.sender);
        
        emit BrandRegistered(msg.sender, brandName);
    }
    
    /**
     * @dev 管理员授权品牌
     */
    function authorizeBrand(address brandAddress, bool authorized) external onlyAdmin {
        require(brands[brandAddress].brandAddress != address(0), "Brand not registered");
        brands[brandAddress].isAuthorized = authorized;
        emit BrandAuthorized(brandAddress, authorized);
    }
    
    /**
     * @dev 获取所有品牌
     */
    function getAllBrands() external view returns (address[] memory) {
        return brandList;
    }
    
    // ============ 资产注册 ============
    
    /**
     * @dev 品牌方注册资产（带序列号）
     */
    function registerAsset(
        string calldata name,
        string calldata serialNumber,
        string calldata metadataURI
    ) external onlyBrand returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(serialNumber).length > 0, "Serial number cannot be empty");
        require(!serialNumberExists[serialNumber], "Serial number already exists");
        
        assetCounter++;
        
        assets[assetCounter] = Asset({
            assetId: assetCounter,
            owner: msg.sender,
            brand: msg.sender,
            name: name,
            serialNumber: serialNumber,
            metadataURI: metadataURI,
            status: VerificationStatus.Verified, // 品牌方注册自动验证
            createdAt: block.timestamp,
            isListed: false,
            price: 0
        });
        
        serialNumberExists[serialNumber] = true;
        serialNumberToAssetId[serialNumber] = assetCounter;
        assetOwnerHistory[assetCounter].push(msg.sender);
        
        emit AssetRegistered(assetCounter, msg.sender, msg.sender, name, serialNumber);
        emit AssetVerified(assetCounter, VerificationStatus.Verified, admin);
        
        return assetCounter;
    }
    
    /**
     * @dev 用户注册资产（需要验证）
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
            brand: address(0), // 用户注册，品牌未知
            name: name,
            serialNumber: serialNumber,
            metadataURI: metadataURI,
            status: VerificationStatus.Pending, // 待验证
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
     * @dev 验证资产（管理员或品牌方）
     */
    function verifyAsset(
        uint256 assetId,
        VerificationStatus newStatus,
        address brandAddress
    ) external assetExists(assetId) {
        require(
            msg.sender == admin || brands[msg.sender].isAuthorized,
            "Not authorized to verify"
        );
        require(
            newStatus == VerificationStatus.Verified || 
            newStatus == VerificationStatus.Rejected,
            "Invalid status"
        );
        
        assets[assetId].status = newStatus;
        
        if (newStatus == VerificationStatus.Verified && brandAddress != address(0)) {
            assets[assetId].brand = brandAddress;
        }
        
        emit AssetVerified(assetId, newStatus, msg.sender);
    }
    
    // ============ 资产上架/下架 ============
    
    /**
     * @dev 上架资产
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
     * @dev 下架资产
     */
    function unlistAsset(uint256 assetId) 
        external 
        assetExists(assetId) 
        onlyAssetOwner(assetId) 
    {
        require(assets[assetId].isListed, "Asset not listed");
        
        assets[assetId].isListed = false;
        assets[assetId].price = 0;
        
        emit AssetUnlisted(assetId);
    }
    
    // ============ 交易流程 ============
    
    /**
     * @dev 创建订单并支付
     */
    function createOrder(uint256 assetId) 
        external 
        payable 
        assetExists(assetId) 
        returns (uint256) 
    {
        Asset storage asset = assets[assetId];
        
        require(asset.isListed, "Asset not for sale");
        require(asset.owner != msg.sender, "Cannot buy your own asset");
        require(msg.value == asset.price, "Incorrect payment amount");
        
        orderCounter++;
        
        orders[orderCounter] = Order({
            orderId: orderCounter,
            assetId: assetId,
            seller: asset.owner,
            buyer: msg.sender,
            price: msg.value,
            status: OrderStatus.Paid,
            createdAt: block.timestamp,
            paidAt: block.timestamp,
            shippedAt: 0,
            deliveredAt: 0,
            completedAt: 0,
            canRefund: true,
            refundDeadline: block.timestamp + 7 days // 7天退货期
        });
        
        // 下架资产
        asset.isListed = false;
        
        assetOrderHistory[assetId].push(orderCounter);
        
        emit OrderCreated(orderCounter, assetId, msg.sender, asset.owner, msg.value);
        emit OrderPaid(orderCounter, msg.sender);
        
        return orderCounter;
    }
    
    /**
     * @dev 卖家发货
     */
    function shipOrder(uint256 orderId) 
        external 
        orderExists(orderId) 
    {
        Order storage order = orders[orderId];
        require(order.seller == msg.sender, "Not the seller");
        require(order.status == OrderStatus.Paid, "Order not paid");
        
        order.status = OrderStatus.Shipped;
        order.shippedAt = block.timestamp;
        
        emit OrderShipped(orderId);
    }
    
    /**
     * @dev 买家确认收货
     */
    function confirmDelivery(uint256 orderId) 
        external 
        orderExists(orderId) 
    {
        Order storage order = orders[orderId];
        require(order.buyer == msg.sender, "Not the buyer");
        require(order.status == OrderStatus.Shipped, "Order not shipped");
        
        order.status = OrderStatus.Delivered;
        order.deliveredAt = block.timestamp;
        order.refundDeadline = block.timestamp + 3 days; // 收货后3天退货期
        
        emit OrderDelivered(orderId);
    }
    
    /**
     * @dev 完成交易（转移资产所有权并支付）
     */
    function completeOrder(uint256 orderId) 
        external 
        orderExists(orderId) 
    {
        Order storage order = orders[orderId];
        require(
            order.buyer == msg.sender || order.seller == msg.sender,
            "Not authorized"
        );
        require(
            order.status == OrderStatus.Delivered,
            "Order not delivered"
        );
        require(
            block.timestamp > order.refundDeadline || msg.sender == order.buyer,
            "Refund period not expired"
        );
        
        order.status = OrderStatus.Completed;
        order.completedAt = block.timestamp;
        order.canRefund = false;
        
        // 转移资产所有权
        Asset storage asset = assets[order.assetId];
        address oldOwner = asset.owner;
        asset.owner = order.buyer;
        assetOwnerHistory[order.assetId].push(order.buyer);
        
        // 计算费用
        uint256 platformFee = (order.price * platformFeePercent) / 100;
        uint256 sellerAmount = order.price - platformFee;
        
        // 支付给卖家
        payable(order.seller).transfer(sellerAmount);
        // 平台费用留在合约中
        
        emit OrderCompleted(orderId);
        emit AssetTransferred(order.assetId, oldOwner, order.buyer);
    }
    
    /**
     * @dev 申请退款
     */
    function requestRefund(uint256 orderId) 
        external 
        orderExists(orderId) 
    {
        Order storage order = orders[orderId];
        require(order.buyer == msg.sender, "Not the buyer");
        require(order.canRefund, "Refund not allowed");
        require(block.timestamp <= order.refundDeadline, "Refund deadline passed");
        require(
            order.status == OrderStatus.Paid || 
            order.status == OrderStatus.Shipped ||
            order.status == OrderStatus.Delivered,
            "Cannot refund at this stage"
        );
        
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
    
    /**
     * @dev 取消订单（仅在支付前）
     */
    function cancelOrder(uint256 orderId) 
        external 
        orderExists(orderId) 
    {
        Order storage order = orders[orderId];
        require(
            order.buyer == msg.sender || order.seller == msg.sender,
            "Not authorized"
        );
        require(order.status == OrderStatus.Created, "Cannot cancel paid order");
        
        order.status = OrderStatus.Cancelled;
        
        // 重新上架资产
        Asset storage asset = assets[order.assetId];
        asset.isListed = true;
        
        emit OrderCancelled(orderId);
    }
    
    // ============ 直接转移（非交易） ============
    
    /**
     * @dev 直接转移资产（赠送等场景）
     */
    function transferAsset(uint256 assetId, address newOwner) 
        external 
        assetExists(assetId) 
        onlyAssetOwner(assetId) 
    {
        require(newOwner != address(0), "Invalid address");
        require(newOwner != msg.sender, "Cannot transfer to yourself");
        require(!assets[assetId].isListed, "Cannot transfer listed asset");
        
        address oldOwner = assets[assetId].owner;
        assets[assetId].owner = newOwner;
        assetOwnerHistory[assetId].push(newOwner);
        
        emit AssetTransferred(assetId, oldOwner, newOwner);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @dev 通过序列号查询资产
     */
    function getAssetBySerialNumber(string calldata serialNumber) 
        external 
        view 
        returns (Asset memory) 
    {
        uint256 assetId = serialNumberToAssetId[serialNumber];
        require(assetId > 0, "Serial number not found");
        return assets[assetId];
    }
    
    /**
     * @dev 获取资产所有权历史
     */
    function getAssetOwnerHistory(uint256 assetId) 
        external 
        view 
        assetExists(assetId) 
        returns (address[] memory) 
    {
        return assetOwnerHistory[assetId];
    }
    
    /**
     * @dev 获取资产交易历史
     */
    function getAssetOrderHistory(uint256 assetId) 
        external 
        view 
        assetExists(assetId) 
        returns (uint256[] memory) 
    {
        return assetOrderHistory[assetId];
    }
    
    /**
     * @dev 获取用户的资产列表
     */
    function getAssetsByOwner(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= assetCounter; i++) {
            if (assets[i].owner == owner) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= assetCounter; i++) {
            if (assets[i].owner == owner) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev 获取在售资产列表
     */
    function getListedAssets() 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= assetCounter; i++) {
            if (assets[i].isListed) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= assetCounter; i++) {
            if (assets[i].isListed) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev 获取用户的订单列表
     */
    function getOrdersByUser(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= orderCounter; i++) {
            if (orders[i].buyer == user || orders[i].seller == user) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= orderCounter; i++) {
            if (orders[i].buyer == user || orders[i].seller == user) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    // ============ 管理员函数 ============
    
    /**
     * @dev 设置平台手续费
     */
    function setPlatformFee(uint256 feePercent) external onlyAdmin {
        require(feePercent <= 10, "Fee too high"); // 最高10%
        platformFeePercent = feePercent;
    }
    
    /**
     * @dev 提取平台费用
     */
    function withdrawPlatformFees() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(admin).transfer(balance);
    }
    
    /**
     * @dev 转移管理员权限
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }
}

