import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  const url = `https://base-sepolia.blockscout.com/api/v2/addresses/${address}/transactions`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })

    if (!res.ok) return NextResponse.json({ error: "Failed to fetch transactions" }, { status: res.status })

    const data = await res.json()

    // Normalize to the format the wallet page expects
    const items = (data.items ?? []).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from?.hash || "",
      to: tx.to?.hash || "",
      value: tx.value || "0",
      timeStamp: tx.timestamp ? String(Math.floor(new Date(tx.timestamp).getTime() / 1000)) : "0",
      isError: tx.result === "success" ? "0" : "1",
      methodId: tx.method || "",
    }))

    return NextResponse.json({ status: "1", message: "OK", result: items })
  } catch (error) {
    console.error("Transaction fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
