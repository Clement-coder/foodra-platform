import { ethers } from "ethers";

export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS!;
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS!;

export const ESCROW_ABI = [
  "function createEscrow(bytes32 orderId, address farmer, uint256 amount, uint256 ngnAmount) external",
  "function confirmDelivery(bytes32 orderId) external",
  "function raiseDispute(bytes32 orderId) external",
  "function autoRelease(bytes32 orderId) external",
  "function getEscrow(bytes32 orderId) external view returns (tuple(address buyer, address farmer, uint256 amount, uint256 ngnAmount, uint8 status, uint256 createdAt))",
  "function computeOrderId(string calldata supabaseOrderId, string calldata productId) external pure returns (bytes32)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

export const ESCROW_STATUS = ["LOCKED", "RELEASED", "REFUNDED", "DISPUTED"] as const;
export type EscrowStatusType = typeof ESCROW_STATUS[number];

/** Convert NGN amount to USDC (6 decimals) using CoinGecko rate */
export async function getNgnToUsdcRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error("rate fetch failed");
    const data = await res.json();
    const rate = data["usd-coin"]?.ngn;
    if (!rate || typeof rate !== "number" || rate <= 0) throw new Error("invalid rate");
    return rate;
  } catch {
    // Fallback: ~1 USD = 1600 NGN, 1 USDC ≈ 1 USD
    return 1600;
  }
}

/** Convert NGN amount to USDC in 6-decimal bigint */
export async function ngnToUsdc(ngnAmount: number): Promise<{ usdcAmount: bigint; rate: number }> {
  const rate = await getNgnToUsdcRate();
  const usdcFloat = ngnAmount / rate;
  const usdcAmount = BigInt(Math.round(usdcFloat * 1_000_000));
  return { usdcAmount, rate };
}

export function getEscrowContract(provider: ethers.BrowserProvider) {
  if (!ESCROW_ADDRESS) throw new Error("Escrow contract address not configured");
  return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
}

export function getUsdcContract(provider: ethers.BrowserProvider) {
  if (!USDC_ADDRESS) throw new Error("USDC contract address not configured");
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
}
