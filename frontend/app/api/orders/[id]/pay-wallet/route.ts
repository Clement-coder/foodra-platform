import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"
import { sendOrderConfirmationEmail, sendWalletPurchaseEmail } from "@/lib/email"
import { checkAndNotifyMembershipUpgrade } from "@/lib/membershipNotify"
import { computeMembership } from "@/lib/membership"
import bcrypt from "bcryptjs"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { id: orderId } = await params
    const supabase = getSupabaseAdminClient()!

    const body = await request.json().catch(() => ({}))
    const { pin } = body

    if (!pin)
      return NextResponse.json({ error: "Wallet PIN is required to complete payment" }, { status: 400 })

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

    // ── PIN + balance ──────────────────────────────────────────
    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("balance_ngn, pin_hash")
      .eq("user_id", auth.user.id)
      .single()

    if (!wallet?.pin_hash)
      return NextResponse.json({ error: "Please set a wallet PIN first before paying" }, { status: 400 })

    const pinValid = await bcrypt.compare(String(pin), wallet.pin_hash)
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

    // ── Load order ─────────────────────────────────────────────
    const { data: order } = await supabase
      .from("orders")
      .select("id, buyer_id, total_amount, status, wallet_paid, order_items(product_name, quantity, price)")
      .eq("id", orderId)
      .single()

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.buyer_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (order.wallet_paid) return NextResponse.json({ error: "Order already paid" }, { status: 400 })
    if (!["awaiting_payment", "Pending"].includes(order.status))
      return NextResponse.json({ error: "Order is not awaiting payment" }, { status: 400 })

    const amount = parseFloat(order.total_amount)
    const balance = parseFloat(wallet.balance_ngn ?? "0")
    if (balance < amount)
      return NextResponse.json({ error: "Insufficient wallet balance", balance, required: amount }, { status: 400 })

    const new_balance = balance - amount

    // ── Deduct balance ─────────────────────────────────────────
    await supabase.from("wallet_accounts").update({ balance_ngn: new_balance }).eq("user_id", auth.user.id)

    const { data: tx } = await supabase.from("wallet_transactions").insert({
      user_id: auth.user.id,
      type: "debit",
      category: "purchase",
      amount_ngn: amount,
      balance_after: new_balance,
      order_id: orderId,
      note: `Order #${orderId.slice(0, 8).toUpperCase()}`,
    }).select("id").single()

    await supabase.from("orders").update({
      status: "Pending",
      wallet_paid: true,
      wallet_tx_id: tx?.id,
      paid_at: new Date().toISOString(),
    }).eq("id", orderId)

    // ── Notify + email only after payment ─────────────────────
    await createNotification({
      userId: auth.user.id,
      type: "order",
      title: "Order Placed & Paid ✅",
      message: `₦${amount.toLocaleString()} paid. Your order is being processed.`,
      link: `/orders/${orderId}`,
    })

    if (auth.user.email) {
      const emailItems = (order.order_items || []).map((i: any) => ({
        name: i.product_name, qty: i.quantity, price: i.price,
      }))
      sendOrderConfirmationEmail(auth.user.email, auth.user.name || "Customer", orderId, amount, emailItems, auth.user.id).catch(() => {})
      sendWalletPurchaseEmail(auth.user.email, auth.user.name || "Customer", amount, orderId, new_balance, auth.user.id).catch(() => {})
    }

    // ── Membership tier check ──────────────────────────────────
    const [buyerSnap, ordersSnap, disputesSnap] = await Promise.all([
      supabase.from("users").select("name, phone, location, avatar_url, created_at, is_verified").eq("id", auth.user.id).single(),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", auth.user.id).eq("wallet_paid", true),
      supabase.from("order_disputes").select("id").eq("user_id", auth.user.id).limit(1),
    ])
    const bu = buyerSnap.data
    if (bu) {
      const previousTier = computeMembership({
        hasName: !!bu.name, hasPhone: !!bu.phone, hasLocation: !!bu.location,
        hasAvatar: !!bu.avatar_url, createdAt: bu.created_at,
        ordersCount: Math.max(0, (ordersSnap.count ?? 1) - 1),
        hasDisputes: (disputesSnap.data?.length ?? 0) > 0,
        isVerified: !!bu.is_verified,
      }).tier
      checkAndNotifyMembershipUpgrade(supabase, auth.user.id, previousTier)
    }

    return NextResponse.json({ success: true, new_balance })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Payment failed" }, { status: 500 })
  }
}
