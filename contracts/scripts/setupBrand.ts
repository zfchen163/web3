import { ethers } from "hardhat";

async function main() {
  console.log("\n🏢 开始设置品牌授权...");
  console.log("=".repeat(50));

  // 获取合约实例
  const contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
  const AssetRegistry = await ethers.getContractFactory("AssetRegistryV3");
  const contract = AssetRegistry.attach(contractAddress);

  // 获取账户
  const [admin, account1] = await ethers.getSigners();
  
  console.log("\n📋 账户信息:");
  console.log(`管理员地址: ${admin.address}`);
  console.log(`测试账户: ${account1.address}`);

  // 检查当前品牌状态
  console.log("\n🔍 检查品牌状态...");
  let brandInfo = { brandAddress: ethers.ZeroAddress, brandName: "", isAuthorized: false, registeredAt: 0 };
  
  try {
    const rawBrandInfo = await contract.brands(admin.address);
    // 处理返回结果：如果是 struct，可以直接访问属性
    // 如果返回数组，则按索引访问 [brandAddress, brandName, isAuthorized, registeredAt]
    if (rawBrandInfo && typeof rawBrandInfo.brandAddress !== 'undefined') {
        brandInfo = rawBrandInfo;
    } else if (Array.isArray(rawBrandInfo)) {
        brandInfo = {
            brandAddress: rawBrandInfo[0],
            brandName: rawBrandInfo[1],
            isAuthorized: rawBrandInfo[2],
            registeredAt: rawBrandInfo[3]
        };
    }
  } catch (e) {
    // 可能是第一次部署，没有数据或者调用失败
    console.log("⚠️ 无法获取品牌信息，假设未注册");
  }

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
  let updatedBrandInfo = { brandAddress: ethers.ZeroAddress, brandName: "", isAuthorized: false, registeredAt: 0 };
  try {
    const rawInfo = await contract.brands(admin.address);
    if (rawInfo && typeof rawInfo.brandAddress !== 'undefined') {
        updatedBrandInfo = rawInfo;
    } else if (Array.isArray(rawInfo)) {
        updatedBrandInfo = {
            brandAddress: rawInfo[0],
            brandName: rawInfo[1],
            isAuthorized: rawInfo[2],
            registeredAt: rawInfo[3]
        };
    }
  } catch (e) {
    console.log("⚠️ 获取更新后的品牌信息失败");
  }

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
  let finalBrandInfo = { brandAddress: ethers.ZeroAddress, brandName: "", isAuthorized: false, registeredAt: 0 };
  try {
    const rawInfo = await contract.brands(admin.address);
    if (rawInfo && typeof rawInfo.brandAddress !== 'undefined') {
        finalBrandInfo = rawInfo;
    } else if (Array.isArray(rawInfo)) {
        finalBrandInfo = {
            brandAddress: rawInfo[0],
            brandName: rawInfo[1],
            isAuthorized: rawInfo[2],
            registeredAt: rawInfo[3]
        };
    }
  } catch (e) {
    console.log("⚠️ 获取最终品牌信息失败");
  }
  
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
