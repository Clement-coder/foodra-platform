import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const network = searchParams.get("network") || "testnet"

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  const isMainnet = network === "mainnet"
  const chainId = isMainnet ? "8453" : "84532"
  const networkPath = isMainnet ? "mainnet" : "testnet"

  const url = `https://api.routescan.io/v2/network/${networkPath}/evm/${chainId}/etherscan/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Transaction fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
