import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"
import {
  sendOrderConfirmationEmail,
  sendWalletPurchaseEmail,
  sendPaymentFailedEmail,
} from "@/lib/email"
import { checkAndNotifyMembershipUpgrade } from "@/lib/membershipNotify"
import { computeMembership } from "@/lib/membership"
import bcrypt from "bcryptjs"

/**
 * POST /api/orders/checkout
 *
 * Atomic checkout: validates PIN + balance BEFORE creating the order.
 * Order is only written to DB on successful payment.
 *
 * Body: { pin, totalAmount, items, delivery }
 */
export async function POST(request: Request) {
  try {
  const auth = await requireAuthenticatedUser(request).catch((e) => { throw e })
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = getSupabaseAdminClient()!
  const body = await request.json().catch(() => ({}))
  const { pin, totalAmount, items, delivery } = body

  if (!pin) return NextResponse.json({ error: "Wallet PIN is required" }, { status: 400 })
  if (!items?.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
  if (!totalAmount) return NextResponse.json({ error: "totalAmount is required" }, { status: 400 })

  // ── PIN lockout check ────────────────────────────────────────────────────────
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

  // ── Load wallet ──────────────────────────────────────────────────────────────
  const { data: wallet } = await supabase
    .from("wallet_accounts")
    .select("balance_ngn, pin_hash")
    .eq("user_id", auth.user.id)
    .single()

  if (!wallet?.pin_hash)
    return NextResponse.json({ error: "Please set a wallet PIN before paying" }, { status: 400 })

  // ── Validate PIN ─────────────────────────────────────────────────────────────
  const pinValid = await bcrypt.compare(String(pin), wallet.pin_hash)
  if (!pinValid) {
    const failCount = (attempts?.fail_count ?? 0) + 1
    const lockedUntil = failCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
    await supabase.from("wallet_pin_attempts").upsert(
      { user_id: auth.user.id, fail_count: failCount, locked_until: lockedUntil, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    const remaining = 5 - failCount
    const error = remaining > 0
      ? `Incorrect PIN. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`
      : "Account locked for 15 minutes."

    // Send payment failed email
    if (auth.user.email) {
      const emailItems = items.map((i: any) => ({ name: i.productName, qty: i.quantity, price: i.pricePerUnit }))
      sendPaymentFailedEmail(
        auth.user.email, auth.user.name || "Customer",
        "N/A", "Incorrect wallet PIN",
        auth.user.id, emailItems, totalAmount
      ).catch(() => {})
    }

    return NextResponse.json({ error }, { status: 400 })
  }

  // Reset failed attempts
  await supabase.from("wallet_pin_attempts").upsert(
    { user_id: auth.user.id, fail_count: 0, locked_until: null, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )

  // ── Check balance ────────────────────────────────────────────────────────────
  const amount = parseFloat(totalAmount)
  const balance = parseFloat(wallet.balance_ngn ?? "0")
  if (balance < amount) {
    if (auth.user.email) {
      const emailItems = items.map((i: any) => ({ name: i.productName, qty: i.quantity, price: i.pricePerUnit }))
      sendPaymentFailedEmail(
        auth.user.email, auth.user.name || "Customer",
        "N/A", `Insufficient wallet balance. Available: ₦${balance.toLocaleString()}, Required: ₦${amount.toLocaleString()}`,
        auth.user.id, emailItems, totalAmount
      ).catch(() => {})
    }
    return NextResponse.json({ error: "Insufficient wallet balance", balance, required: amount }, { status: 400 })
  }

  // ── Check stock ──────────────────────────────────────────────────────────────
  for (const item of items) {
    const { data: prod } = await supabase
      .from("products").select("quantity, name").eq("id", item.productId).single()
    if (!prod || prod.quantity < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for ${item.productName || prod?.name}` },
        { status: 400 }
      )
    }
  }

  // ── All checks passed — create order ────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_id:            auth.user.id,
      total_amount:        amount,
      status:              "Pending",
      wallet_paid:         true,
      paid_at:             new Date().toISOString(),
      delivery_full_name:  delivery?.fullName    || null,
      delivery_phone:      delivery?.phone       || null,
      delivery_address:    delivery?.addressLine || null,
      delivery_street2:    delivery?.streetLine2 || null,
      delivery_landmark:   delivery?.landmark    || null,
      delivery_city:       delivery?.city        || null,
      delivery_state:      delivery?.state       || null,
      delivery_country:    delivery?.country     || null,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error("checkout: order insert error", orderError)
    return NextResponse.json({ error: "Failed to create order", detail: orderError?.message, code: orderError?.code }, { status: 500 })
  }

  // ── Insert order items ───────────────────────────────────────────────────────
  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i: any) => ({
      order_id:     order.id,
      product_id:   i.productId,
      product_name: i.productName,
      quantity:     i.quantity,
      price:        i.pricePerUnit,
      image_url:    i.image,
    }))
  )

  if (itemsError) {
    console.error("checkout: order_items insert error", itemsError)
    await supabase.from("orders").delete().eq("id", order.id)
    return NextResponse.json({ error: "Failed to save order items", detail: itemsError?.message, code: itemsError?.code }, { status: 500 })
  }

  // ── Decrement stock ──────────────────────────────────────────────────────────
  for (const item of items) {
    const { data: rpcOk, error: rpcError } = await supabase.rpc("decrement_product_stock", {
      product_id: item.productId,
      decrement_by: item.quantity,
    })
    if (rpcError) {
      // RPC not deployed — do it directly
      const { data: prod } = await supabase.from("products").select("quantity").eq("id", item.productId).single()
      const restored = (prod?.quantity || 0) - item.quantity
      await supabase.from("products").update({ quantity: restored, is_available: restored > 0 }).eq("id", item.productId)
    } else if (!rpcOk) {
      // Stock ran out between check and decrement — rollback
      await supabase.from("order_items").delete().eq("order_id", order.id)
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: `Stock just ran out for ${item.productName}` }, { status: 400 })
    }
  }

  // ── Deduct wallet balance ────────────────────────────────────────────────────
  const new_balance = balance - amount
  await supabase.from("wallet_accounts").update({ balance_ngn: new_balance }).eq("user_id", auth.user.id)

  const { data: tx } = await supabase.from("wallet_transactions").insert({
    user_id:      auth.user.id,
    type:         "debit",
    category:     "purchase",
    amount_ngn:   amount,
    balance_after: new_balance,
    order_id:     order.id,
    note:         `Order #${order.id.slice(0, 8).toUpperCase()}`,
  }).select("id").single()

  await supabase.from("orders").update({ wallet_tx_id: tx?.id }).eq("id", order.id)

  // Clear cart abandonment reminder
  await supabase.from("cart_abandonment_reminders").delete().eq("user_id", auth.user.id)

  // ── Notifications + emails ───────────────────────────────────────────────────
  await createNotification({
    userId: auth.user.id,
    type: "order",
    title: "Order Placed & Paid ✅",
    message: `₦${amount.toLocaleString()} paid. Your order is being processed.`,
    link: `/orders/${order.id}`,
  })

  if (auth.user.email) {
    const emailItems = items.map((i: any) => ({ name: i.productName, qty: i.quantity, price: i.pricePerUnit }))
    sendOrderConfirmationEmail(
      auth.user.email, auth.user.name || "Customer",
      order.id, amount, emailItems, auth.user.id
    ).catch(() => {})
    sendWalletPurchaseEmail(
      auth.user.email, auth.user.name || "Customer",
      amount, order.id, new_balance, auth.user.id
    ).catch(() => {})
  }

  // ── Membership tier check ────────────────────────────────────────────────────
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

  return NextResponse.json({ success: true, orderId: order.id, new_balance })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    const msg = e instanceof Error ? e.message : String(e)
    console.error("checkout error:", e)
    return NextResponse.json({ error: "Checkout failed", detail: msg }, { status: 500 })
  }
}
