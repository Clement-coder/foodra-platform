/** Format NGN amount */
export function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Format USDC amount (6 decimals) */
export function formatUSDC(amount: number): string {
  return `${amount.toFixed(2)} USDC`
}

/** Format ETH amount */
export function formatETH(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount
  return `${n.toFixed(6)} ETH`
}

/** Shorten wallet address */
export function shortAddress(address: string, chars = 4): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/** Format large numbers with K/M suffix */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
