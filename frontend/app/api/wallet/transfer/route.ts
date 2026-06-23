import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"
import { sendWalletSentEmail, sendWalletReceivedEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { to_foodra_tag, amount_ngn, note } = await request.json()

    if (!to_foodra_tag || !amount_ngn)
      return NextResponse.json({ error: "to_foodra_tag and amount_ngn required" }, { status: 400 })
    if (amount_ngn < 100)
      return NextResponse.json({ error: "Minimum transfer is ₦100" }, { status: 400 })

    const supabase = getSupabaseAdminClient()!

    // Find recipient wallet + user details in one query
    const { data: recipientWallet } = await supabase
      .from("wallet_accounts")
      .select("user_id, foodra_tag, users(email, name)")
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
    const senderNew    = parseFloat(transfer.sender_balance)
    const receiverNew  = parseFloat(transfer.receiver_balance)

    // Fetch sender's foodra_tag for the receiver email
    const { data: senderWallet } = await supabase
      .from("wallet_accounts")
      .select("foodra_tag")
      .eq("user_id", auth.user.id)
      .single()

    const senderTag    = senderWallet?.foodra_tag ?? auth.user.id
    const recipientUser = Array.isArray(recipientWallet.users) ? recipientWallet.users[0] : recipientWallet.users as any

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
        balance_after: receiverNew,
        related_user_id: auth.user.id,
        note: note || `Received from ${auth.user.name || "a Foodra user"}`,
      }),
    ])

    // In-app notification for recipient
    await createNotification({
      userId: recipientWallet.user_id,
      type: "system",
      title: "Money Received 💰",
      message: `${auth.user.name || "Someone"} sent you ₦${amount_ngn.toLocaleString()}.`,
      link: "/wallet",
    })

    // In-app notification for sender
    await createNotification({
      userId: auth.user.id,
      type: "system",
      title: "Transfer Sent ✅",
      message: `₦${amount_ngn.toLocaleString()} sent to ${to_foodra_tag}.`,
      link: "/wallet",
    })

    // Email sender
    if (auth.user.email) {
      sendWalletSentEmail(
        auth.user.email,
        auth.user.name || "Customer",
        amount_ngn,
        to_foodra_tag,
        recipientUser?.name ?? null,
        senderNew,
        note,
        auth.user.id,
      ).catch(() => {})
    }

    // Email recipient
    if (recipientUser?.email) {
      sendWalletReceivedEmail(
        recipientUser.email,
        recipientUser.name || "Customer",
        amount_ngn,
        senderTag,
        auth.user.name ?? null,
        receiverNew,
        note,
        recipientWallet.user_id,
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, new_balance: senderNew })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 })
  }
}
