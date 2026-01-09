import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
  const AssetRegistry = await ethers.getContractFactory("AssetRegistryV3");
  const contract = AssetRegistry.attach(contractAddress);

  const [admin] = await ethers.getSigners();
  
  console.log("\n🔍 验证品牌授权状态...");
  console.log("账户地址:", admin.address);
  
  const brandInfo = await contract.brands(admin.address);
  console.log("\n品牌信息:");
  console.log("  地址:", brandInfo.brandAddress);
  console.log("  名称:", brandInfo.brandName);
  console.log("  已授权:", brandInfo.isAuthorized);
  console.log("  注册时间:", new Date(Number(brandInfo.registeredAt) * 1000).toLocaleString());
  
  if (brandInfo.isAuthorized) {
    console.log("\n✅ 品牌已成功授权！");
  } else {
    console.log("\n❌ 品牌未授权");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
