import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://foodramarket.com"

function generateRef() {
  return "FDR-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7).toUpperCase()
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { amount_ngn } = await request.json()

    if (!amount_ngn || amount_ngn < 500)
      return NextResponse.json({ error: "Minimum funding amount is ₦500" }, { status: 400 })
    if (amount_ngn > 1_000_000)
      return NextResponse.json({ error: "Maximum funding amount is ₦1,000,000" }, { status: 400 })

    const supabase = getSupabaseAdminClient()!
    const reference = generateRef()

    // Record pending payment
    await supabase.from("paystack_payments").insert({
      user_id: auth.user.id,
      reference,
      amount_ngn,
      status: "pending",
    })

    // Initialize Paystack transaction
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: auth.user.email,
        amount: Math.round(amount_ngn * 100), // kobo
        reference,
        callback_url: `${APP_URL}/wallet?funded=1`,
        metadata: { user_id: auth.user.id, type: "wallet_fund" },
      }),
    })

    const data = await res.json()
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })

    return NextResponse.json({ authorization_url: data.data.authorization_url, reference })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
  }
}
