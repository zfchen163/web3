import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import AssetRegistrationForm from './components/AssetRegistrationForm'
import Modal from './components/Modal'
import AssetDetailModalV2 from './components/AssetDetailModalV2'
import AssetCard from './components/AssetCard'
import './components/AssetRegistrationForm.css'
import './components/ImageUpload.css'
import './components/Modal.css'

// V3 合约地址（已部署）
const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
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
  images?: string  // JSON 格式的 base64 图片数组
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

interface UserReputation {
  id: number
  userAddress: string
  level: number
  stars: number
  experiencePoints: number
  totalOrders: number
  completedOrders: number
  sellerRating: number
  buyerRating: number
  onTimeDeliveryRate: number
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
  
  // 模态框状态
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalType, setModalType] = useState<'price' | 'transfer'>('price')
  const [modalAssetId, setModalAssetId] = useState<number>(0)
  
  // 详情模态框状态
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  
  // Hardhat 测试账户列表（动态加载）
  const [testAccounts, setTestAccounts] = useState<{ value: string; label: string }[]>([])
  
  // 动态加载 Hardhat 账户
  const loadHardhatAccounts = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum)
        
        // 默认 Hardhat 账户列表（作为后备）
        const defaultAccounts = [
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account #0 (Admin)
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
          "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3
          "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account #4
          "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", // Account #5
          "0x976EA74026E726554dB657fA54763abd0C3a0aa9", // Account #6
          "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", // Account #7
          "0x23618e81E3f5cdF7f54C3d65f7Fc0474e0e61806", // Account #8
          "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"  // Account #9
        ];

        let accountsToUse = defaultAccounts;

        try {
          // 尝试连接本地 Hardhat 节点获取所有账户
          // 这是最可靠的方法，因为 MetaMask 只返回当前授权的账户
          const localProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
          const localAccounts = await localProvider.listAccounts();
          if (localAccounts.length > 0) {
            accountsToUse = localAccounts.map(a => a.address);
          }
        } catch (e) {
          console.warn("无法从本地节点获取账户，使用默认列表", e);
        }

        const accountsWithBalance = await Promise.all(
          accountsToUse.map(async (addr: string, index: number) => {
            try {
              // 获取余额
              const balance = await provider.getBalance(addr)
              const balanceEth = parseFloat(ethers.formatEther(balance)).toFixed(2)
              // 标记当前账户
              const isCurrent = addr.toLowerCase() === account.toLowerCase();
              return {
                value: addr,
                label: `账户 #${index} ${isCurrent ? '(当前)' : ''} - ${balanceEth} ETH`
              }
            } catch (e) {
              return {
                value: addr,
                label: `账户 #${index} (${addr.slice(0, 6)}...)`
              }
            }
          })
        )
        
        // 过滤掉当前账户（不能转给自己）
        const filteredAccounts = accountsWithBalance.filter(
          acc => acc.value.toLowerCase() !== account.toLowerCase()
        );
        
        setTestAccounts(filteredAccounts)
      }
    } catch (error) {
      console.error("加载账户失败:", error)
      // 出错时设置为空，用户可以手动输入
      setTestAccounts([])
    }
  }
  
  // 品牌信息
  const [isBrand, setIsBrand] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  
  // 用户信誉
  const [userReputation, setUserReputation] = useState<UserReputation | null>(null)
  
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
        
        // 加载用户信誉
        await loadUserReputation(accounts[0])
        
        // 加载 Hardhat 测试账户
        await loadHardhatAccounts()
        
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
  
  // 加载用户信誉
  const loadUserReputation = async (acc: string) => {
    try {
      const response = await fetch(`${API_URL}/reputation/${acc}`)
      const result = await response.json()
      if (result.data) {
        setUserReputation(result.data)
      }
    } catch (error) {
      console.error("加载用户信誉失败:", error)
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
    setLoading(true)
    setTxStatus("正在上架...")
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      const priceWei = ethers.parseEther(price)
      
      setTxStatus("等待交易确认...")
      const tx = await contract.listAsset(assetId, priceWei)
      setTxHash(tx.hash)
      
      setTxStatus("交易已提交，等待确认...")
      await tx.wait()
      
      setTxStatus("上架成功！正在刷新数据...")
      
      // 等待 2 秒让事件监听器同步数据
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 刷新数据
      await loadData()
      
      setTxStatus("✅ 上架成功！")
      
      // 2秒后清除状态
      setTimeout(() => {
        setTxStatus("")
        setTxHash("")
      }, 2000)
      
    } catch (error: any) {
      console.error("上架失败:", error)
      setTxStatus(`❌ 上架失败: ${error.message}`)
      
      setTimeout(() => {
        setTxStatus("")
      }, 5000)
    } finally {
      setLoading(false)
    }
  }
  
  // 下架资产
  const unlistAsset = async (assetId: number) => {
    setLoading(true)
    setTxStatus("正在下架...")
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      
      setTxStatus("等待交易确认...")
      const tx = await contract.unlistAsset(assetId)
      setTxHash(tx.hash)
      
      setTxStatus("交易已提交，等待确认...")
      await tx.wait()
      
      setTxStatus("下架成功！正在刷新数据...")
      
      // 等待 2 秒让事件监听器同步数据
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 刷新数据
      await loadData()
      
      setTxStatus("✅ 下架成功！")
      
      // 2秒后清除状态
      setTimeout(() => {
        setTxStatus("")
        setTxHash("")
      }, 2000)
      
    } catch (error: any) {
      console.error("下架失败:", error)
      setTxStatus(`❌ 下架失败: ${error.message}`)
      
      setTimeout(() => {
        setTxStatus("")
      }, 5000)
    } finally {
      setLoading(false)
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
    
    // 打开详情页面
    const openDetail = () => {
      setSelectedAsset(asset)
      setDetailModalOpen(true)
    }

    return (
      <AssetCard
        key={asset.id}
        asset={asset}
        onOpenDetail={openDetail}
        onBuy={() => buyAsset(asset)}
        onList={() => {
          setModalAssetId(asset.id)
          setModalType('price')
          setModalOpen(true)
        }}
        onUnlist={() => unlistAsset(asset.id)}
        onTransfer={() => {
          setModalAssetId(asset.id)
          setModalType('transfer')
          setModalOpen(true)
        }}
        viewMode={viewMode}
        isOwner={isOwner}
        formatAddress={formatAddress}
        formatPrice={formatPrice}
        getStatusText={getStatusText}
      />
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">ChainVault</h1>
                  <p className="text-xs text-gray-500">资产交易平台</p>
                </div>
              </div>
              
              {!account ? (
                <button onClick={connectWallet} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  连接钱包
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">当前账户</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{formatAddress(account)}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(account)
                      alert('地址已复制！')
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    📋 复制
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* 全局交易状态提示 */}
      {txStatus && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: txStatus.includes('✅') ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 
                     txStatus.includes('❌') ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 9999,
          minWidth: '300px',
          maxWidth: '500px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            {loading && !txStatus.includes('✅') && !txStatus.includes('❌') && (
              <span style={{ marginRight: '10px' }}>⏳</span>
            )}
            {txStatus}
          </div>
          {txHash && (
            <div style={{ 
              fontSize: '12px', 
              opacity: 0.9,
              marginTop: '8px',
              wordBreak: 'break-all'
            }}>
              交易哈希: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      )}
      
      {account && (
        <>
          {/* 导航标签 */}
          <nav className="mb-8">
            <div className="flex gap-2 border-b border-gray-200">
              <button 
                className={`px-6 py-3 font-semibold transition-all relative ${
                  viewMode === 'marketplace' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('marketplace')}
              >
                市场
                {viewMode === 'marketplace' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button 
                className={`px-6 py-3 font-semibold transition-all relative ${
                  viewMode === 'myAssets' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('myAssets')}
              >
                我的资产
                {viewMode === 'myAssets' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button 
                className={`px-6 py-3 font-semibold transition-all relative ${
                  viewMode === 'myOrders' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('myOrders')}
              >
                我的订单
                {viewMode === 'myOrders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button 
                className={`px-6 py-3 font-semibold transition-all relative ${
                  viewMode === 'register' 
                    ? 'text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('register')}
              >
                注册资产
                {viewMode === 'register' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </nav>
          
          {/* 搜索栏和统计 */}
          {viewMode !== 'register' && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="搜索资产名称或序列号..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchAssets()}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                </div>
                <button 
                  onClick={searchAssets} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  搜索
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-600">
                    {viewMode === 'marketplace' && `${listedAssets.length} 件在售`}
                    {viewMode === 'myAssets' && `${myAssets.length} 件资产`}
                    {viewMode === 'myOrders' && `${myOrders.length} 个订单`}
                  </span>
                </div>
                <button 
                  onClick={() => loadData()}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  title="刷新数据"
                >
                  <span className={loading ? 'inline-block animate-spin' : ''}>🔄</span>
                </button>
              </div>
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
                <div className="stats" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span className="stat-badge">
                    {viewMode === 'marketplace' && `${listedAssets.length} 件在售`}
                    {viewMode === 'myAssets' && `${myAssets.length} 件资产`}
                    {viewMode === 'myOrders' && `${myOrders.length} 个订单`}
                  </span>
                  <button 
                    onClick={() => loadData()}
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="刷新数据"
                  >
                    <span style={{ 
                      display: 'inline-block',
                      animation: loading ? 'spin 1s linear infinite' : 'none'
                    }}>
                      🔄
                    </span>
                    <span>{loading ? '刷新中...' : '刷新'}</span>
                  </button>
                </div>
              </div>
              
              {/* 市场 */}
              {viewMode === 'marketplace' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listedAssets.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <p className="text-gray-500 text-lg">暂无在售资产</p>
                    </div>
                  ) : (
                    listedAssets.map(renderAssetCard)
                  )}
                </div>
              )}
              
              {/* 我的资产 */}
              {viewMode === 'myAssets' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myAssets.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <p className="text-gray-500 text-lg">您还没有资产</p>
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
      
      {/* 美化的模态框 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(value) => {
          if (modalType === 'price') {
            listAsset(modalAssetId, value)
          } else {
            transferAsset(modalAssetId, value)
          }
        }}
        title={modalType === 'price' ? '设置上架价格' : '转移资产'}
        icon={modalType === 'price' ? '💰' : '🔄'}
        placeholder={modalType === 'price' ? '例如: 50' : '0x...'}
        hint={modalType === 'price' ? '输入您想要出售的价格（单位：ETH）' : '选择接收方账户或输入自定义地址'}
        inputType={modalType === 'price' ? 'number' : 'select'}
        selectOptions={modalType === 'transfer' ? testAccounts : []}
      />
      
      {/* 资产详情模态框 */}
      {detailModalOpen && selectedAsset && (
        <AssetDetailModalV2
          asset={selectedAsset}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedAsset(null)
          }}
          formatAddress={formatAddress}
          formatPrice={formatPrice}
          getStatusText={getStatusText}
        />
      )}
        </div>
      </div>
    </div>
  )
}

export default AppV3


