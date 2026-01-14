
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
  const serialNumber = "ADIDAS-ITEM-20260109-7909";

  console.log(`Checking contract at ${contractAddress}...`);

  try {
      const code = await ethers.provider.getCode(contractAddress);
      if (code === "0x") {
          console.log("❌ No contract code found at this address!");
          console.log("Suggestion: Redeploy the contract and update the address in frontend/src/AppV3.tsx");
          return;
      } else {
          console.log("✅ Contract code found.");
      }

      const AssetRegistryV3 = await ethers.getContractFactory("AssetRegistryV3");
      const contract = AssetRegistryV3.attach(contractAddress);

      // Check admin
      const admin = await contract.admin();
      console.log(`Admin address: ${admin}`);

      // Check if serial number exists
      const exists = await contract.serialNumberExists(serialNumber);
      console.log(`Serial number '${serialNumber}' exists: ${exists}`);

      // Check brand authorization for the curl sender address (assumed deployer/admin)
      // The address in curl was 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
      const userAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
      const brand = await contract.brands(userAddress);
      console.log(`Brand info for ${userAddress}:`, brand);

  } catch (error) {
      console.error("Error checking contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
