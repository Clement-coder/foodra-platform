import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"
import { sendWalletSentEmail, sendWalletReceivedEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { to_foodra_tag, amount_ngn, note, pin } = await request.json()

    if (!to_foodra_tag || !amount_ngn)
      return NextResponse.json({ error: "to_foodra_tag and amount_ngn required" }, { status: 400 })
    if (!pin)
      return NextResponse.json({ error: "Wallet PIN is required" }, { status: 400 })
    if (amount_ngn < 100)
      return NextResponse.json({ error: "Minimum transfer is ₦100" }, { status: 400 })

    const supabase = getSupabaseAdminClient()!

    // ── PIN lockout check ──────────────────────────────────────
    const { data: attempts } = await supabase
      .from("wallet_pin_attempts")
      .select("fail_count, locked_until")
      .eq("user_id", auth.user.id)
      .maybeSingle()

    if (attempts?.locked_until && new Date(attempts.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(attempts.locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json({ error: `Too many incorrect PINs. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.` }, { status: 429 })
    }

    // ── PIN verification ───────────────────────────────────────
    const { data: senderAccount } = await supabase
      .from("wallet_accounts")
      .select("pin_hash, foodra_tag")
      .eq("user_id", auth.user.id)
      .single()

    if (!senderAccount?.pin_hash)
      return NextResponse.json({ error: "Please set a wallet PIN first before sending money" }, { status: 400 })

    const pinValid = await bcrypt.compare(String(pin), senderAccount.pin_hash)
    if (!pinValid) {
      const failCount = (attempts?.fail_count ?? 0) + 1
      const lockedUntil = failCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
      await supabase.from("wallet_pin_attempts").upsert(
        { user_id: auth.user.id, fail_count: failCount, locked_until: lockedUntil, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      const remaining = 5 - failCount
      return NextResponse.json(
        { error: remaining > 0 ? `Incorrect PIN. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.` : "Account locked for 15 minutes." },
        { status: 400 }
      )
    }

    // Reset failed attempts
    await supabase.from("wallet_pin_attempts")
      .upsert({ user_id: auth.user.id, fail_count: 0, locked_until: null, updated_at: new Date().toISOString() }, { onConflict: "user_id" })

    // Find recipient wallet + user details
    const { data: recipientWallet } = await supabase
      .from("wallet_accounts")
      .select("user_id, foodra_tag, users(email, name)")
      .eq("foodra_tag", to_foodra_tag.toUpperCase())
      .single()

    if (!recipientWallet)
      return NextResponse.json({ error: "Foodra tag not found" }, { status: 404 })
    if (recipientWallet.user_id === auth.user.id)
      return NextResponse.json({ error: "Cannot send to yourself" }, { status: 400 })

    // Atomic transfer via RPC
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
    const senderNew   = parseFloat(transfer.sender_balance)
    const receiverNew = parseFloat(transfer.receiver_balance)
    const senderTag   = senderAccount.foodra_tag ?? auth.user.id
    const recipientUser = Array.isArray(recipientWallet.users) ? recipientWallet.users[0] : recipientWallet.users as any

    await Promise.all([
      supabase.from("wallet_transactions").insert({
        user_id: auth.user.id, type: "debit", category: "send",
        amount_ngn, balance_after: senderNew,
        related_user_id: recipientWallet.user_id,
        note: note || `Sent to ${to_foodra_tag}`,
      }),
      supabase.from("wallet_transactions").insert({
        user_id: recipientWallet.user_id, type: "credit", category: "receive",
        amount_ngn, balance_after: receiverNew,
        related_user_id: auth.user.id,
        note: note || `Received from ${auth.user.name || "a Foodra user"}`,
      }),
    ])

    await Promise.all([
      createNotification({ userId: recipientWallet.user_id, type: "system", title: "Money Received 💰", message: `${auth.user.name || "Someone"} sent you ₦${amount_ngn.toLocaleString()}.`, link: "/wallet" }),
      createNotification({ userId: auth.user.id, type: "system", title: "Transfer Sent ✅", message: `₦${amount_ngn.toLocaleString()} sent to ${to_foodra_tag}.`, link: "/wallet" }),
    ])

    if (auth.user.email) sendWalletSentEmail(auth.user.email, auth.user.name || "Customer", amount_ngn, to_foodra_tag, recipientUser?.name ?? null, senderNew, note, auth.user.id).catch(() => {})
    if (recipientUser?.email) sendWalletReceivedEmail(recipientUser.email, recipientUser.name || "Customer", amount_ngn, senderTag, auth.user.name ?? null, receiverNew, note, recipientWallet.user_id).catch(() => {})

    return NextResponse.json({ success: true, new_balance: senderNew })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Transfer failed" }, { status: 500 })
  }
}
