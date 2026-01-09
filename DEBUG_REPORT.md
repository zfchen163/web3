# 🐛 故障排查报告：注册失败 (Missing Revert Data)

## ❌ 问题描述
您遇到了 `missing revert data (action="estimateGas", ...)` 错误。
这通常发生在前端尝试发送交易时，MetaMask 与本地区块链节点的状态不一致。

## 🔍 排查结果
我们已通过脚本验证了以下内容：
1. **合约状态正常**：合约存在于 `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e`。
2. **功能正常**：我们成功通过脚本模拟了品牌方注册流程，交易已上链。
3. **权限正常**：您的账户已获得品牌授权。

## 💡 根本原因
**Nonce 不匹配 (Nonce Mismatch)**

当您重启 Hardhat 本地节点 (`npx hardhat node`) 时，区块链被重置，所有账户的交易计数 (Nonce) 归零。
但是，您的 MetaMask 钱包仍然"记住"了之前的交易历史（例如 Nonce = 10）。
当您再次发起交易时，MetaMask 发送 Nonce = 11 的交易，但区块链节点期待的是 Nonce = 0。
这种不匹配导致节点拒绝交易，从而报出 "estimateGas failed" 或 "missing revert data" 错误。

## 🛠 解决方案：重置 MetaMask 账户

请按照以下步骤重置您的 MetaMask 账户（这**不会**丢失资产，只会清除交易历史）：

1. 打开浏览器中的 **MetaMask** 插件。
2. 确保您连接的是 **Localhost 8545** 网络。
3. 点击右上角的 **圆形头像**。
4. 选择 **设置 (Settings)**。
5. 点击 **高级 (Advanced)**。
6. 向下滚动，点击 **清除活动标签数据 (Clear activity tab data)** 或 **重置账户 (Reset Account)**。
   - *注意：新版 MetaMask 叫 "Clear activity tab data" 或类似名称*。
7. 点击 **重置 (Reset)** 确认。

## 🔄 重试步骤
1. 完成上述重置操作。
2. 刷新页面 `http://localhost:3000`。
3. 重新连接钱包。
4. 再次尝试注册资产。

## 📦 关于 IPFS/Curl
您提供的 `curl` 命令是正确的，用于生成元数据。我们的测试表明后端处理正常，主要问题在于随后的区块链交易步骤。

如有其他问题，请随时告知！
