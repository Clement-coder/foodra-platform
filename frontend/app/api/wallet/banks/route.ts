import { NextResponse } from "next/server"

// Returns Nigerian bank list from Paystack (cached)
let banksCache: { code: string; name: string }[] | null = null
let cacheTime = 0

export async function GET() {
  if (banksCache && Date.now() - cacheTime < 3_600_000) {
    return NextResponse.json(banksCache)
  }
  const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()
  banksCache = data.data.map((b: any) => ({ code: b.code, name: b.name }))
  cacheTime = Date.now()
  return NextResponse.json(banksCache)
}
