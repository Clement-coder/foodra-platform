/**
 * Verify FoodraEscrow on Basescan after deployment
 * Usage: npx hardhat run scripts/verify.ts --network base
 *        npx hardhat run scripts/verify.ts --network baseSepolia
 */
import { run } from "hardhat";
import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const file = fs.existsSync("deployed-addresses-mainnet.json")
    ? "deployed-addresses-mainnet.json"
    : "deployed-addresses.json";

  const addresses = JSON.parse(fs.readFileSync(file, "utf8"));
  const treasury = process.env.FOODRA_TREASURY_WALLET || addresses.treasury;

  console.log("Verifying FoodraEscrow at:", addresses.escrow);
  console.log("Constructor args: USDC =", addresses.usdc, "Treasury =", treasury);

  await run("verify:verify", {
    address: addresses.escrow,
    constructorArguments: [addresses.usdc, treasury],
  });

  console.log("✅ Verification submitted to Basescan");
}

main().catch((e) => { console.error(e); process.exit(1); });
