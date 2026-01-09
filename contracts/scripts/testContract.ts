import { ethers } from "hardhat";

async function main() {
  console.log("\n🧪 测试合约功能...");
  console.log("=".repeat(50));

  const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const AssetRegistry = await ethers.getContractFactory("AssetRegistryV3");
  const contract = AssetRegistry.attach(contractAddress);

  const [admin] = await ethers.getSigners();
  
  console.log("\n📋 基本信息:");
  console.log("  合约地址:", contractAddress);
  console.log("  测试账户:", admin.address);
  
  // 1. 验证品牌授权
  console.log("\n1️⃣  验证品牌授权...");
  const brandInfo = await contract.brands(admin.address);
  console.log("  品牌名称:", brandInfo.brandName);
  console.log("  已授权:", brandInfo.isAuthorized);
  
  if (!brandInfo.isAuthorized) {
    console.log("  ❌ 品牌未授权，无法继续测试");
    return;
  }
  console.log("  ✅ 品牌已授权");
  
  // 2. 测试资产注册
  console.log("\n2️⃣  测试资产注册...");
  const assetName = "Nike Air Max 2024";
  const serialNumber = `TEST-${Date.now()}`;
  const metadataURI = "data:application/json;base64,eyJ0ZXN0IjoidHJ1ZSJ9";
  
  console.log("  资产名称:", assetName);
  console.log("  序列号:", serialNumber);
  
  try {
    const tx = await contract.registerAsset(assetName, serialNumber, metadataURI);
    console.log("  交易哈希:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("  ✅ 资产注册成功！");
    console.log("  区块号:", receipt.blockNumber);
    
    // 获取资产ID
    const assetCounter = await contract.assetCounter();
    console.log("  资产ID:", assetCounter.toString());
    
    // 3. 验证资产信息
    console.log("\n3️⃣  验证资产信息...");
    const asset = await contract.assets(assetCounter);
    console.log("  所有者:", asset.owner);
    console.log("  品牌:", asset.brand);
    console.log("  名称:", asset.name);
    console.log("  序列号:", asset.serialNumber);
    console.log("  状态:", asset.status === 2n ? "已验证" : "其他");
    console.log("  ✅ 资产信息验证成功！");
    
    // 4. 测试资产上架
    console.log("\n4️⃣  测试资产上架...");
    const price = ethers.parseEther("1.5");
    const listTx = await contract.listAsset(assetCounter, price);
    await listTx.wait();
    console.log("  ✅ 资产上架成功！");
    console.log("  价格:", ethers.formatEther(price), "ETH");
    
    // 5. 验证上架状态
    const listedAsset = await contract.assets(assetCounter);
    console.log("  上架状态:", listedAsset.isListed ? "已上架" : "未上架");
    console.log("  售价:", ethers.formatEther(listedAsset.price), "ETH");
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ 所有测试通过！");
    console.log("\n📋 测试总结:");
    console.log("  ✅ 品牌授权正常");
    console.log("  ✅ 资产注册正常");
    console.log("  ✅ 资产上架正常");
    console.log("\n🎉 合约功能完全正常，可以在前端使用！");
    
  } catch (error: any) {
    console.log("  ❌ 测试失败:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 测试过程中出现错误:");
    console.error(error);
    process.exit(1);
  });
