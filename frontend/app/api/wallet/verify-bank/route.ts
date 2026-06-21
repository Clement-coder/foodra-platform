import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const account_number = searchParams.get("account_number")
  const bank_code = searchParams.get("bank_code")

  if (!account_number || !bank_code)
    return NextResponse.json({ error: "account_number and bank_code required" }, { status: 400 })

  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  const data = await res.json()
  if (!data.status) return NextResponse.json({ error: "Could not verify account" }, { status: 400 })
  return NextResponse.json({ account_name: data.data.account_name })
}
