import { ethers } from "hardhat";

async function main() {
  console.log("\n🏢 开始设置品牌授权...");
  console.log("=".repeat(50));

  // 获取合约实例
  const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const AssetRegistry = await ethers.getContractFactory("AssetRegistryV3");
  const contract = AssetRegistry.attach(contractAddress);

  // 获取账户
  const [admin, account1] = await ethers.getSigners();
  
  console.log("\n📋 账户信息:");
  console.log(`管理员地址: ${admin.address}`);
  console.log(`测试账户: ${account1.address}`);

  // 检查当前品牌状态
  console.log("\n🔍 检查品牌状态...");
  const brandInfo = await contract.brands(admin.address);
  console.log(`品牌地址: ${brandInfo.brandAddress}`);
  console.log(`品牌名称: ${brandInfo.brandName}`);
  console.log(`是否授权: ${brandInfo.isAuthorized}`);

  if (brandInfo.brandAddress === ethers.ZeroAddress) {
    // 品牌未注册，先注册
    console.log("\n📝 注册品牌...");
    const registerTx = await contract.registerBrand("Nike");
    await registerTx.wait();
    console.log("✅ 品牌注册成功");
  } else {
    console.log("\n✅ 品牌已注册");
  }

  // 检查是否已授权
  const updatedBrandInfo = await contract.brands(admin.address);
  if (!updatedBrandInfo.isAuthorized) {
    // 授权品牌
    console.log("\n🔐 授权品牌...");
    const authTx = await contract.authorizeBrand(admin.address, true);
    await authTx.wait();
    console.log("✅ 品牌授权成功");
  } else {
    console.log("\n✅ 品牌已授权");
  }

  // 验证最终状态
  console.log("\n✅ 最终状态:");
  const finalBrandInfo = await contract.brands(admin.address);
  console.log(`品牌地址: ${finalBrandInfo.brandAddress}`);
  console.log(`品牌名称: ${finalBrandInfo.brandName}`);
  console.log(`是否授权: ${finalBrandInfo.isAuthorized}`);
  console.log(`注册时间: ${new Date(Number(finalBrandInfo.registeredAt) * 1000).toLocaleString()}`);

  console.log("\n" + "=".repeat(50));
  console.log("🎉 品牌设置完成！");
  console.log("\n现在您可以使用该账户注册资产了。");
  console.log("请刷新前端页面，品牌方标签应该会出现。");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
