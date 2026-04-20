/**
 * Deploy FoodraEscrow to Base Mainnet using real USDC
 * Usage: npx hardhat run scripts/deploy-mainnet.ts --network base
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY   — deployer wallet private key
 *   FOODRA_TREASURY_WALLET — treasury address to receive fees
 *   BASE_MAINNET_RPC_URL   — Base mainnet RPC (e.g. from Alchemy/Infura)
 */
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

// Real USDC on Base Mainnet
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

async function main() {
  const [deployer] = await ethers.getSigners();
  const treasury = process.env.FOODRA_TREASURY_WALLET;

  if (!treasury) throw new Error("FOODRA_TREASURY_WALLET not set");

  const network = await ethers.provider.getNetwork();
  if (Number(network.chainId) !== 8453) {
    throw new Error(`Expected Base Mainnet (8453), got chainId ${network.chainId}`);
  }

  console.log("=== Foodra Mainnet Deployment ===");
  console.log("Network:   Base Mainnet");
  console.log("Deployer:  ", deployer.address);
  console.log("Treasury:  ", treasury);
  console.log("USDC:      ", BASE_USDC);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("ETH Balance:", ethers.formatEther(balance), "ETH");
  if (balance < ethers.parseEther("0.001")) {
    throw new Error("Insufficient ETH for deployment gas");
  }

  const Escrow = await ethers.getContractFactory("FoodraEscrow");
  console.log("\nDeploying FoodraEscrow...");
  const escrow = await Escrow.deploy(BASE_USDC, treasury);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("✅ FoodraEscrow deployed to:", escrowAddress);

  // Verify initial state
  const owner = await escrow.owner();
  const fee = await escrow.feeBps();
  console.log("Owner:", owner);
  console.log("Fee:", fee.toString(), "bps (", Number(fee) / 100, "%)");

  const fs = await import("fs");
  const addresses = {
    escrow: escrowAddress,
    usdc: BASE_USDC,
    treasury,
    network: "base-mainnet",
    chainId: 8453,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };
  fs.writeFileSync("deployed-addresses-mainnet.json", JSON.stringify(addresses, null, 2));

  console.log("\n=== Add to frontend .env.local ===");
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=${BASE_USDC}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=8453`);
}

main().catch((e) => { console.error(e); process.exit(1); });
