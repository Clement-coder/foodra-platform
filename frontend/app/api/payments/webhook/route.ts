import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"

export async function POST(request: Request) {
  const rawBody = await request.text()

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex")

  if (hash !== request.headers.get("x-paystack-signature"))
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 })

  const event = JSON.parse(rawBody)
  if (event.event !== "charge.success") return NextResponse.json({ received: true })

  const { reference, amount, metadata } = event.data
  const amount_ngn = amount / 100
  const user_id = metadata?.user_id

  if (!user_id) return NextResponse.json({ error: "Missing user_id in metadata" }, { status: 400 })

  const supabase = getSupabaseAdminClient()!

  // Idempotent credit via RPC — handles race conditions atomically
  const { data: result, error } = await supabase.rpc("process_paystack_webhook", {
    p_reference:  reference,
    p_user_id:    user_id,
    p_amount_ngn: amount_ngn,
  })

  if (error) {
    console.error("Webhook RPC error:", error.message)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  if (result === "duplicate") return NextResponse.json({ received: true })

  await createNotification({
    userId: user_id,
    type: "system",
    title: "Wallet Funded ✅",
    message: `₦${amount_ngn.toLocaleString()} has been added to your Foodra wallet.`,
    link: "/wallet",
  })

  return NextResponse.json({ received: true })
}
