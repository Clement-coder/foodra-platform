import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY
  const url = `https://api.etherscan.io/v2/api?chainid=84532&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`

  try {
    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch transactions" }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Transaction fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
