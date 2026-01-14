# ChainVault 快速启动指南

## 🚀 立即访问新 UI

### 最简单的方式（推荐）

如果前端服务已启动，直接在浏览器打开：

```
http://localhost:3000/index-native.html
```

或者访问版本选择页面：

```
http://localhost:3000/welcome.html
```

---

## 📋 所有访问方式

### 方式 1: Vite 开发服务器（当前可用）

前提：前端服务已启动

```bash
# 访问原生 HTML 版本
http://localhost:3000/index-native.html

# 访问版本选择页面
http://localhost:3000/welcome.html

# 访问 React 版本
http://localhost:3000/
```

### 方式 2: 使用启动脚本

```bash
cd frontend/public
./start-native.sh
```

这将：
- 启动 HTTP 服务器（端口 3002）
- 自动打开浏览器

### 方式 3: 手动启动服务器

```bash
cd frontend/public
python3 -m http.server 3002
```

然后访问：`http://localhost:3002/index-native.html`

---

## 🎨 新 UI 特性

### ✨ 视觉设计
- 紫蓝渐变主题
- 玻璃态效果
- 流畅动画
- 卡片悬停效果

### 🎬 Swiper 轮播
- 欢迎页面特性展示
- 资产详情图片轮播
- 自动播放 + 分页

### 📱 响应式布局
- 移动端：1 列
- 平板：2 列
- 桌面：3 列

---

## 📁 重要文件

```
frontend/public/
├── index-native.html    # 新 UI 主页面
├── app.js              # JavaScript 逻辑
├── start-native.sh     # 启动脚本
└── welcome.html        # 版本选择

根目录/
├── QUICK_START.md           # 本文档
├── UI_UPGRADE_SUMMARY.md    # 升级总结
└── NATIVE_UI_GUIDE.md       # 详细指南
```

---

## 🔧 前置要求

1. ✅ 安装 MetaMask 浏览器扩展
2. ✅ 后端服务运行中（端口 8080）
3. ✅ 区块链节点运行中（端口 8545）
4. ✅ 前端服务运行中（端口 3000 或 5173）

---

## 💡 快速测试

### 1. 连接钱包
点击右上角"连接钱包"按钮

### 2. 浏览市场
查看所有在售资产

### 3. 注册资产
填写表单并提交到区块链

### 4. 购买资产
选择资产并完成购买

---

## 🆚 版本对比

| 特性 | React 版本 | 原生 HTML 版本 |
|------|-----------|---------------|
| UI 设计 | 标准 | ✨ 现代渐变 |
| 轮播图 | ❌ | ✅ Swiper |
| 加载速度 | 中等 | ⚡ 快速 |
| 构建需求 | 需要 | ❌ 不需要 |
| 动画效果 | 基础 | 🎬 丰富 |

---

## 📞 遇到问题？

### 检查清单
- [ ] 服务器是否启动？
- [ ] MetaMask 是否安装？
- [ ] 网络连接是否正常？
- [ ] 控制台是否有错误？

### 查看文档
- `NATIVE_UI_GUIDE.md` - 详细使用指南
- `UI_UPGRADE_SUMMARY.md` - 升级说明

---

## 🎉 开始使用

现在就访问新 UI，体验全新的 ChainVault！

```
👉 http://localhost:3000/index-native.html
```

或选择版本：

```
👉 http://localhost:3000/welcome.html
```

---

**祝您使用愉快！** 🚀
