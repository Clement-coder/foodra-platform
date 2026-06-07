import { NextResponse } from "next/server"

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS?.toLowerCase()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) return NextResponse.json({ error: "Address is required" }, { status: 400 })

  try {
    const [ethRes, tokenRes] = await Promise.all([
      fetch(`https://base-sepolia.blockscout.com/api/v2/addresses/${address}/transactions`, { next: { revalidate: 30 } }),
      fetch(`https://base-sepolia.blockscout.com/api/v2/addresses/${address}/token-transfers?type=ERC-20`, { next: { revalidate: 30 } }),
    ])

    const ethData = ethRes.ok ? await ethRes.json() : { items: [] }
    const tokenData = tokenRes.ok ? await tokenRes.json() : { items: [] }

    // ETH transactions — only include value transfers (skip 0-value contract calls)
    const ethTxs = (ethData.items ?? [])
      .filter((tx: any) => tx.value && tx.value !== "0")
      .map((tx: any) => ({
        hash: tx.hash,
        from: tx.from?.hash ?? "",
        to: tx.to?.hash ?? "",
        value: tx.value ?? "0",
        timeStamp: tx.timestamp ? String(Math.floor(new Date(tx.timestamp).getTime() / 1000)) : "0",
        type: "eth",
      }))

    // USDC token transfers — Blockscout uses `address_hash` not `address`
    const usdcTxs = (tokenData.items ?? [])
      .filter((t: any) => {
        if (!USDC_ADDRESS) return true
        return (t.token?.address_hash ?? "").toLowerCase() === USDC_ADDRESS
      })
      .map((t: any) => ({
        hash: t.transaction_hash,
        from: t.from?.hash ?? "",
        to: t.to?.hash ?? "",
        value: t.total?.value ?? "0",
        timeStamp: t.timestamp ? String(Math.floor(new Date(t.timestamp).getTime() / 1000)) : "0",
        type: "usdc",
        tokenSymbol: t.token?.symbol ?? "USDC",
        // decimals live in t.total.decimals, not t.token.decimals
        tokenDecimals: String(t.total?.decimals ?? t.token?.decimals ?? "6"),
      }))

    const all = [...ethTxs, ...usdcTxs].sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp))

    return NextResponse.json({ status: "1", message: "OK", result: all })
  } catch (error) {
    console.error("Transaction fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
