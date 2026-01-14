// ChainVault Native JavaScript Application
// 使用原生 JavaScript + Ethers.js + Tailwind CSS + Swiper

// 配置
const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const API_URL = "http://localhost:8080";

// 合约 ABI（简化版）
const ABI = [
    "function registerBrand(string brandName)",
    "function authorizeBrand(address brandAddress, bool authorized)",
    "function brands(address) view returns (address brandAddress, string brandName, bool isAuthorized, uint256 registeredAt)",
    "function registerAsset(string name, string serialNumber, string metadataURI) returns (uint256)",
    "function registerAssetByUser(string name, string serialNumber, string metadataURI) returns (uint256)",
    "function listAsset(uint256 assetId, uint256 price)",
    "function unlistAsset(uint256 assetId)",
    "function createOrder(uint256 assetId) payable returns (uint256)",
    "function shipOrder(uint256 orderId)",
    "function confirmDelivery(uint256 orderId)",
    "function completeOrder(uint256 orderId)",
    "function requestRefund(uint256 orderId)",
    "function transferAsset(uint256 assetId, address newOwner)",
    "function assets(uint256) view returns (uint256 assetId, address owner, address brand, string name, string serialNumber, string metadataURI, uint8 status, uint256 createdAt, bool isListed, uint256 price)",
    "function getAssetsByOwner(address owner) view returns (uint256[])",
    "function getListedAssets() view returns (uint256[])",
    "function admin() view returns (address)"
];

// 全局状态
let currentAccount = null;
let provider = null;
let signer = null;
let contract = null;
let currentTab = 'marketplace';
let isBrand = false;
let isAdmin = false;

// 初始化 Swiper
function initSwiper() {
    new Swiper('.featureSwiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });
}

// 显示 Toast 通知
function showToast(message, duration = 3000, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('active');
    
    // 根据类型设置不同的背景色
    toast.classList.remove('toast-success', 'toast-error', 'toast-warning', 'toast-info');
    if (message.includes('✅') || message.includes('成功')) {
        toast.classList.add('toast-success');
    } else if (message.includes('❌') || message.includes('失败') || message.includes('错误')) {
        toast.classList.add('toast-error');
    } else if (message.includes('⚠️') || message.includes('警告')) {
        toast.classList.add('toast-warning');
    } else {
        toast.classList.add('toast-info');
    }
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, duration);
}

// 显示全局加载器
function showLoader(text = '处理中...') {
    const loader = document.getElementById('globalLoader');
    const loaderText = document.getElementById('loaderText');
    if (loaderText) loaderText.textContent = text;
    if (loader) loader.classList.remove('hidden');
    if (loader) loader.classList.add('flex');
}

// 隐藏全局加载器
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.classList.add('hidden');
    if (loader) loader.classList.remove('flex');
}

// 打开模态框
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 格式化地址
function formatAddress(address, full = false) {
    if (!address) return '';
    if (full) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// 复制地址到剪贴板
function copyToClipboard(text, message = '✅ 已复制!') {
    navigator.clipboard.writeText(text);
    showToast(message);
}

// 格式化价格
function formatPrice(priceWei) {
    try {
        return ethers.formatEther(priceWei);
    } catch {
        return '0';
    }
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        0: '未验证',
        1: '待验证',
        2: '已验证',
        3: '已拒绝'
    };
    return statusMap[status] || '未知';
}

// 获取状态徽章类
function getStatusBadgeClass(status) {
    const classMap = {
        0: 'badge-unverified',
        1: 'badge-pending',
        2: 'badge-verified',
        3: 'badge-unverified'
    };
    return classMap[status] || 'badge-unverified';
}

// 连接钱包
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showToast('请安装 MetaMask!');
        return;
    }
    
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        currentAccount = accounts[0];
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        
        // 检查是否是品牌方或管理员
        const brandInfo = await contract.brands(currentAccount);
        isBrand = brandInfo.isAuthorized;
        
        const adminAddress = await contract.admin();
        isAdmin = currentAccount.toLowerCase() === adminAddress.toLowerCase();
        
        // 更新 UI
        document.getElementById('connectWalletBtn').classList.add('hidden');
        document.getElementById('accountInfo').classList.remove('hidden');
        // 显示完整地址（不截断）
        document.getElementById('accountAddress').textContent = currentAccount;
        
        document.getElementById('welcomeSection').classList.add('hidden');
        document.getElementById('mainSection').classList.remove('hidden');
        
        showToast('✅ 钱包连接成功!');
        
        // 加载数据
        loadData();
    } catch (error) {
        console.error('连接钱包失败:', error);
        showToast('❌ 连接钱包失败');
    }
}

// 复制地址
function copyAddress() {
    if (currentAccount) {
        navigator.clipboard.writeText(currentAccount);
        showToast('✅ 地址已复制!');
    }
}

// 加载数据
async function loadData() {
    if (!currentAccount) return;
    
    try {
        if (currentTab === 'marketplace') {
            await loadMarketplace();
        } else if (currentTab === 'myAssets') {
            await loadMyAssets();
        } else if (currentTab === 'myOrders') {
            await loadMyOrders();
        }
        
        // 加载统计数据
        await loadStats();
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('❌ 加载数据失败');
    }
}

// 加载市场资产
async function loadMarketplace() {
    try {
        const response = await fetch(`${API_URL}/assets/listed?limit=100&offset=0`);
        const data = await response.json();
        const assets = data.data || [];
        
        const container = document.getElementById('marketplaceAssets');
        container.innerHTML = '';
        
        if (assets.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <div class="text-6xl mb-4">🛍️</div>
                    <h3 class="text-2xl font-bold text-gray-700 mb-2">暂无在售资产</h3>
                    <p class="text-gray-500">市场上还没有商品，快去注册并上架您的第一个资产吧！</p>
                </div>
            `;
            return;
        }
        
        assets.forEach(asset => {
            container.appendChild(createAssetCard(asset, 'marketplace'));
        });
    } catch (error) {
        console.error('加载市场资产失败:', error);
    }
}

// 加载我的资产
async function loadMyAssets() {
    try {
        const response = await fetch(`${API_URL}/assets?owner=${currentAccount}&limit=100&offset=0`);
        const data = await response.json();
        const assets = data.data || [];
        
        const container = document.getElementById('myAssetsList');
        container.innerHTML = '';
        
        if (assets.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <div class="text-6xl mb-4">📦</div>
                    <h3 class="text-2xl font-bold text-gray-700 mb-2">您还没有资产</h3>
                    <p class="text-gray-500 mb-6">开始注册您的第一个资产，体验区块链资产管理的魅力！</p>
                    <button onclick="switchTab('register')" class="btn-primary px-8 py-3">
                        ➕ 立即注册资产
                    </button>
                </div>
            `;
            return;
        }
        
        assets.forEach(asset => {
            container.appendChild(createAssetCard(asset, 'myAssets'));
        });
    } catch (error) {
        console.error('加载我的资产失败:', error);
    }
}

// 加载我的订单
async function loadMyOrders() {
    try {
        const response = await fetch(`${API_URL}/orders?user=${currentAccount}&limit=100&offset=0`);
        const data = await response.json();
        const orders = data.data || [];
        
        const container = document.getElementById('myOrdersList');
        container.innerHTML = '';
        
        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20">
                    <div class="text-6xl mb-4">📋</div>
                    <h3 class="text-2xl font-bold text-gray-700 mb-2">您还没有订单</h3>
                    <p class="text-gray-500 mb-6">去市场逛逛，购买您喜欢的资产吧！</p>
                    <button onclick="switchTab('marketplace')" class="btn-primary px-8 py-3">
                        🛍️ 前往市场
                    </button>
                </div>
            `;
            return;
        }
        
        orders.forEach(order => {
            container.appendChild(createOrderCard(order));
        });
    } catch (error) {
        console.error('加载我的订单失败:', error);
    }
}

// 加载统计数据
async function loadStats() {
    try {
        const [assetsRes, listedRes, ordersRes] = await Promise.all([
            fetch(`${API_URL}/assets?owner=${currentAccount}&limit=1000`),
            fetch(`${API_URL}/assets/listed?limit=1000`),
            fetch(`${API_URL}/orders?user=${currentAccount}&limit=1000`)
        ]);
        
        const assetsData = await assetsRes.json();
        const listedData = await listedRes.json();
        const ordersData = await ordersRes.json();
        
        // 优先使用 total 字段，如果没有则使用 data 数组长度
        const totalAssets = assetsData.total || (assetsData.data ? assetsData.data.length : 0);
        const listedAssets = listedData.total || (listedData.data ? listedData.data.length : 0);
        const totalOrders = ordersData.total || (ordersData.data ? ordersData.data.length : 0);
        
        document.getElementById('totalAssets').textContent = totalAssets;
        document.getElementById('listedAssets').textContent = listedAssets;
        document.getElementById('totalOrders').textContent = totalOrders;
        
        console.log('📊 统计数据已更新:', { totalAssets, listedAssets, totalOrders });
    } catch (error) {
        console.error('加载统计数据失败:', error);
        // 出错时显示 0
        document.getElementById('totalAssets').textContent = 0;
        document.getElementById('listedAssets').textContent = 0;
        document.getElementById('totalOrders').textContent = 0;
    }
}

// 创建资产卡片
function createAssetCard(asset, viewMode) {
    const card = document.createElement('div');
    card.className = 'asset-card card-hover';
    
    const isOwner = asset.owner.toLowerCase() === currentAccount.toLowerCase();
    
    // 解析图片
    let imageUrl = 'https://via.placeholder.com/400x300?text=No+Image';
    if (asset.images) {
        try {
            const images = JSON.parse(asset.images);
            if (images.length > 0) {
                imageUrl = images[0];
            }
        } catch (e) {
            console.error('解析图片失败:', e);
        }
    }
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${asset.name}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        <div class="p-6">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-gray-900">${asset.name}</h3>
                <span class="badge ${getStatusBadgeClass(asset.status)}">${getStatusText(asset.status)}</span>
            </div>
            <p class="text-sm text-gray-600 mb-2">序列号: ${asset.serialNumber}</p>
            <p class="text-sm text-gray-600 mb-4">所有者: ${formatAddress(asset.owner)}</p>
            ${asset.isListed ? `<p class="text-2xl font-bold text-purple-600 mb-4">${formatPrice(asset.price)} ETH</p>` : ''}
            <div class="flex gap-2">
                <button onclick="viewAssetDetail(${asset.id})" class="btn-secondary flex-1">查看详情</button>
                ${viewMode === 'marketplace' && asset.isListed && !isOwner ? 
                    `<button onclick="buyAsset(${asset.id}, '${asset.price}')" class="btn-primary flex-1">购买</button>` : ''}
                ${viewMode === 'myAssets' && isOwner && !asset.isListed ? 
                    `<button onclick="showListModal(${asset.id})" class="btn-primary flex-1">上架</button>` : ''}
                ${viewMode === 'myAssets' && isOwner && asset.isListed ? 
                    `<button onclick="unlistAsset(${asset.id})" class="btn-secondary flex-1">下架</button>` : ''}
                ${viewMode === 'myAssets' && isOwner && !asset.isListed ? 
                    `<button onclick="showTransferModal(${asset.id})" class="btn-secondary flex-1">转移</button>` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// 创建订单卡片
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl p-6 shadow-lg';
    
    const isBuyer = order.buyer.toLowerCase() === currentAccount.toLowerCase();
    const isSeller = order.seller.toLowerCase() === currentAccount.toLowerCase();
    
    const statusMap = {
        0: '无',
        1: '已创建',
        2: '已支付',
        3: '已发货',
        4: '已送达',
        5: '已完成',
        6: '有争议',
        7: '已退款',
        8: '已取消'
    };
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold">订单 #${order.id}</h3>
            <span class="badge badge-verified">${statusMap[order.status] || '未知'}</span>
        </div>
        <div class="space-y-2 mb-4">
            <p class="text-sm"><span class="font-semibold">资产 ID:</span> ${order.assetId}</p>
            <p class="text-sm"><span class="font-semibold">价格:</span> ${formatPrice(order.price)} ETH</p>
            <p class="text-sm"><span class="font-semibold">卖家:</span> ${formatAddress(order.seller)}</p>
            <p class="text-sm"><span class="font-semibold">买家:</span> ${formatAddress(order.buyer)}</p>
        </div>
        <div class="flex gap-2">
            ${isSeller && order.status === 2 ? 
                `<button onclick="shipOrder(${order.id})" class="btn-primary flex-1">发货</button>` : ''}
            ${isBuyer && order.status === 3 ? 
                `<button onclick="confirmDelivery(${order.id})" class="btn-primary flex-1">确认收货</button>` : ''}
            ${order.status === 4 ? 
                `<button onclick="completeOrder(${order.id})" class="btn-primary flex-1">完成交易</button>` : ''}
            ${isBuyer && order.canRefund && [2, 3, 4].includes(order.status) ? 
                `<button onclick="requestRefund(${order.id})" class="btn-secondary flex-1">申请退款</button>` : ''}
        </div>
    `;
    
    return card;
}

// 查看资产详情
async function viewAssetDetail(assetId) {
    try {
        const response = await fetch(`${API_URL}/assets/${assetId}`);
        const result = await response.json();
        const asset = result.data;
        
        if (!asset) {
            showToast('❌ 资产不存在');
            return;
        }
        
        // 解析图片
        let images = [];
        if (asset.images) {
            try {
                images = JSON.parse(asset.images);
            } catch (e) {
                console.error('解析图片失败:', e);
            }
        }
        
        const content = document.getElementById('assetDetailContent');
        content.innerHTML = `
            ${images.length > 0 ? `
                <div class="swiper assetImageSwiper mb-6" style="height: 300px;">
                    <div class="swiper-wrapper">
                        ${images.map(img => `
                            <div class="swiper-slide">
                                <img src="${img}" alt="${asset.name}" class="w-full h-full object-cover rounded-lg">
                            </div>
                        `).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                </div>
            ` : `
                <img src="https://via.placeholder.com/400x300?text=No+Image" alt="${asset.name}" class="w-full h-64 object-cover rounded-lg mb-6">
            `}
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <h3 class="text-2xl font-bold">${asset.name}</h3>
                    <span class="badge ${getStatusBadgeClass(asset.status)}">${getStatusText(asset.status)}</span>
                </div>
                <p><span class="font-semibold">资产 ID:</span> ${asset.id}</p>
                <p><span class="font-semibold">序列号:</span> ${asset.serialNumber}</p>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm font-semibold text-gray-700 mb-2">所有者地址</p>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <code class="text-sm font-mono break-all flex-1 bg-white px-3 py-2 rounded border border-gray-200">${asset.owner}</code>
                        <button onclick="copyToClipboard('${asset.owner}', '✅ 所有者地址已复制!')" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                            📋 复制
                        </button>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-sm font-semibold text-gray-700 mb-2">品牌地址</p>
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <code class="text-sm font-mono break-all flex-1 bg-white px-3 py-2 rounded border border-gray-200">${asset.brand}</code>
                        <button onclick="copyToClipboard('${asset.brand}', '✅ 品牌地址已复制!')" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                            📋 复制
                        </button>
                    </div>
                </div>
                ${asset.isListed ? `<p><span class="font-semibold">价格:</span> <span class="text-2xl font-bold text-purple-600">${formatPrice(asset.price)} ETH</span></p>` : ''}
                ${asset.metadataURI ? `<p><span class="font-semibold">元数据:</span> ${asset.metadataURI}</p>` : ''}
                <p><span class="font-semibold">创建时间:</span> ${new Date(asset.createdAt).toLocaleString()}</p>
                ${asset.txHash ? `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm font-semibold text-gray-700 mb-2">交易哈希</p>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <code class="text-sm font-mono break-all flex-1 bg-white px-3 py-2 rounded border border-gray-200">${asset.txHash}</code>
                            <button onclick="copyToClipboard('${asset.txHash}', '✅ 交易哈希已复制!')" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap">
                                📋 复制
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        openModal('assetDetailModal');
        
        // 如果有多张图片，初始化 Swiper
        if (images.length > 1) {
            setTimeout(() => {
                new Swiper('.assetImageSwiper', {
                    slidesPerView: 1,
                    spaceBetween: 10,
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                });
            }, 100);
        }
    } catch (error) {
        console.error('查看详情失败:', error);
        showToast('❌ 查看详情失败');
    }
}

// 显示上架模态框
function showListModal(assetId) {
    document.getElementById('listAssetId').value = assetId;
    openModal('listAssetModal');
}

// 显示转移模态框
function showTransferModal(assetId) {
    document.getElementById('transferAssetId').value = assetId;
    openModal('transferAssetModal');
}

// 购买资产
async function buyAsset(assetId, price) {
    // 确认购买
    const priceInEth = ethers.formatEther(price);
    if (!confirm(`确认购买此资产？\n价格: ${priceInEth} ETH\n\n点击"确定"继续购买`)) {
        return;
    }
    
    try {
        showLoader('正在处理购买...');
        showToast('⏳ 正在处理购买...');
        
        const tx = await contract.createOrder(assetId, { value: price });
        showLoader('等待交易确认...');
        showToast('⏳ 等待交易确认...');
        
        await tx.wait();
        hideLoader();
        showToast('✅ 购买成功!');
        
        closeModal('assetDetailModal');
        setTimeout(() => {
            loadData();
        }, 2000);
    } catch (error) {
        hideLoader();
        console.error('购买失败:', error);
        showToast('❌ 购买失败: ' + (error.message || '未知错误'));
    }
}

// 上架资产
async function listAsset(assetId, price) {
    try {
        showLoader('正在上架资产...');
        showToast('⏳ 正在上架...');
        
        const priceWei = ethers.parseEther(price);
        const tx = await contract.listAsset(assetId, priceWei);
        showLoader('等待交易确认...');
        showToast('⏳ 等待交易确认...');
        
        await tx.wait();
        hideLoader();
        showToast('✅ 上架成功!');
        
        closeModal('listAssetModal');
        setTimeout(() => {
            loadData();
        }, 2000);
    } catch (error) {
        hideLoader();
        console.error('上架失败:', error);
        showToast('❌ 上架失败: ' + (error.message || '未知错误'));
    }
}

// 下架资产
async function unlistAsset(assetId) {
    if (!confirm('确认下架此资产？\n\n下架后将不再在市场中显示')) {
        return;
    }
    
    try {
        showLoader('正在下架资产...');
        showToast('⏳ 正在下架...');
        
        const tx = await contract.unlistAsset(assetId);
        showToast('⏳ 等待交易确认...');
        
        await tx.wait();
        hideLoader();
        showToast('✅ 下架成功!');
        
        setTimeout(() => {
            loadData();
        }, 2000);
    } catch (error) {
        hideLoader();
        console.error('下架失败:', error);
        showToast('❌ 下架失败');
    }
}

// 转移资产
async function transferAsset(assetId, toAddress) {
    if (!confirm(`确认转移资产？\n\n接收地址: ${toAddress}\n\n转移后资产所有权将变更`)) {
        return;
    }
    
    try {
        showLoader('正在转移资产...');
        showToast('⏳ 正在转移...');
        
        const tx = await contract.transferAsset(assetId, toAddress);
        showToast('⏳ 等待交易确认...');
        
        await tx.wait();
        hideLoader();
        showToast('✅ 转移成功!');
        
        closeModal('transferAssetModal');
        setTimeout(() => {
            loadData();
        }, 2000);
    } catch (error) {
        hideLoader();
        console.error('转移失败:', error);
        showToast('❌ 转移失败');
    }
}

// 一键填写表单
function autoFillForm() {
    const brands = ['Nike', 'Adidas', 'Gucci', 'Louis Vuitton', 'Chanel', 'Hermès', 'Rolex', 'Apple'];
    const categories = ['shoes', 'clothing', 'accessories', 'bags', 'watches', 'jewelry', 'electronics'];
    const colors = ['黑色', '白色', '红色', '蓝色', '绿色', '金色', '银色'];
    const sizes = ['36', '37', '38', '39', '40', '41', '42', 'S', 'M', 'L', 'XL'];
    const conditions = ['new', 'used', 'refurbished'];
    const locations = ['广东省-广州市-天河区', '广东省-深圳市-南山区', '浙江省-杭州市-西湖区', '上海市-上海市-浦东新区'];
    
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    const brand = random(brands);
    const category = random(categories);
    const color = random(colors);
    const size = random(sizes);
    const condition = random(conditions);
    const location = random(locations);
    
    const productNames = {
        shoes: 'Air Jordan 1',
        clothing: '连帽卫衣',
        accessories: '手提包',
        bags: '双肩包',
        watches: '机械表',
        jewelry: '项链',
        electronics: '智能手机'
    };
    
    const name = `${brand} ${productNames[category] || '商品'}`;
    const model = `${productNames[category]} Pro Max`;
    const description = '全新未拆封，原装正品，支持专柜验货。经典款式，品质保证，附带完整包装和配件。';
    
    // 生成序列号
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const serialNumber = `${brand.toUpperCase().replace(/\s+/g, '')}-${category.toUpperCase()}-${dateStr}-${randomNum}`;
    
    // 生成生产日期（最近一年内）
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 365);
    const productionDate = new Date(today.getTime() - randomDays * 24 * 60 * 60 * 1000);
    const formattedDate = productionDate.toISOString().split('T')[0];
    
    // 填充表单
    document.getElementById('assetName').value = name;
    document.getElementById('serialNumber').value = serialNumber;
    document.getElementById('description').value = description;
    document.getElementById('category').value = category;
    document.getElementById('brand').value = brand;
    document.getElementById('model').value = model;
    document.getElementById('size').value = size;
    document.getElementById('color').value = color;
    document.querySelector(`input[name="condition"][value="${condition}"]`).checked = true;
    document.getElementById('productionDate').value = formattedDate;
    document.getElementById('productionLocation').value = location;
    document.getElementById('nfcTagId').value = `NFC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    document.getElementById('certificateUrl').value = `https://certificate.${brand.toLowerCase().replace(/\s+/g, '')}.com/${Math.random().toString(36).substring(2, 10)}`;
    
    // 随机决定是否上架
    const shouldList = Math.random() > 0.5;
    document.getElementById('listImmediately').checked = shouldList;
    if (shouldList) {
        document.getElementById('priceSection').classList.remove('hidden');
        document.getElementById('price').value = (Math.random() * 5 + 0.1).toFixed(3);
    }
    
    showToast(`✅ 已自动填充！\n商品：${name}\n序列号：${serialNumber}\n⚠️ 请记得上传图片！`);
}

// 生成序列号
function generateSerialNumber() {
    const brand = document.getElementById('brand').value || 'BRAND';
    const category = document.getElementById('category').value || 'ITEM';
    
    const brandPrefix = brand.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'BRD';
    const categoryMap = {
        'shoes': 'SHOES',
        'clothing': 'CLOTH',
        'accessories': 'ACCES',
        'bags': 'BAGS',
        'watches': 'WATCH',
        'jewelry': 'JEWEL',
        'electronics': 'ELECT',
        'collectibles': 'COLLEC',
        'sports': 'SPORT',
        'other': 'OTHER'
    };
    const categoryPrefix = categoryMap[category] || 'ITEM';
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const serialNumber = `${brandPrefix}-${categoryPrefix}-${dateStr}-${randomNum}`;
    
    document.getElementById('serialNumber').value = serialNumber;
    showToast('✅ 序列号已生成！');
}

// 重置注册表单
function resetRegisterForm() {
    document.getElementById('registerForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('priceSection').classList.add('hidden');
    document.getElementById('formErrors').classList.add('hidden');
    uploadedImages = [];
    showToast('✅ 表单已重置');
}

// 处理图片上传
let uploadedImages = [];
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    uploadedImages = [];
    
    if (files.length > 5) {
        showToast('⚠️ 最多只能上传 5 张图片');
        files.splice(5);
    }
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImages.push(event.target.result);
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative';
            imgContainer.innerHTML = `
                <img src="${event.target.result}" class="w-full h-32 object-cover rounded-lg">
                <button type="button" onclick="removeImage(${index})" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                    ×
                </button>
            `;
            preview.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    });
}

// 删除图片
function removeImage(index) {
    uploadedImages.splice(index, 1);
    const fileInput = document.getElementById('assetImages');
    fileInput.value = '';
    document.getElementById('imagePreview').innerHTML = '';
    showToast('✅ 图片已删除');
}

// 处理注册提交
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    // 收集表单数据
    const formData = {
        name: document.getElementById('assetName').value,
        serialNumber: document.getElementById('serialNumber').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        size: document.getElementById('size').value,
        color: document.getElementById('color').value,
        condition: document.querySelector('input[name="condition"]:checked').value,
        productionDate: document.getElementById('productionDate').value,
        productionLocation: document.getElementById('productionLocation').value,
        nfcTagId: document.getElementById('nfcTagId').value,
        certificateUrl: document.getElementById('certificateUrl').value,
        listImmediately: document.getElementById('listImmediately').checked,
        price: document.getElementById('price').value
    };
    
    // 验证必填字段
    const errors = [];
    if (!formData.name) errors.push('请输入资产名称');
    if (!formData.serialNumber) errors.push('请输入序列号');
    if (!formData.category) errors.push('请选择商品分类');
    if (!formData.brand) errors.push('请输入品牌');
    if (uploadedImages.length === 0) errors.push('请至少上传一张商品照片');
    if (formData.listImmediately && !formData.price) errors.push('立即上架需要设置价格');
    
    if (errors.length > 0) {
        const errorList = document.getElementById('errorList');
        errorList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
        document.getElementById('formErrors').classList.remove('hidden');
        showToast('❌ 请完善表单信息');
        return;
    }
    
    document.getElementById('formErrors').classList.add('hidden');
    
    try {
        showLoader('正在注册资产...');
        showToast('⏳ 正在注册资产...');
        
        // 生成元数据 URI（简化版，实际应该上传到 IPFS）
        const metadata = JSON.stringify({
            name: formData.name,
            description: formData.description,
            attributes: [
                { trait_type: 'Brand', value: formData.brand },
                { trait_type: 'Category', value: formData.category },
                { trait_type: 'Model', value: formData.model },
                { trait_type: 'Size', value: formData.size },
                { trait_type: 'Color', value: formData.color },
                { trait_type: 'Condition', value: formData.condition }
            ],
            images: uploadedImages
        });
        
        const metadataURI = `data:application/json;base64,${btoa(metadata)}`;
        
        // 注册资产
        let tx;
        if (isBrand) {
            tx = await contract.registerAsset(formData.name, formData.serialNumber, metadataURI);
        } else {
            tx = await contract.registerAssetByUser(formData.name, formData.serialNumber, metadataURI);
        }
        
        showToast('⏳ 等待交易确认...');
        const receipt = await tx.wait();
        
        // 获取资产 ID
        let assetId;
        for (const log of receipt.logs) {
            try {
                const parsedLog = contract.interface.parseLog({
                    topics: [...log.topics],
                    data: log.data
                });
                if (parsedLog && parsedLog.name === 'AssetRegistered') {
                    assetId = parsedLog.args.assetId;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // 如果需要立即上架
        if (formData.listImmediately && formData.price && assetId) {
            showToast('⏳ 正在上架资产...');
            const price = ethers.parseEther(formData.price);
            const listTx = await contract.listAsset(assetId, price);
            await listTx.wait();
        }
        
        hideLoader();
        showToast('✅ 注册成功！');
        
        // 重置表单并切换到我的资产页面
        resetRegisterForm();
        setTimeout(() => {
            switchTab('myAssets');
        }, 2000);
        
    } catch (error) {
        hideLoader();
        console.error('注册失败:', error);
        showToast('❌ 注册失败: ' + (error.message || '未知错误'));
    }
}

// 注册资产（保留旧函数以兼容）
async function registerAsset(name, serialNumber, metadataURI) {
    try {
        showToast('⏳ 正在注册...');
        
        let tx;
        if (isBrand) {
            tx = await contract.registerAsset(name, serialNumber, metadataURI || "");
        } else {
            tx = await contract.registerAssetByUser(name, serialNumber, metadataURI || "");
        }
        
        showToast('⏳ 等待交易确认...');
        await tx.wait();
        showToast('✅ 注册成功!');
        
        // 切换到我的资产页面
        switchTab('myAssets');
        setTimeout(() => {
            loadData();
        }, 2000);
    } catch (error) {
        console.error('注册失败:', error);
        showToast('❌ 注册失败');
    }
}

// 订单操作
async function shipOrder(orderId) {
    try {
        showToast('⏳ 正在发货...');
        const tx = await contract.shipOrder(orderId);
        await tx.wait();
        showToast('✅ 发货成功!');
        setTimeout(() => loadData(), 2000);
    } catch (error) {
        console.error('发货失败:', error);
        showToast('❌ 发货失败');
    }
}

async function confirmDelivery(orderId) {
    try {
        showToast('⏳ 正在确认收货...');
        const tx = await contract.confirmDelivery(orderId);
        await tx.wait();
        showToast('✅ 确认收货成功!');
        setTimeout(() => loadData(), 2000);
    } catch (error) {
        console.error('确认收货失败:', error);
        showToast('❌ 确认收货失败');
    }
}

async function completeOrder(orderId) {
    try {
        showToast('⏳ 正在完成交易...');
        const tx = await contract.completeOrder(orderId);
        await tx.wait();
        showToast('✅ 交易完成!');
        setTimeout(() => loadData(), 2000);
    } catch (error) {
        console.error('完成交易失败:', error);
        showToast('❌ 完成交易失败');
    }
}

async function requestRefund(orderId) {
    try {
        showToast('⏳ 正在申请退款...');
        const tx = await contract.requestRefund(orderId);
        await tx.wait();
        showToast('✅ 退款成功!');
        setTimeout(() => loadData(), 2000);
    } catch (error) {
        console.error('退款失败:', error);
        showToast('❌ 退款失败');
    }
}

// 切换标签
function switchTab(tab) {
    currentTab = tab;
    
    // 更新标签按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    // 显示/隐藏内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const contentMap = {
        'marketplace': 'marketplaceContent',
        'myAssets': 'myAssetsContent',
        'myOrders': 'myOrdersContent',
        'register': 'registerContent'
    };
    
    document.getElementById(contentMap[tab]).classList.remove('hidden');
    
    // 显示/隐藏搜索栏
    if (tab === 'register') {
        document.getElementById('searchBar').classList.add('hidden');
        document.getElementById('statsSection').classList.add('hidden');
    } else {
        document.getElementById('searchBar').classList.remove('hidden');
        document.getElementById('statsSection').classList.remove('hidden');
    }
    
    // 加载数据
    loadData();
}

// 搜索资产
async function searchAssets() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        loadData();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        const assets = data.data || [];
        
        if (currentTab === 'marketplace') {
            const listedAssets = assets.filter(a => a.isListed);
            const container = document.getElementById('marketplaceAssets');
            container.innerHTML = '';
            listedAssets.forEach(asset => {
                container.appendChild(createAssetCard(asset, 'marketplace'));
            });
        } else if (currentTab === 'myAssets') {
            const myAssets = assets.filter(a => a.owner.toLowerCase() === currentAccount.toLowerCase());
            const container = document.getElementById('myAssetsList');
            container.innerHTML = '';
            myAssets.forEach(asset => {
                container.appendChild(createAssetCard(asset, 'myAssets'));
            });
        }
    } catch (error) {
        console.error('搜索失败:', error);
        showToast('❌ 搜索失败');
    }
}

// 事件监听器
document.addEventListener('DOMContentLoaded', () => {
    // 初始化 Swiper
    initSwiper();
    
    // 连接钱包按钮
    document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
    
    // 复制地址按钮
    document.getElementById('copyAddressBtn').addEventListener('click', copyAddress);
    
    // 标签切换
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
    
    // 搜索按钮
    document.getElementById('searchBtn').addEventListener('click', searchAssets);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchAssets();
        }
    });
    
    // 刷新按钮
    document.getElementById('refreshBtn').addEventListener('click', loadData);
    
    // 一键填写按钮
    document.getElementById('autoFillBtn')?.addEventListener('click', autoFillForm);
    
    // 自动生成序列号按钮
    document.getElementById('generateSerialBtn')?.addEventListener('click', generateSerialNumber);
    
    // 重置表单按钮
    document.getElementById('resetFormBtn')?.addEventListener('click', resetRegisterForm);
    
    // 立即上架复选框
    document.getElementById('listImmediately')?.addEventListener('change', (e) => {
        const priceSection = document.getElementById('priceSection');
        if (e.target.checked) {
            priceSection.classList.remove('hidden');
        } else {
            priceSection.classList.add('hidden');
        }
    });
    
    // 图片上传预览
    document.getElementById('assetImages')?.addEventListener('change', handleImageUpload);
    
    // 注册表单
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegisterSubmit(e);
    });
    
    // 上架表单
    document.getElementById('listAssetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const assetId = document.getElementById('listAssetId').value;
        const price = document.getElementById('listAssetPrice').value;
        
        await listAsset(assetId, price);
        
        e.target.reset();
    });
    
    // 转移表单
    document.getElementById('transferAssetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const assetId = document.getElementById('transferAssetId').value;
        const toAddress = document.getElementById('transferToAddress').value;
        
        await transferAsset(assetId, toAddress);
        
        e.target.reset();
    });
    
    // 点击模态框背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});
