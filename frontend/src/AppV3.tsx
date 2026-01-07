import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import AssetRegistrationForm from './components/AssetRegistrationForm'
import './components/AssetRegistrationForm.css'
import './components/ImageUpload.css'

// V3 合约地址（已部署）
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const API_URL = "http://localhost:8080"

// V3 合约 ABI
const ABI = [
  // 品牌管理
  "function registerBrand(string brandName)",
  "function authorizeBrand(address brandAddress, bool authorized)",
  "function brands(address) view returns (address brandAddress, string brandName, bool isAuthorized, uint256 registeredAt)",
  
  // 资产注册
  "function registerAsset(string name, string serialNumber, string metadataURI) returns (uint256)",
  "function registerAssetByUser(string name, string serialNumber, string metadataURI) returns (uint256)",
  "function verifyAsset(uint256 assetId, uint8 status, address brandAddress)",
  
  // 资产上架/下架
  "function listAsset(uint256 assetId, uint256 price)",
  "function unlistAsset(uint256 assetId)",
  
  // 交易
  "function createOrder(uint256 assetId) payable returns (uint256)",
  "function shipOrder(uint256 orderId)",
  "function confirmDelivery(uint256 orderId)",
  "function completeOrder(uint256 orderId)",
  "function requestRefund(uint256 orderId)",
  "function cancelOrder(uint256 orderId)",
  
  // 转移
  "function transferAsset(uint256 assetId, address newOwner)",
  
  // 查询
  "function assets(uint256) view returns (uint256 assetId, address owner, address brand, string name, string serialNumber, string metadataURI, uint8 status, uint256 createdAt, bool isListed, uint256 price)",
  "function orders(uint256) view returns (uint256 orderId, uint256 assetId, address seller, address buyer, uint256 price, uint8 status, uint256 orderCreatedAt, uint256 paidAt, uint256 shippedAt, uint256 deliveredAt, uint256 completedAt, bool canRefund, uint256 refundDeadline)",
  "function getAssetBySerialNumber(string serialNumber) view returns (tuple(uint256 assetId, address owner, address brand, string name, string serialNumber, string metadataURI, uint8 status, uint256 createdAt, bool isListed, uint256 price))",
  "function getAssetOwnerHistory(uint256 assetId) view returns (address[])",
  "function getAssetOrderHistory(uint256 assetId) view returns (uint256[])",
  "function getAssetsByOwner(address owner) view returns (uint256[])",
  "function getListedAssets() view returns (uint256[])",
  "function getOrdersByUser(address user) view returns (uint256[])",
  "function assetCounter() view returns (uint256)",
  "function orderCounter() view returns (uint256)",
  "function admin() view returns (address)",
  "function platformFeePercent() view returns (uint256)",
  
  // 事件
  "event BrandRegistered(address indexed brandAddress, string brandName)",
  "event BrandAuthorized(address indexed brandAddress, bool isAuthorized)",
  "event AssetRegistered(uint256 indexed assetId, address indexed owner, address indexed brand, string name, string serialNumber)",
  "event AssetVerified(uint256 indexed assetId, uint8 status, address verifier)",
  "event AssetListed(uint256 indexed assetId, address indexed seller, uint256 price)",
  "event AssetUnlisted(uint256 indexed assetId)",
  "event OrderCreated(uint256 indexed orderId, uint256 indexed assetId, address indexed buyer, address seller, uint256 price)",
  "event OrderPaid(uint256 indexed orderId, address indexed buyer)",
  "event OrderShipped(uint256 indexed orderId)",
  "event OrderDelivered(uint256 indexed orderId)",
  "event OrderCompleted(uint256 indexed orderId)",
  "event OrderRefunded(uint256 indexed orderId, uint256 refundAmount)",
  "event OrderCancelled(uint256 indexed orderId)",
  "event AssetTransferred(uint256 indexed assetId, address indexed from, address indexed to)"
]

enum VerificationStatus {
  Unverified = 0,
  Pending = 1,
  Verified = 2,
  Rejected = 3
}

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

interface Asset {
  id: number
  owner: string
  brand: string
  name: string
  serialNumber: string
  metadataURI: string
  status: VerificationStatus
  createdAt: string
  isListed: boolean
  price: string
  txHash?: string
  blockNum?: number
}

interface Order {
  id: number
  assetId: number
  seller: string
  buyer: string
  price: string
  status: OrderStatus
  orderCreatedAt: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  completedAt?: string
  canRefund: boolean
  refundDeadline?: string
  txHash?: string
}

interface Brand {
  brandAddress: string
  brandName: string
  isAuthorized: boolean
  registeredAt: string
}

type ViewMode = 'marketplace' | 'myAssets' | 'myOrders' | 'register'

function AppV3() {
  const [account, setAccount] = useState<string>("")
  const [viewMode, setViewMode] = useState<ViewMode>('marketplace')
  const [loading, setLoading] = useState<boolean>(false)
  
  // 注册相关
  const [assetName, setAssetName] = useState<string>("")
  const [serialNumber, setSerialNumber] = useState<string>("")
  const [metadataURI, setMetadataURI] = useState<string>("")
  
  // 资产列表
  const [assets, setAssets] = useState<Asset[]>([])
  const [listedAssets, setListedAssets] = useState<Asset[]>([])
  const [myAssets, setMyAssets] = useState<Asset[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  
  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  
  // 分页
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(12)
  const [totalItems, setTotalItems] = useState<number>(0)
  
  // 交易状态
  const [txHash, setTxHash] = useState<string>("")
  const [txStatus, setTxStatus] = useState<string>("")
  
  // 品牌信息
  const [isBrand, setIsBrand] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  
  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])
        setAccount(accounts[0])
        
        // 检查是否是品牌方或管理员
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
        const brandInfo = await contract.brands(accounts[0])
        setIsBrand(brandInfo.isAuthorized)
        
        const adminAddress = await contract.admin()
        setIsAdmin(accounts[0].toLowerCase() === adminAddress.toLowerCase())
        
        await loadData(accounts[0])
      } catch (error) {
        console.error("连接钱包失败:", error)
      }
    } else {
      alert("请安装 MetaMask!")
    }
  }
  
  // 加载数据
  const loadData = async (userAccount?: string) => {
    const acc = userAccount || account
    if (!acc) return
    
    try {
      // 从后端 API 加载数据
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
  
  // 加载在售资产
  const loadListedAssets = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const response = await fetch(`${API_URL}/assets/listed?limit=${itemsPerPage}&offset=${offset}`)
      const data = await response.json()
      setListedAssets(data.data || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error("加载在售资产失败:", error)
    }
  }
  
  // 加载我的资产
  const loadMyAssets = async (acc: string) => {
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const response = await fetch(`${API_URL}/assets?owner=${acc}&limit=${itemsPerPage}&offset=${offset}`)
      const data = await response.json()
      setMyAssets(data.data || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error("加载我的资产失败:", error)
    }
  }
  
  // 加载我的订单
  const loadMyOrders = async (acc: string) => {
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const response = await fetch(`${API_URL}/orders?user=${acc}&limit=${itemsPerPage}&offset=${offset}`)
      const data = await response.json()
      setMyOrders(data.data || [])
      setTotalItems(data.total || 0)
    } catch (error) {
      console.error("加载我的订单失败:", error)
    }
  }
  
  // 搜索资产
  const searchAssets = async () => {
    if (!searchQuery.trim()) {
      await loadData()
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (viewMode === 'marketplace') {
        setListedAssets(data.data.filter((a: Asset) => a.isListed) || [])
      } else if (viewMode === 'myAssets') {
        setMyAssets(data.data.filter((a: Asset) => a.owner.toLowerCase() === account.toLowerCase()) || [])
      }
    } catch (error) {
      console.error("搜索失败:", error)
    }
  }
  
  // 注册资产
  const registerAsset = async () => {
    if (!assetName || !serialNumber) {
      alert("请填写资产名称和序列号")
      return
    }
    
    setLoading(true)
    setTxStatus("正在提交交易...")
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      let tx
      if (isBrand) {
        // 品牌方注册
        tx = await contract.registerAsset(assetName, serialNumber, metadataURI || "")
      } else {
        // 用户注册
        tx = await contract.registerAssetByUser(assetName, serialNumber, metadataURI || "")
      }
      
      setTxHash(tx.hash)
      setTxStatus("等待确认...")
      
      await tx.wait()
      setTxStatus("注册成功！")
      
      // 清空表单
      setAssetName("")
      setSerialNumber("")
      setMetadataURI("")
      
      // 刷新数据
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
  
  // 上架资产
  const listAsset = async (assetId: number, price: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const priceWei = ethers.parseEther(price)
      const tx = await contract.listAsset(assetId, priceWei)
      await tx.wait()
      
      alert("上架成功！")
      await loadData()
    } catch (error: any) {
      console.error("上架失败:", error)
      alert(`上架失败: ${error.message}`)
    }
  }
  
  // 下架资产
  const unlistAsset = async (assetId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.unlistAsset(assetId)
      await tx.wait()
      
      alert("下架成功！")
      await loadData()
    } catch (error: any) {
      console.error("下架失败:", error)
      alert(`下架失败: ${error.message}`)
    }
  }
  
  // 购买资产
  const buyAsset = async (asset: Asset) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.createOrder(asset.id, { value: asset.price })
      setTxHash(tx.hash)
      setTxStatus("等待确认...")
      
      await tx.wait()
      setTxStatus("购买成功！")
      
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
  
  // 转移资产
  const transferAsset = async (assetId: number, toAddress: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.transferAsset(assetId, toAddress)
      await tx.wait()
      
      alert("转移成功！")
      await loadData()
    } catch (error: any) {
      console.error("转移失败:", error)
      alert(`转移失败: ${error.message}`)
    }
  }
  
  // 订单操作
  const shipOrder = async (orderId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.shipOrder(orderId)
      await tx.wait()
      
      alert("发货成功！")
      await loadMyOrders(account)
    } catch (error: any) {
      alert(`发货失败: ${error.message}`)
    }
  }
  
  const confirmDelivery = async (orderId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.confirmDelivery(orderId)
      await tx.wait()
      
      alert("确认收货成功！")
      await loadMyOrders(account)
    } catch (error: any) {
      alert(`确认收货失败: ${error.message}`)
    }
  }
  
  const completeOrder = async (orderId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.completeOrder(orderId)
      await tx.wait()
      
      alert("完成交易！")
      await loadMyOrders(account)
    } catch (error: any) {
      alert(`完成交易失败: ${error.message}`)
    }
  }
  
  const requestRefund = async (orderId: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const tx = await contract.requestRefund(orderId)
      await tx.wait()
      
      alert("退款成功！")
      await loadMyOrders(account)
    } catch (error: any) {
      alert(`退款失败: ${error.message}`)
    }
  }
  
  // 格式化地址
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // 格式化价格
  const formatPrice = (priceWei: string) => {
    try {
      return ethers.formatEther(priceWei)
    } catch {
      return "0"
    }
  }
  
  // 获取状态文本
  const getStatusText = (status: VerificationStatus) => {
    const statusMap = {
      [VerificationStatus.Unverified]: "未验证",
      [VerificationStatus.Pending]: "待验证",
      [VerificationStatus.Verified]: "已验证",
      [VerificationStatus.Rejected]: "已拒绝"
    }
    return statusMap[status] || "未知"
  }
  
  const getOrderStatusText = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.None]: "无",
      [OrderStatus.Created]: "已创建",
      [OrderStatus.Paid]: "已支付",
      [OrderStatus.Shipped]: "已发货",
      [OrderStatus.Delivered]: "已送达",
      [OrderStatus.Completed]: "已完成",
      [OrderStatus.Disputed]: "有争议",
      [OrderStatus.Refunded]: "已退款",
      [OrderStatus.Cancelled]: "已取消"
    }
    return statusMap[status] || "未知"
  }
  
  // 页面切换时重置分页并加载数据
  useEffect(() => {
    if (account) {
      setCurrentPage(1)
      loadData()
    }
  }, [viewMode, account])
  
  // 分页变化时加载数据
  useEffect(() => {
    if (account && currentPage > 1) {
      loadData()
    }
  }, [currentPage])
  
  // 渲染资产卡片
  const renderAssetCard = (asset: Asset) => {
    const isOwner = asset.owner.toLowerCase() === account.toLowerCase()
    
    return (
      <div key={asset.id} className="asset-card">
        <div className="asset-header">
          <span className="asset-id">#{asset.id}</span>
          <span className="asset-name">{asset.name}</span>
          {asset.status === VerificationStatus.Verified && (
            <span className="verified-badge">✓ 已验证</span>
          )}
        </div>
        
        <div className="asset-details">
          <div className="detail-item">
            <span className="label">序列号</span>
            <span className="value monospace">{asset.serialNumber}</span>
          </div>
          
          <div className="detail-item">
            <span className="label">所有者</span>
            <span className="value monospace clickable">{formatAddress(asset.owner)}</span>
          </div>
          
          <div className="detail-item">
            <span className="label">状态</span>
            <span className={`value status-${asset.status}`}>{getStatusText(asset.status)}</span>
          </div>
          
          {asset.isListed && (
            <div className="detail-item">
              <span className="label">价格</span>
              <span className="value" style={{ color: '#11998e', fontWeight: '700', fontSize: '1.2em' }}>
                {formatPrice(asset.price)} ETH
              </span>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {viewMode === 'marketplace' && asset.isListed && !isOwner && (
            <button onClick={() => buyAsset(asset)} className="btn btn-success" style={{ flex: '1' }}>
              购买
            </button>
          )}
          
          {viewMode === 'myAssets' && isOwner && (
            <>
              {!asset.isListed ? (
                <button 
                  onClick={() => {
                    const price = prompt("请输入价格 (ETH):")
                    if (price) listAsset(asset.id, price)
                  }}
                  className="btn btn-primary"
                  style={{ flex: '1' }}
                >
                  上架
                </button>
              ) : (
                <button onClick={() => unlistAsset(asset.id)} className="btn btn-secondary" style={{ flex: '1' }}>
                  下架
                </button>
              )}
              
              <button 
                onClick={() => {
                  const toAddress = prompt("请输入接收地址:")
                  if (toAddress) transferAsset(asset.id, toAddress)
                }}
                className="btn btn-secondary"
                style={{ flex: '1' }}
              >
                转移
              </button>
            </>
          )}
        </div>
      </div>
    )
  }
  
  // 渲染订单卡片
  const renderOrderCard = (order: Order) => {
    const isBuyer = order.buyer.toLowerCase() === account.toLowerCase()
    const isSeller = order.seller.toLowerCase() === account.toLowerCase()
    
    return (
      <div key={order.id} className="order-card">
        <h3>订单 #{order.id}</h3>
        <p><strong>资产 ID:</strong> {order.assetId}</p>
        <p><strong>价格:</strong> {formatPrice(order.price)} ETH</p>
        <p><strong>卖家:</strong> {formatAddress(order.seller)}</p>
        <p><strong>买家:</strong> {formatAddress(order.buyer)}</p>
        <p><strong>状态:</strong> <span className={`order-status-${order.status}`}>{getOrderStatusText(order.status)}</span></p>
        
        <div className="order-actions">
          {isSeller && order.status === OrderStatus.Paid && (
            <button onClick={() => shipOrder(order.id)} className="btn-primary">
              发货
            </button>
          )}
          
          {isBuyer && order.status === OrderStatus.Shipped && (
            <button onClick={() => confirmDelivery(order.id)} className="btn-primary">
              确认收货
            </button>
          )}
          
          {order.status === OrderStatus.Delivered && (
            <button onClick={() => completeOrder(order.id)} className="btn-primary">
              完成交易
            </button>
          )}
          
          {isBuyer && order.canRefund && [OrderStatus.Paid, OrderStatus.Shipped, OrderStatus.Delivered].includes(order.status) && (
            <button onClick={() => requestRefund(order.id)} className="btn-danger">
              申请退款
            </button>
          )}
        </div>
      </div>
    )
  }
  
  // 渲染分页
  const renderPagination = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    if (totalPages <= 1) return null
    
    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          上一页
        </button>
        <span>第 {currentPage} / {totalPages} 页</span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          下一页
        </button>
      </div>
    )
  }
  
  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🔐 ChainVault V3 - 资产交易平台</h1>
          <p className="subtitle">一个完整的区块链资产注册和交易平台</p>
          
          {!account ? (
            <button onClick={connectWallet} className="btn btn-primary">
              连接钱包
            </button>
          ) : (
            <div className="wallet-info">
              <div className="account-info">
                <div className="account-row">
                  <span className="account-label">账户:</span>
                  <span className="account-address">{formatAddress(account)}</span>
                </div>
                {isBrand && <span className="stat-badge">品牌方</span>}
                {isAdmin && <span className="stat-badge">管理员</span>}
              </div>
            </div>
          )}
        </header>
      
      {account && (
        <>
          {/* 导航标签 */}
          <nav className="filters-section">
            <div className="filter-controls">
              <button 
                className={`filter-btn ${viewMode === 'marketplace' ? 'active' : ''}`}
                onClick={() => setViewMode('marketplace')}
              >
                🛒 市场
              </button>
              <button 
                className={`filter-btn ${viewMode === 'myAssets' ? 'active' : ''}`}
                onClick={() => setViewMode('myAssets')}
              >
                📦 我的资产
              </button>
              <button 
                className={`filter-btn ${viewMode === 'myOrders' ? 'active' : ''}`}
                onClick={() => setViewMode('myOrders')}
              >
                📋 我的订单
              </button>
              <button 
                className={`filter-btn ${viewMode === 'register' ? 'active' : ''}`}
                onClick={() => setViewMode('register')}
              >
                ➕ 注册资产
              </button>
            </div>
          </nav>
          
          {/* 搜索栏 */}
          {viewMode !== 'register' && (
            <div className="filters-section">
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="搜索资产名称或序列号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchAssets()}
                />
              </div>
              <button onClick={searchAssets} className="btn btn-primary">
                搜索
              </button>
            </div>
          )}
          
          {/* 注册资产表单 - 使用完整的表单组件 */}
          {viewMode === 'register' && (
            <AssetRegistrationForm
              account={account}
              isBrand={isBrand}
              contractAddress={CONTRACT_ADDRESS}
              contractABI={ABI}
              onSuccess={() => {
                // 注册成功后刷新数据
                setViewMode('myAssets');
                loadData();
              }}
            />
          )}
          
          {/* 资产区域 */}
          {viewMode !== 'register' && (
            <div className="assets-section">
              <div className="section-header">
                <h2>
                  {viewMode === 'marketplace' && '🛒 市场'}
                  {viewMode === 'myAssets' && '📦 我的资产'}
                  {viewMode === 'myOrders' && '📋 我的订单'}
                </h2>
                <div className="stats">
                  <span className="stat-badge">
                    {viewMode === 'marketplace' && `${listedAssets.length} 件在售`}
                    {viewMode === 'myAssets' && `${myAssets.length} 件资产`}
                    {viewMode === 'myOrders' && `${myOrders.length} 个订单`}
                  </span>
                </div>
              </div>
              
              {/* 市场 */}
              {viewMode === 'marketplace' && (
                <div className="assets-list">
                  {listedAssets.length === 0 ? (
                    <div className="empty-state">
                      <p>暂无在售资产</p>
                    </div>
                  ) : (
                    listedAssets.map(renderAssetCard)
                  )}
                </div>
              )}
              
              {/* 我的资产 */}
              {viewMode === 'myAssets' && (
                <div className="assets-list">
                  {myAssets.length === 0 ? (
                    <div className="empty-state">
                      <p>您还没有资产</p>
                    </div>
                  ) : (
                    myAssets.map(renderAssetCard)
                  )}
                </div>
              )}
              
              {/* 我的订单 */}
              {viewMode === 'myOrders' && (
                <div className="assets-list">
                  {myOrders.length === 0 ? (
                    <div className="empty-state">
                      <p>您还没有订单</p>
                    </div>
                  ) : (
                    myOrders.map(renderOrderCard)
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 分页 */}
          {viewMode !== 'register' && renderPagination()}
        </>
      )}
      
      {!account && (
        <div className="empty-state">
          <h2>欢迎来到 ChainVault V3</h2>
          <p>一个完整的区块链资产注册和交易平台</p>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '20px auto' }}>
            <li>✅ 品牌授权和序列号验证</li>
            <li>✅ 资产上架和交易</li>
            <li>✅ 订单管理和退货机制</li>
            <li>✅ 完整的生命周期追踪</li>
          </ul>
          <p>请连接钱包开始使用</p>
        </div>
      )}
      </div>
    </div>
  )
}

export default AppV3


