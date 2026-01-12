# ChainVault 原生 HTML 版本

这是 ChainVault 的原生 HTML + Tailwind CSS + Swiper 实现版本。

## 特性

- ✨ **现代化 UI**: 使用 Tailwind CSS 打造的渐变色和玻璃态效果
- 🎨 **Swiper 轮播**: 特性展示和资产图片轮播
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- ⚡ **原生 JavaScript**: 无需构建，直接运行
- 🔗 **Web3 集成**: 使用 Ethers.js 连接区块链

## 访问方式

### 方式 1: 通过 Vite 开发服务器访问（推荐）

如果您已经启动了前端开发服务器（Vite），直接访问：
```
http://localhost:3000/index-native.html
```

### 方式 2: 直接打开文件

在浏览器中直接打开文件：
```
/Users/h/practice/web3/chain-vault/frontend/public/index-native.html
```

### 方式 3: 使用 Python 简单服务器

在 `frontend/public` 目录下运行：
```bash
cd /Users/h/practice/web3/chain-vault/frontend/public
python3 -m http.server 3002
```

然后访问：
```
http://localhost:3002/index-native.html
```

## 功能说明

### 1. 连接钱包
点击右上角"连接钱包"按钮，连接 MetaMask 钱包。

### 2. 浏览市场
- 查看所有在售资产
- 点击"查看详情"查看资产完整信息
- 点击"购买"购买资产

### 3. 管理资产
- 查看您拥有的所有资产
- 上架/下架资产
- 转移资产给其他用户

### 4. 订单管理
- 查看所有订单
- 卖家发货
- 买家确认收货
- 申请退款

### 5. 注册资产
- 填写资产信息
- 上传资产图片（可选）
- 提交到区块链

## 技术栈

- **HTML5**: 语义化标记
- **Tailwind CSS**: 实用优先的 CSS 框架
- **Swiper**: 现代化的触摸滑块库
- **Ethers.js**: 以太坊 JavaScript 库
- **原生 JavaScript**: ES6+ 特性

## 文件结构

```
public/
├── index-native.html    # 主 HTML 文件
├── app.js              # JavaScript 逻辑
└── README.md           # 说明文档
```

## 配置

如需修改配置，请编辑 `app.js` 文件：

```javascript
const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
const API_URL = "http://localhost:8080";
```

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- Opera: ✅ 完全支持

## 注意事项

1. 确保已安装 MetaMask 浏览器扩展
2. 确保后端 API 服务已启动（http://localhost:8080）
3. 确保连接到正确的区块链网络
4. 确保合约已部署并地址正确

## 开发说明

这是一个纯静态页面，无需构建过程。所有依赖都通过 CDN 加载：

- Tailwind CSS: https://cdn.tailwindcss.com
- Swiper: https://cdn.jsdelivr.net/npm/swiper@11
- Ethers.js: https://cdn.jsdelivr.net/npm/ethers@6.9.0

如需离线使用，可以下载这些库到本地。

## 问题反馈

如遇到问题，请检查：
1. 浏览器控制台是否有错误
2. MetaMask 是否已连接
3. 后端服务是否正常运行
4. 网络连接是否正常
