import { NextResponse } from "next/server"

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS?.toLowerCase()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 })

  try {
    // Fetch both ETH txs and USDC token transfers in parallel
    const [ethRes, tokenRes] = await Promise.all([
      fetch(`https://base-sepolia.blockscout.com/api/v2/addresses/${address}/transactions`, { next: { revalidate: 30 } }),
      fetch(`https://base-sepolia.blockscout.com/api/v2/addresses/${address}/token-transfers?type=ERC-20`, { next: { revalidate: 30 } }),
    ])

    const ethData = ethRes.ok ? await ethRes.json() : { items: [] }
    const tokenData = tokenRes.ok ? await tokenRes.json() : { items: [] }

    // Normalize ETH transactions
    const ethTxs = (ethData.items ?? []).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from?.hash || "",
      to: tx.to?.hash || "",
      value: tx.value || "0",
      timeStamp: tx.timestamp ? String(Math.floor(new Date(tx.timestamp).getTime() / 1000)) : "0",
      type: "eth",
    }))

    // Normalize USDC token transfers — filter to MockUSDC only
    const usdcTxs = (tokenData.items ?? [])
      .filter((t: any) => !USDC_ADDRESS || t.token?.address?.toLowerCase() === USDC_ADDRESS)
      .map((t: any) => ({
        hash: t.transaction_hash,
        from: t.from?.hash || "",
        to: t.to?.hash || "",
        value: t.total?.value || "0",   // raw 6-decimal units
        timeStamp: t.timestamp ? String(Math.floor(new Date(t.timestamp).getTime() / 1000)) : "0",
        type: "usdc",
        tokenSymbol: t.token?.symbol || "USDC",
        tokenDecimals: t.token?.decimals || "6",
      }))

    // Merge and sort by timestamp desc
    const all = [...ethTxs, ...usdcTxs].sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp))

    return NextResponse.json({ status: "1", message: "OK", result: all })
  } catch (error) {
    console.error("Transaction fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
