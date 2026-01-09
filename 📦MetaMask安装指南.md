# 📦 MetaMask 安装和配置指南

## 🦊 步骤 1: 安装 MetaMask

### Chrome / Brave / Edge 浏览器

1. **访问 MetaMask 官网**
   ```
   https://metamask.io/download/
   ```

2. **点击 "Install MetaMask for Chrome"**

3. **在 Chrome 网上应用店中点击 "添加至 Chrome"**

4. **等待安装完成**（会在浏览器右上角出现狐狸图标 🦊）

### Firefox 浏览器

1. 访问 `https://metamask.io/download/`
2. 选择 "Install MetaMask for Firefox"
3. 在 Firefox 附加组件页面点击 "添加到 Firefox"

### Safari 浏览器

1. 访问 `https://metamask.io/download/`
2. 选择 "Install MetaMask for Safari"
3. 从 Mac App Store 下载并安装

---

## 🔧 步骤 2: 创建或导入钱包

### 首次使用（创建新钱包）

1. **点击浏览器右上角的 MetaMask 图标 🦊**

2. **点击 "开始使用"**

3. **选择 "创建新钱包"**

4. **同意条款**

5. **创建密码**（至少 8 个字符）
   - ⚠️ 这个密码用于解锁 MetaMask，请妥善保管

6. **备份助记词**（非常重要！）
   - 系统会显示 12 个英文单词
   - ⚠️ **请务必抄写并妥善保管这些单词**
   - 这是恢复钱包的唯一方式
   - 不要截图或保存在电脑上

7. **确认助记词**
   - 按顺序点击助记词以确认您已正确备份

8. **完成！** 🎉

### 已有钱包（导入现有钱包）

1. 点击 "导入现有钱包"
2. 输入您的 12 个助记词
3. 创建新密码
4. 完成导入

---

## 🌐 步骤 3: 添加本地测试网络

为了使用 ChainVault，您需要连接到本地 Hardhat 测试网络：

### 方法 1: 手动添加网络

1. **打开 MetaMask**

2. **点击顶部的网络下拉菜单**（默认显示 "Ethereum Mainnet"）

3. **点击 "添加网络"**

4. **点击 "手动添加网络"**

5. **填写以下信息：**
   ```
   网络名称:        Hardhat Local
   RPC URL:         http://127.0.0.1:8545
   链 ID:           31337
   货币符号:        ETH
   区块浏览器 URL:  (留空)
   ```

6. **点击 "保存"**

7. **切换到 "Hardhat Local" 网络**

### 方法 2: 使用自动配置脚本

我为您准备了一个自动配置页面，打开后会自动添加网络：

```bash
open /Users/h/practice/web3/chain-vault/配置MetaMask网络.html
```

---

## 💰 步骤 4: 导入测试账户

Hardhat 本地节点会自动创建 20 个测试账户，每个账户有 10000 ETH。

### 导入账户 #0（推荐）

1. **打开 MetaMask**

2. **点击右上角的账户图标**

3. **选择 "导入账户"**

4. **选择类型：私钥**

5. **粘贴以下私钥：**
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

6. **点击 "导入"**

7. **完成！** 现在您有 10000 ETH 可以用于测试 🎉

### 其他测试账户

如果需要多个账户进行测试，可以导入以下私钥：

```
账户 #0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
账户 #1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
账户 #2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

⚠️ **注意：** 这些是测试私钥，**永远不要**在主网或真实资金中使用！

---

## ✅ 步骤 5: 验证配置

### 检查清单

- [ ] MetaMask 已安装（浏览器右上角有 🦊 图标）
- [ ] 已创建或导入钱包
- [ ] 已添加 "Hardhat Local" 网络
- [ ] 当前网络已切换到 "Hardhat Local"
- [ ] 已导入测试账户
- [ ] 账户余额显示约 10000 ETH

### 测试连接

1. **确保 Hardhat 节点正在运行：**
   ```bash
   cd /Users/h/practice/web3/chain-vault/contracts
   npx hardhat node
   ```

2. **打开测试页面：**
   ```bash
   open /Users/h/practice/web3/chain-vault/完整测试页面.html
   ```

3. **点击 "连接钱包" 按钮**

4. **在 MetaMask 弹窗中点击 "下一步" 和 "连接"**

5. **如果看到 "✅ 钱包已连接"，说明配置成功！** 🎉

---

## 🔧 常见问题

### Q1: 找不到 MetaMask 图标？

**A:** 
- 检查浏览器扩展栏（可能被隐藏）
- 点击浏览器右上角的 "拼图" 图标查看所有扩展
- 将 MetaMask 固定到工具栏

### Q2: 无法连接到 Hardhat Local 网络？

**A:** 
- 确保 Hardhat 节点正在运行（`npx hardhat node`）
- 检查 RPC URL 是否正确：`http://127.0.0.1:8545`
- 尝试使用 `http://localhost:8545`

### Q3: 导入账户后余额为 0？

**A:** 
- 确保已切换到 "Hardhat Local" 网络
- 确保 Hardhat 节点正在运行
- 尝试刷新 MetaMask（设置 → 高级 → 重置账户）

### Q4: MetaMask 显示 "Nonce too high" 错误？

**A:** 
- 这是因为重启了 Hardhat 节点
- 解决方法：设置 → 高级 → 清除活动数据
- 刷新页面重试

### Q5: 在哪个浏览器上使用 MetaMask 最好？

**A:** 
- **推荐：Chrome、Brave、Edge**（兼容性最好）
- Firefox 也支持，但某些功能可能有差异
- Safari 支持，但需要从 App Store 下载

---

## 🚨 安全提示

### ⚠️ 重要：测试环境 vs 真实环境

**测试环境（本地 Hardhat）：**
- ✅ 可以使用公开的测试私钥
- ✅ 不涉及真实资金
- ✅ 可以随意实验

**真实环境（主网/测试网）：**
- ❌ **永远不要**使用公开的私钥
- ❌ **永远不要**分享您的助记词或私钥
- ❌ **永远不要**在不信任的网站上连接钱包

### 🔒 保护您的钱包

1. **备份助记词**
   - 写在纸上，存放在安全的地方
   - 不要截图或保存在电脑上
   - 不要通过网络传输

2. **使用强密码**
   - 至少 12 个字符
   - 包含大小写字母、数字和符号
   - 不要使用常见密码

3. **警惕钓鱼网站**
   - 始终检查网站 URL
   - 不要点击可疑链接
   - MetaMask 会警告您不安全的网站

4. **定期更新**
   - 保持 MetaMask 扩展为最新版本
   - 关注 MetaMask 官方公告

---

## 📚 更多资源

- **MetaMask 官网：** https://metamask.io/
- **MetaMask 文档：** https://docs.metamask.io/
- **MetaMask 支持：** https://support.metamask.io/

---

## 🎉 完成后的下一步

配置完成后，您可以：

1. **使用诊断工具测试连接：**
   ```bash
   open /Users/h/practice/web3/chain-vault/诊断工具.html
   ```

2. **使用完整测试页面进行功能测试：**
   ```bash
   open /Users/h/practice/web3/chain-vault/完整测试页面.html
   ```

3. **访问 ChainVault 前端应用：**
   ```
   http://localhost:3000
   ```

4. **开始注册您的第一个资产！** 🚀
