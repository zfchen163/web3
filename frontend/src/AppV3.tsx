import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css'
import AssetRegistrationForm from './components/AssetRegistrationForm'
import Modal from './components/Modal'
import AssetDetailModal from './components/AssetDetailModal'
import './components/AssetRegistrationForm.css'
import './components/ImageUpload.css'
import './components/Modal.css'
import './components/AssetDetailModal.css'

// V3 合约地址（已部署）
const CONTRACT_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"
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
        
        // 尝试获取所有账户
        const accounts = await provider.listAccounts()
        
        // 如果没有账户，使用默认的 Hardhat 账户列表
        if (accounts.length === 0) {
          // 使用 eth_accounts 获取
          const ethAccounts = await provider.send("eth_accounts", [])
          
          const accountsWithBalance = await Promise.all(
            ethAccounts.map(async (addr: string, index: number) => {
              try {
                const balance = await provider.getBalance(addr)
                const balanceEth = parseFloat(ethers.formatEther(balance)).toFixed(0)
                return {
                  value: addr,
                  label: `账户 #${index} (${addr.slice(0, 6)}...${addr.slice(-4)}) - ${balanceEth} ETH`
                }
              } catch (e) {
                return {
                  value: addr,
                  label: `账户 #${index} (${addr.slice(0, 6)}...${addr.slice(-4)})`
                }
              }
            })
          )
          
          setTestAccounts(accountsWithBalance)
        } else {
          // 使用 listAccounts 的结果
          const accountsWithBalance = await Promise.all(
            accounts.map(async (signer, index) => {
              const addr = await signer.getAddress()
              try {
                const balance = await provider.getBalance(addr)
                const balanceEth = parseFloat(ethers.formatEther(balance)).toFixed(0)
                return {
                  value: addr,
                  label: `账户 #${index} (${addr.slice(0, 6)}...${addr.slice(-4)}) - ${balanceEth} ETH`
                }
              } catch (e) {
                return {
                  value: addr,
                  label: `账户 #${index} (${addr.slice(0, 6)}...${addr.slice(-4)})`
                }
              }
            })
          )
          
          setTestAccounts(accountsWithBalance)
        }
      }
    } catch (error) {
      console.error("加载 Hardhat 账户失败:", error)
      // 如果失败，使用默认列表
      setTestAccounts([
        { value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', label: '账户 #0 (0xf39F...2266) - 10000 ETH' },
        { value: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', label: '账户 #1 (0x7099...79C8) - 10000 ETH' },
        { value: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', label: '账户 #2 (0x3C44...93BC) - 10000 ETH' },
        { value: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', label: '账户 #3 (0x90F7...b906) - 10000 ETH' },
        { value: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', label: '账户 #4 (0x15d3...6A65) - 10000 ETH' },
        { value: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', label: '账户 #5 (0x9965...A4dc) - 10000 ETH' },
        { value: '0x976EA74026E726554dB657fA54763abd0C3a0aa9', label: '账户 #6 (0x976E...0aa9) - 10000 ETH' },
        { value: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', label: '账户 #7 (0x14dC...9955) - 10000 ETH' },
        { value: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', label: '账户 #8 (0x2361...1E8f) - 10000 ETH' },
        { value: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720', label: '账户 #9 (0xa0Ee...9720) - 10000 ETH' },
      ])
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
    
    // 解析图片数据（支持 base64 和 IPFS hash）
    let images: string[] = []
    let displayImageUrl: string | null = null
    
    if (asset.images) {
      try {
        images = JSON.parse(asset.images)
      } catch (e) {
        // 如果不是 JSON，可能是单个字符串
        images = asset.images ? [asset.images] : []
      }
    }
    
    // 获取第一张图片用于显示
    if (images.length > 0) {
      const firstImage = images[0]
      // 如果是 base64（以 data: 开头），直接使用；如果是 IPFS hash，转换为 URL
      displayImageUrl = firstImage.startsWith('data:') 
        ? firstImage 
        : firstImage ? `https://ipfs.io/ipfs/${firstImage}` : null
    }
    
    // 解析元数据获取详细信息
    let metadata: any = {}
    if (asset.metadataURI) {
      try {
        if (asset.metadataURI.startsWith('data:application/json;base64,')) {
          const base64Data = asset.metadataURI.replace('data:application/json;base64,', '')
          const jsonStr = atob(base64Data)
          metadata = JSON.parse(jsonStr)
        }
      } catch (e) {
        console.error('Failed to parse metadata:', e)
      }
    }
    
    // 打开详情页面
    const openDetail = () => {
      setSelectedAsset(asset)
      setDetailModalOpen(true)
    }

    return (
      <div key={asset.id} className="asset-card" style={{ position: 'relative' }}>
        {/* 上架状态标签 */}
        {asset.isListed && (
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: '0 4px 15px rgba(17, 153, 142, 0.4)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🏷️</span>
            <span>在售中</span>
          </div>
        )}
        
        {!asset.isListed && viewMode === 'myAssets' && (
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(107, 114, 128, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>📦</span>
            <span>未上架</span>
          </div>
        )}
        
        {/* 图片预览 */}
        {displayImageUrl && (
          <div 
            onClick={openDetail}
            style={{ 
              width: '100%', 
              height: '200px', 
              marginBottom: '20px',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <img 
              src={displayImageUrl} 
              alt={asset.name}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // 如果图片加载失败，隐藏图片区域
                e.currentTarget.style.display = 'none'
              }}
            />
            {/* 悬停提示 */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none'
            }}
            className="view-detail-hint"
            >
              🔍 点击查看详情
            </div>
          </div>
        )}
        
        <div className="asset-header">
          <span className="asset-id">#{asset.id}</span>
          <span className="asset-name">{asset.name}</span>
          {asset.status === VerificationStatus.Verified && (
            <span className="verified-badge">✓ 已验证</span>
          )}
        </div>
        
        <div className="asset-details">
          {/* 描述信息 */}
          {metadata.description && (
            <div className="detail-item" style={{ 
              gridColumn: '1 / -1',
              background: 'rgba(99, 102, 241, 0.05)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <span className="label">📝 商品描述</span>
              <span className="value" style={{ 
                display: 'block', 
                marginTop: '6px',
                lineHeight: '1.6',
                color: '#4b5563'
              }}>
                {metadata.description}
              </span>
            </div>
          )}
          
          {/* 基本信息 */}
          <div className="detail-item">
            <span className="label">序列号</span>
            <span className="value monospace">{asset.serialNumber}</span>
          </div>
          
          {metadata.attributes?.category && (
            <div className="detail-item">
              <span className="label">分类</span>
              <span className="value">{metadata.attributes.category}</span>
            </div>
          )}
          
          {metadata.attributes?.brand && (
            <div className="detail-item">
              <span className="label">品牌</span>
              <span className="value" style={{ fontWeight: '600' }}>{metadata.attributes.brand}</span>
            </div>
          )}
          
          {metadata.attributes?.model && (
            <div className="detail-item">
              <span className="label">型号</span>
              <span className="value">{metadata.attributes.model}</span>
            </div>
          )}
          
          {metadata.attributes?.size && (
            <div className="detail-item">
              <span className="label">尺码</span>
              <span className="value">{metadata.attributes.size}</span>
            </div>
          )}
          
          {metadata.attributes?.color && (
            <div className="detail-item">
              <span className="label">颜色</span>
              <span className="value">{metadata.attributes.color}</span>
            </div>
          )}
          
          {metadata.attributes?.condition && (
            <div className="detail-item">
              <span className="label">新旧程度</span>
              <span className="value">
                {metadata.attributes.condition === 'new' && '🆕 全新'}
                {metadata.attributes.condition === 'used' && '♻️ 二手'}
                {metadata.attributes.condition === 'refurbished' && '🔧 翻新'}
              </span>
            </div>
          )}
          
          {metadata.attributes?.productionDate && (
            <div className="detail-item">
              <span className="label">生产日期</span>
              <span className="value">{metadata.attributes.productionDate}</span>
            </div>
          )}
          
          {metadata.attributes?.productionLocation && (
            <div className="detail-item">
              <span className="label">生产地</span>
              <span className="value">🌍 {metadata.attributes.productionLocation}</span>
            </div>
          )}
          
          {metadata.attributes?.certificateUrl && (
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="label">品牌证书</span>
              <span className="value">
                <a 
                  href={metadata.attributes.certificateUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#6366f1',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📜 查看官方证书 →
                </a>
              </span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="label">所有者</span>
            <span className="value monospace clickable">{formatAddress(asset.owner)}</span>
          </div>
          
          <div className="detail-item">
            <span className="label">验证状态</span>
            <span className={`value status-${asset.status}`}>{getStatusText(asset.status)}</span>
          </div>
          
          <div className="detail-item">
            <span className="label">上架状态</span>
            <span className="value" style={{ 
              color: asset.isListed ? '#11998e' : '#6b7280',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {asset.isListed ? (
                <>
                  <span>🏷️</span>
                  <span>在售中</span>
                </>
              ) : (
                <>
                  <span>📦</span>
                  <span>未上架</span>
                </>
              )}
            </span>
          </div>
          
          {asset.isListed && (
            <div className="detail-item" style={{
              background: 'linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%)',
              padding: '12px',
              borderRadius: '12px',
              marginTop: '8px'
            }}>
              <span className="label" style={{ color: '#11998e', fontWeight: '600' }}>售价</span>
              <span className="value" style={{ 
                color: '#11998e', 
                fontWeight: '800', 
                fontSize: '1.5em',
                textShadow: '0 2px 4px rgba(17, 153, 142, 0.2)'
              }}>
                {formatPrice(asset.price)} ETH
              </span>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* 查看详情按钮 - 所有情况下都显示 */}
          <button 
            onClick={openDetail}
            className="btn btn-detail"
            style={{ 
              flex: '1',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              fontWeight: '600',
              fontSize: '15px',
              padding: '12px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              🔍 查看详情
            </span>
          </button>
          
          {viewMode === 'marketplace' && asset.isListed && !isOwner && (
            <button onClick={() => buyAsset(asset)} className="btn btn-success" style={{ flex: '1' }}>
              💰 购买
            </button>
          )}
          
          {viewMode === 'myAssets' && isOwner && (
            <>
              {!asset.isListed ? (
                <button 
                  onClick={() => {
                    setModalAssetId(asset.id)
                    setModalType('price')
                    setModalOpen(true)
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
                  setModalAssetId(asset.id)
                  setModalType('transfer')
                  setModalOpen(true)
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
                <div className="account-header">
                  <span className="account-label">当前账户</span>
                  {isBrand && <span className="stat-badge badge-brand">✨ 品牌方</span>}
                  {isAdmin && <span className="stat-badge badge-admin">👑 管理员</span>}
                  {userReputation && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginLeft: '12px'
                    }}>
                      <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        Lv.{userReputation.level}
                        {Array.from({ length: userReputation.stars }).map((_, i) => (
                          <span key={i}>⭐</span>
                        ))}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {userReputation.experiencePoints} EXP
                      </span>
                    </div>
                  )}
                </div>
                <div className="account-address-display">
                  <span className="account-address-full" title={account}>{account}</span>
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(account)
                      alert('地址已复制到剪贴板！')
                    }}
                    title="复制地址"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
      
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
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedAsset(null)
        }}
        onBuy={(asset) => {
          setDetailModalOpen(false)
          buyAsset(asset)
        }}
        onList={(assetId) => {
          setDetailModalOpen(false)
          setModalAssetId(assetId)
          setModalType('price')
          setModalOpen(true)
        }}
        onUnlist={(assetId) => {
          setDetailModalOpen(false)
          unlistAsset(assetId)
        }}
        onTransfer={(assetId) => {
          setDetailModalOpen(false)
          setModalAssetId(assetId)
          setModalType('transfer')
          setModalOpen(true)
        }}
        isOwner={selectedAsset?.owner.toLowerCase() === account.toLowerCase()}
        viewMode={viewMode}
      />
      </div>
    </div>
  )
}

export default AppV3


