/**
 * AssetRegistryV3 智能合约部署脚本
 * 
 * 功能说明：
 * 1. 部署 AssetRegistryV3 合约到指定网络
 * 2. 验证部署是否成功
 * 3. 输出合约地址和初始状态
 * 
 * 使用方法：
 * - 本地网络：npx hardhat run scripts/deployV3.ts --network localhost
 * - 测试网：npx hardhat run scripts/deployV3.ts --network sepolia
 * 
 * 注意事项：
 * - 确保 Hardhat 节点正在运行（本地网络）
 * - 确保部署账户有足够的 ETH
 * - 部署后需要更新前端和后端的合约地址
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 开始部署 AssetRegistryV3 合约...");
  console.log("=" .repeat(50));

  // 获取部署账户（默认使用第一个账户）
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  
  // 查询账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");

  // 检查余额是否足够（至少需要 0.01 ETH）
  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ 账户余额不足，至少需要 0.01 ETH");
    process.exit(1);
  }

  // 获取合约工厂（用于部署合约）
  console.log("\n📜 正在编译合约...");
  const AssetRegistryV3 = await ethers.getContractFactory("AssetRegistryV3");
  
  // 部署合约（发送交易到区块链）
  console.log("📤 正在部署合约...");
  const contract = await AssetRegistryV3.deploy();
  
  // 等待合约部署完成（等待交易被打包）
  await contract.waitForDeployment();

  // 获取合约地址
  const contractAddress = await contract.getAddress();
  console.log("\n✅ 合约部署成功！");
  console.log("📍 合约地址:", contractAddress);

  // ==================== 验证部署 ====================
  console.log("\n🔍 验证部署状态...");
  console.log("-" .repeat(50));
  
  // 查询管理员地址（应该是部署者）
  const admin = await contract.admin();
  console.log("👤 管理员地址:", admin);
  
  // 查询平台手续费（默认2%）
  const platformFee = await contract.platformFeePercent();
  console.log("💵 平台手续费:", platformFee.toString() + "%");
  
  // 查询资产计数器（初始应该是0）
  const assetCounter = await contract.assetCounter();
  console.log("📦 当前资产总数:", assetCounter.toString());
  
  // 查询订单计数器（初始应该是0）
  const orderCounter = await contract.orderCounter();
  console.log("🛒 当前订单总数:", orderCounter.toString());

  // ==================== 部署后提示 ====================
  console.log("\n" + "=".repeat(50));
  console.log("📋 部署完成！请按照以下步骤更新配置：");
  console.log("=".repeat(50));
  console.log("\n1️⃣  更新前端配置：");
  console.log("   文件: frontend/src/AppV3.tsx");
  console.log("   修改: const CONTRACT_ADDRESS = \"" + contractAddress + "\"");
  
  console.log("\n2️⃣  更新后端配置：");
  console.log("   文件: backend/.env");
  console.log("   修改: CONTRACT_ADDRESS=" + contractAddress);
  
  console.log("\n3️⃣  重启服务：");
  console.log("   - 重启后端服务（事件监听器会自动同步）");
  console.log("   - 刷新前端页面");
  
  console.log("\n📄 合约地址（复制使用）:");
  console.log(contractAddress);
  console.log("\n✨ 部署脚本执行完毕！");
}

// 执行主函数
main()
  .then(() => {
    console.log("\n✅ 部署成功，进程正常退出");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 部署失败:");
    console.error(error);
    process.exit(1);
  });

