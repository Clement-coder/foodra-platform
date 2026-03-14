import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = process.env.FOODRA_TREASURY_WALLET!;

  console.log("Deploying with:", deployer.address);
  console.log("Treasury:", treasury);

  // On testnet, deploy MockUSDC (Base Sepolia has real USDC but MockUSDC is fine for testing)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC deployed to:", await usdc.getAddress());

  const Escrow = await ethers.getContractFactory("FoodraEscrow");
  const escrow = await Escrow.deploy(await usdc.getAddress(), treasury);
  await escrow.waitForDeployment();
  console.log("FoodraEscrow deployed to:", await escrow.getAddress());

  console.log("\nAdd these to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${await escrow.getAddress()}`);
  console.log(`NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=${await usdc.getAddress()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
