import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { reference } = await request.json()

    if (!reference)
      return NextResponse.json({ error: "Reference is required" }, { status: 400 })

    const supabase = getSupabaseAdminClient()!

    // Check if already processed by webhook
    const { data: existing } = await supabase
      .from("paystack_payments")
      .select("status, amount_ngn, user_id")
      .eq("reference", reference)
      .single()

    if (!existing)
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 })

    // Confirm this payment belongs to the authenticated user
    if (existing.user_id !== auth.user.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    // Already credited by webhook — just return success
    if (existing.status === "success")
      return NextResponse.json({ status: "already_credited", amount_ngn: existing.amount_ngn })

    // Webhook hasn't fired yet — verify directly with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
    })
    const data = await res.json()

    if (!data.status || data.data?.status !== "success")
      return NextResponse.json({ error: "Payment not confirmed by Paystack", paystackStatus: data.data?.status }, { status: 402 })

    const amount_ngn = data.data.amount / 100

    // Credit the wallet via the same idempotent RPC the webhook uses
    const { data: rpcResult, error: rpcError } = await supabase.rpc("process_paystack_webhook", {
      p_reference:  reference,
      p_user_id:    auth.user.id,
      p_amount_ngn: amount_ngn,
    })

    if (rpcError) {
      console.error("verify-payment RPC error:", rpcError.message)
      return NextResponse.json({ error: "Failed to credit wallet" }, { status: 500 })
    }

    return NextResponse.json({ status: rpcResult, amount_ngn })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
