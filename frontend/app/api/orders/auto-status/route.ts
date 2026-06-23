/**
 * GET /api/orders/auto-status  ← Vercel Cron (every hour)
 * POST /api/orders/auto-status ← manual/admin trigger
 *
 * 1. Advances paid orders: Pending→Processing (24h after paid_at)
 *                          Processing→Shipped  (24h after updated_at)
 * 2. Sends cart-abandonment follow-ups (every 24h after first 1h reminder)
 */
import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { sendOrderStatusEmail, sendCartAbandonmentEmail } from "@/lib/email"

async function run(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") ??
    new URL(request.url).searchParams.get("secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  const now = new Date()
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // ── Pending → Processing (24h after paid_at) ─────────────────────────────
  const { data: toProcessing } = await supabase
    .from("orders")
    .update({ status: "Processing", updated_at: now.toISOString() })
    .eq("status", "Pending")
    .eq("wallet_paid", true)
    .lte("paid_at", h24ago)
    .select("id, buyer_id")

  // ── Processing → Shipped (24h after updated_at) ──────────────────────────
  const { data: toShipped } = await supabase
    .from("orders")
    .update({ status: "Shipped", updated_at: now.toISOString() })
    .eq("status", "Processing")
    .lte("updated_at", h24ago)
    .select("id, buyer_id")

  const notifyBuyers = async (orders: { id: string; buyer_id: string }[], status: string) => {
    const msgs: Record<string, string> = {
      Processing: "Your order is being processed and will be shipped soon.",
      Shipped: "Your order has been shipped and is on its way!",
    }
    for (const o of orders) {
      if (!o.buyer_id) continue
      await createNotification({ userId: o.buyer_id, type: "order", title: `Order ${status}`, message: msgs[status], link: `/orders/${o.id}` })
      const { data: buyer } = await supabase.from("users").select("email, name").eq("id", o.buyer_id).single()
      if (buyer?.email) sendOrderStatusEmail(buyer.email, buyer.name || "Customer", o.id, status, o.buyer_id).catch(() => {})
    }
  }

  await Promise.all([
    notifyBuyers(toProcessing ?? [], "Processing"),
    notifyBuyers(toShipped ?? [], "Shipped"),
  ])

  // ── Cart abandonment follow-up (every 24h) ───────────────────────────────
  const { data: abandons } = await supabase
    .from("cart_abandonment_reminders")
    .select("user_id, items, total, reminder_count")
    .lte("next_remind_at", now.toISOString())

  for (const row of abandons ?? []) {
    const { data: user } = await supabase.from("users").select("email, name").eq("id", row.user_id).single()
    if (user?.email) {
      sendCartAbandonmentEmail(user.email, user.name || "Customer", row.items, row.total, row.user_id).catch(() => {})
    }
    await supabase.from("cart_abandonment_reminders").update({
      reminder_count: row.reminder_count + 1,
      last_reminded_at: now.toISOString(),
      next_remind_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }).eq("user_id", row.user_id)
  }

  return NextResponse.json({
    advanced: { toProcessing: toProcessing?.length ?? 0, toShipped: toShipped?.length ?? 0 },
    cartReminders: abandons?.length ?? 0,
  })
}

export const GET = run
export const POST = run
