import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"
import { sendWalletWithdrawalEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const DAILY_LIMIT = 50_000

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { amount_ngn, bank_code, bank_name, account_number, account_name, pin } = await request.json()

    if (!amount_ngn || !bank_code || !account_number || !account_name || !pin)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    if (amount_ngn < 500)
      return NextResponse.json({ error: "Minimum withdrawal is ₦500" }, { status: 400 })
    if (amount_ngn > DAILY_LIMIT)
      return NextResponse.json({ error: `Maximum single withdrawal is ₦${DAILY_LIMIT.toLocaleString()}` }, { status: 400 })

    const supabase = getSupabaseAdminClient()!

    // ── PIN lockout check ──────────────────────────────────────
    const { data: attempts } = await supabase
      .from("wallet_pin_attempts")
      .select("fail_count, locked_until")
      .eq("user_id", auth.user.id)
      .maybeSingle()

    if (attempts?.locked_until && new Date(attempts.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(attempts.locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Too many incorrect PINs. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.` },
        { status: 429 }
      )
    }

    // ── PIN verification ───────────────────────────────────────
    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("balance_ngn, pin_hash")
      .eq("user_id", auth.user.id)
      .single()

    if (!wallet?.pin_hash)
      return NextResponse.json({ error: "Please set a wallet PIN first in your profile settings" }, { status: 400 })

    const pinValid = await bcrypt.compare(String(pin), wallet.pin_hash)

    if (!pinValid) {
      // Record failed attempt, lock after 5 failures
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

    // Reset failed attempts on success
    await supabase.from("wallet_pin_attempts")
      .upsert({ user_id: auth.user.id, fail_count: 0, locked_until: null, updated_at: new Date().toISOString() },
        { onConflict: "user_id" })

    // ── Daily limit check (atomic via RPC) ─────────────────────
    const { data: limitCheck, error: limitErr } = await supabase.rpc("record_withdrawal_daily", {
      p_user_id: auth.user.id,
      p_amount: amount_ngn,
      p_limit: DAILY_LIMIT,
    })

    if (limitErr) throw limitErr

    const limit = Array.isArray(limitCheck) ? limitCheck[0] : limitCheck
    if (!limit?.allowed) {
      return NextResponse.json(
        { error: `Daily withdrawal limit reached. You can withdraw up to ₦${Number(limit?.remaining ?? 0).toLocaleString()} more today.` },
        { status: 400 }
      )
    }

    // ── Balance check ──────────────────────────────────────────
    const balance = parseFloat(wallet.balance_ngn)
    if (balance < amount_ngn)
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })

    const new_balance = balance - amount_ngn

    // ── Deduct balance ─────────────────────────────────────────
    await supabase.from("wallet_accounts")
      .update({ balance_ngn: new_balance })
      .eq("user_id", auth.user.id)

    // ── Withdrawal record ──────────────────────────────────────
    const { data: withdrawal } = await supabase.from("wallet_withdrawals").insert({
      user_id: auth.user.id,
      amount_ngn,
      bank_code,
      bank_name,
      account_number,
      account_name,
    }).select().single()

    // ── Ledger entry ───────────────────────────────────────────
    await supabase.from("wallet_transactions").insert({
      user_id: auth.user.id,
      type: "debit",
      category: "withdraw",
      amount_ngn,
      balance_after: new_balance,
      note: `Withdrawal to ${bank_name} ${account_number}`,
    })

    // ── Attempt Paystack transfer ──────────────────────────────
    let transferOk = false
    try {
      const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
        method: "POST",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "nuban", name: account_name, account_number, bank_code, currency: "NGN" }),
      })
      const recipientData = await recipientRes.json()

      if (recipientData.status) {
        const transferRes = await fetch("https://api.paystack.co/transfer", {
          method: "POST",
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "balance",
            amount: Math.round(amount_ngn * 100),
            recipient: recipientData.data.recipient_code,
            reason: "Foodra wallet withdrawal",
          }),
        })
        const transferData = await transferRes.json()

        if (transferData.status) {
          transferOk = true
          await supabase.from("wallet_withdrawals").update({
            status: "processing",
            paystack_transfer_code: transferData.data.transfer_code,
          }).eq("id", withdrawal!.id)
        }
      }
    } catch {
      // Paystack unreachable — stays "pending" for admin to retry
    }

    // ── Rollback if Paystack failed (refund balance + daily tally) ─
    if (!transferOk) {
      await supabase.from("wallet_accounts")
        .update({ balance_ngn: balance })
        .eq("user_id", auth.user.id)
      await supabase.from("wallet_withdrawals")
        .update({ status: "failed" })
        .eq("id", withdrawal!.id)
      // Reverse the daily tally directly
      await supabase.from("wallet_daily_withdrawals")
        .update({ total_ngn: Math.max(0, (limit.withdrawn_today ?? amount_ngn) - amount_ngn) })
        .eq("user_id", auth.user.id)
        .eq("date", new Date().toISOString().slice(0, 10))

      return NextResponse.json({ error: "Transfer initiation failed. Please try again or contact support." }, { status: 502 })
    }

    await createNotification({
      userId: auth.user.id,
      type: "system",
      title: "Withdrawal Initiated",
      message: `₦${amount_ngn.toLocaleString()} withdrawal to ${bank_name} is being processed.`,
      link: "/wallet",
    })

    // Email the user
    if (auth.user.email) {
      sendWalletWithdrawalEmail(
        auth.user.email,
        auth.user.name || "Customer",
        amount_ngn,
        bank_name,
        account_number,
        new_balance,
        auth.user.id,
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, new_balance })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 })
  }
}
