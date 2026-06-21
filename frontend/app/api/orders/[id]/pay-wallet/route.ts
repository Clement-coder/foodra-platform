import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import { createNotification } from "@/lib/notify"
import { sendOrderStatusEmail } from "@/lib/email"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { id: orderId } = await params
    const supabase = getSupabaseAdminClient()!

    // Load order
    const { data: order } = await supabase
      .from("orders")
      .select("id, buyer_id, total_amount, status, wallet_paid")
      .eq("id", orderId)
      .single()

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.buyer_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (order.wallet_paid) return NextResponse.json({ error: "Order already paid" }, { status: 400 })
    if (order.status !== "Pending") return NextResponse.json({ error: "Order not in Pending state" }, { status: 400 })

    const amount = parseFloat(order.total_amount)

    // Load wallet balance
    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("balance_ngn")
      .eq("user_id", auth.user.id)
      .single()

    const balance = parseFloat(wallet?.balance_ngn ?? "0")
    if (balance < amount)
      return NextResponse.json({ error: "Insufficient wallet balance", balance, required: amount }, { status: 400 })

    const new_balance = balance - amount

    // Deduct wallet
    await supabase.from("wallet_accounts").update({ balance_ngn: new_balance }).eq("user_id", auth.user.id)

    // Ledger entry
    const { data: tx } = await supabase.from("wallet_transactions").insert({
      user_id: auth.user.id,
      type: "debit",
      category: "purchase",
      amount_ngn: amount,
      balance_after: new_balance,
      order_id: orderId,
      note: `Order #${orderId.slice(0, 8).toUpperCase()}`,
    }).select("id").single()

    // Update order
    await supabase.from("orders").update({
      status: "Processing",
      wallet_paid: true,
      wallet_tx_id: tx?.id,
      paid_at: new Date().toISOString(),
    }).eq("id", orderId)

    // Notify buyer
    await createNotification({
      userId: auth.user.id,
      type: "order",
      title: "Order Confirmed ✅",
      message: `₦${amount.toLocaleString()} paid. Your order is now being processed.`,
      link: `/orders/${orderId}`,
    })

    // Email (send basic order status email instead)
    if (auth.user.email) {
      sendOrderStatusEmail(auth.user.email, auth.user.name || "Customer", orderId, "Processing", auth.user.id).catch(() => {})
    }

    return NextResponse.json({ success: true, new_balance })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Payment failed" }, { status: 500 })
  }
}
