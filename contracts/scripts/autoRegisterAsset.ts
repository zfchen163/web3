import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * 自动化资产注册脚本
 * 直接通过智能合约注册资产，无需前端界面
 */
async function main() {
  console.log("\n🤖 自动化资产注册测试");
  console.log("=".repeat(60));

  // 合约地址
  const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  
  // 获取合约实例
  const AssetRegistry = await ethers.getContractFactory("AssetRegistryV3");
  const contract = AssetRegistry.attach(contractAddress);

  // 获取账户
  const [admin] = await ethers.getSigners();
  
  console.log("\n📋 测试信息:");
  console.log("  合约地址:", contractAddress);
  console.log("  测试账户:", admin.address);

  // 1. 验证品牌授权
  console.log("\n1️⃣  验证品牌授权...");
  const brandInfo = await contract.brands(admin.address);
  console.log("  品牌名称:", brandInfo.brandName);
  console.log("  已授权:", brandInfo.isAuthorized);
  
  if (!brandInfo.isAuthorized) {
    console.log("  ❌ 品牌未授权，无法继续");
    return;
  }
  console.log("  ✅ 品牌已授权");

  // 2. 读取图片并转换为 Base64
  console.log("\n2️⃣  处理图片...");
  const imagePath = "/Users/h/practice/chain-vault/Weixin Image_20260107155536_130_341.jpg";
  
  let imageBase64 = "";
  if (fs.existsSync(imagePath)) {
    const imageBuffer = fs.readFileSync(imagePath);
    imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    console.log("  ✅ 图片已读取，大小:", (imageBuffer.length / 1024).toFixed(2), "KB");
  } else {
    console.log("  ⚠️  图片文件不存在，将使用空图片");
  }

  // 3. 生成元数据（不包含图片，图片单独存储到数据库）
  console.log("\n3️⃣  生成元数据...");
  const metadata = {
    name: "美味面包",
    description: "新鲜出炉的美味面包，金黄酥脆，口感绝佳",
    serialNumber: `BREAD-${Date.now()}`,
    brand: {
      name: "Nike",
      address: admin.address,
      verified: true
    },
    product: {
      category: "food",
      model: "Classic Bread",
      size: "Medium",
      color: "Golden",
      condition: "new",
      productionDate: new Date().toISOString().split('T')[0],
      productionLocation: "北京市 朝阳区"
    },
    media: {
      images: [] // 图片不存储在链上，只存储在数据库
    }
  };

  // 将元数据转换为 Base64 URI
  const metadataJSON = JSON.stringify(metadata);
  const metadataURI = `data:application/json;base64,${Buffer.from(metadataJSON).toString('base64')}`;
  
  console.log("  资产名称:", metadata.name);
  console.log("  序列号:", metadata.serialNumber);
  console.log("  元数据大小:", (metadataJSON.length / 1024).toFixed(2), "KB");
  console.log("  💡 图片将单独存储到数据库（不上链）");

  // 4. 注册资产到区块链
  console.log("\n4️⃣  注册资产到区块链...");
  try {
    const tx = await contract.registerAsset(
      metadata.name,
      metadata.serialNumber,
      metadataURI
    );
    
    console.log("  交易哈希:", tx.hash);
    console.log("  等待确认...");
    
    const receipt = await tx.wait();
    console.log("  ✅ 交易已确认！");
    console.log("  区块号:", receipt.blockNumber);
    console.log("  Gas 使用:", receipt.gasUsed.toString());

    // 获取资产 ID
    const assetCounter = await contract.assetCounter();
    console.log("  资产 ID:", assetCounter.toString());

    // 5. 验证资产信息
    console.log("\n5️⃣  验证资产信息...");
    const asset = await contract.assets(assetCounter);
    console.log("  所有者:", asset.owner);
    console.log("  品牌:", asset.brand);
    console.log("  名称:", asset.name);
    console.log("  序列号:", asset.serialNumber);
    console.log("  状态:", asset.status === 2n ? "已验证" : "其他");
    console.log("  是否上架:", asset.isListed);

    // 6. 可选：上架资产
    const shouldList = false; // 改为 true 可以自动上架
    if (shouldList) {
      console.log("\n6️⃣  上架资产...");
      const price = ethers.parseEther("1.5");
      const listTx = await contract.listAsset(assetCounter, price);
      await listTx.wait();
      console.log("  ✅ 资产已上架，价格:", ethers.formatEther(price), "ETH");
    }

    // 7. 保存到后端数据库（可选）
    console.log("\n7️⃣  保存图片到后端...");
    if (imageBase64) {
      try {
        const response = await fetch(`http://localhost:8080/assets/${assetCounter}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: [imageBase64] })
        });
        
        if (response.ok) {
          console.log("  ✅ 图片已保存到数据库");
        } else {
          console.log("  ⚠️  图片保存失败，但资产已注册成功");
        }
      } catch (err) {
        console.log("  ⚠️  无法连接到后端，但资产已注册成功");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 资产注册成功！");
    console.log("=".repeat(60));
    console.log("\n📊 注册摘要:");
    console.log("  资产 ID:", assetCounter.toString());
    console.log("  资产名称:", metadata.name);
    console.log("  序列号:", metadata.serialNumber);
    console.log("  交易哈希:", tx.hash);
    console.log("  区块号:", receipt.blockNumber);
    console.log("\n💡 提示:");
    console.log("  - 在前端访问 http://localhost:3000");
    console.log("  - 点击 '我的资产' 查看刚注册的资产");
    console.log("  - 资产应该显示图片和完整信息");

  } catch (error: any) {
    console.error("\n❌ 注册失败:");
    console.error("  错误信息:", error.message);
    if (error.data) {
      console.error("  错误数据:", error.data);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 脚本执行失败:");
    console.error(error);
    process.exit(1);
  });
