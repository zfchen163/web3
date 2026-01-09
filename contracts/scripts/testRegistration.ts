
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const serialNumber = "ADIDAS-ITEM-20260109-7909-TEST"; // Use a new one to be sure

  console.log(`Testing registration on contract at ${contractAddress}...`);

  try {
      const AssetRegistryV3 = await ethers.getContractFactory("AssetRegistryV3");
      const contract = AssetRegistryV3.attach(contractAddress);
      const [deployer] = await ethers.getSigners();

      console.log("Registering asset as brand...");
      
      // Simulate the data URI
      const metadataURI = "data:application/json;base64,eyJuYW1lIjoidGVzdCJ9";

      // Register as brand
      const tx = await contract.registerAsset(
          "Test Asset",
          serialNumber,
          metadataURI
      );
      
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      console.log("✅ Registration successful!");

  } catch (error) {
      console.error("❌ Registration failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
