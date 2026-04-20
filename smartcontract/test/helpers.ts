/**
 * Shared test helpers and fixtures for FoodraEscrow tests
 */
import { ethers } from "hardhat";

export const ONE_USDC = 1_000_000n;
export const SEVEN_DAYS = 7 * 24 * 60 * 60;

export const STATUS = {
  LOCKED: 0,
  RELEASED: 1,
  REFUNDED: 2,
  DISPUTED: 3,
} as const;

/**
 * Deploy MockUSDC + FoodraEscrow and fund a set of buyers.
 */
export async function deployEscrow(buyerCount = 1) {
  const signers = await ethers.getSigners();
  const [owner, treasury] = signers;
  const buyers = signers.slice(2, 2 + buyerCount);
  const farmers = signers.slice(2 + buyerCount, 2 + buyerCount * 2);

  const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
  const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
    await usdc.getAddress(),
    treasury.address
  );
  const escrowAddr = await escrow.getAddress();

  for (const buyer of buyers) {
    await usdc.mint(buyer.address, 100_000n * ONE_USDC);
    await usdc.connect(buyer).approve(escrowAddr, 100_000n * ONE_USDC);
  }

  return { escrow, usdc, owner, treasury, buyers, farmers, signers };
}

/**
 * Compute orderId the same way the contract does.
 */
export function computeOrderId(orderId: string, productId: string): string {
  return ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes(orderId), ethers.toUtf8Bytes(productId)])
  );
}

/**
 * Create an escrow and return its orderId.
 */
export async function createEscrow(
  escrow: any,
  buyer: any,
  farmer: any,
  amount: bigint,
  label: string
): Promise<string> {
  const id = computeOrderId(label, label + "-prod");
  await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
  return id;
}
