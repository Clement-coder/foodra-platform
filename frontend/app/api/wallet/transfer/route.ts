import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { to_foodra_tag, amount_ngn, note } = await request.json()

    if (!to_foodra_tag || !amount_ngn)
      return NextResponse.json({ error: "to_foodra_tag and amount_ngn required" }, { status: 400 })
    if (amount_ngn < 100)
      return NextResponse.json({ error: "Minimum transfer is ₦100" }, { status: 400 })

    const supabase = getSupabaseAdminClient()!

    // Find recipient
    const { data: recipientWallet } = await supabase
      .from("wallet_accounts")
      .select("user_id, foodra_tag")
      .eq("foodra_tag", to_foodra_tag.toUpperCase())
      .single()

    if (!recipientWallet)
      return NextResponse.json({ error: "Foodra tag not found" }, { status: 404 })
    if (recipientWallet.user_id === auth.user.id)
      return NextResponse.json({ error: "Cannot send to yourself" }, { status: 400 })

    // Atomic transfer via RPC (prevents split-brain money loss)
    const { data: result, error: rpcErr } = await supabase.rpc("wallet_transfer", {
      p_sender_id:   auth.user.id,
      p_receiver_id: recipientWallet.user_id,
      p_amount:      amount_ngn,
      p_note:        note || null,
    })

    if (rpcErr) {
      if (rpcErr.message?.includes("Insufficient balance"))
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 })
      throw rpcErr
    }

    const transfer = Array.isArray(result) ? result[0] : result
    const senderNew = parseFloat(transfer.sender_balance)

    // Ledger entries
    await Promise.all([
      supabase.from("wallet_transactions").insert({
        user_id: auth.user.id,
        type: "debit",
        category: "send",
        amount_ngn,
        balance_after: senderNew,
        related_user_id: recipientWallet.user_id,
        note: note || `Sent to ${to_foodra_tag}`,
      }),
      supabase.from("wallet_transactions").insert({
        user_id: recipientWallet.user_id,
        type: "credit",
        category: "receive",
        amount_ngn,
        balance_after: parseFloat(transfer.receiver_balance),
        related_user_id: auth.user.id,
        note: note || `Received from ${auth.user.name || "a Foodra user"}`,
      }),
    ])

    await createNotification({
      userId: recipientWallet.user_id,
      type: "system",
      title: "Money Received 💰",
      message: `${auth.user.name || "Someone"} sent you ₦${amount_ngn.toLocaleString()}.`,
      link: "/wallet",
    })

    return NextResponse.json({ success: true, new_balance: senderNew })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 })
  }
}
