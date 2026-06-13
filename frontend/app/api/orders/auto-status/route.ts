/**
 * GET /api/orders/auto-status  ← called by Vercel Cron (always GET)
 * POST /api/orders/auto-status ← manual/admin calls
 *
 * Advances: Pending→Processing (24h from created_at)
 *           Processing→Shipped  (24h from updated_at)
 * Also sends cart-abandonment follow-up emails (24h reminder, then every 24h).
 * Protected by CRON_SECRET env var (header x-cron-secret or ?secret=).
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

  // ── Order status advancement ─────────────────────────────────────────────
  const { data: toProcessing } = await supabase
    .from("orders")
    .update({ status: "Processing", updated_at: now.toISOString() })
    .eq("status", "Pending")
    .not("escrow_status", "in", '("locked","disputed")')
    .lte("created_at", h24ago)
    .select("id, buyer_id")

  const { data: toShipped } = await supabase
    .from("orders")
    .update({ status: "Shipped", updated_at: now.toISOString() })
    .eq("status", "Processing")
    .not("escrow_status", "in", '("locked","disputed")')
    .lte("updated_at", h24ago)
    .select("id, buyer_id")

  const notify = async (orders: { id: string; buyer_id: string }[], status: string) => {
    const msgs: Record<string, string> = {
      Processing: "Your order is being processed.",
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
    notify(toProcessing ?? [], "Processing"),
    notify(toShipped ?? [], "Shipped"),
  ])

  // ── Cart abandonment follow-up (24 h reminder + every 24 h after) ────────
  // Finds users whose cart was last updated 24 h ago (or multiples of 24 h)
  // and haven't checked out, then sends them a reminder email.
  const { data: abandons } = await supabase
    .from("cart_abandonment_reminders")
    .select("user_id, items, total, reminder_count")
    .lte("next_remind_at", now.toISOString())

  for (const row of abandons ?? []) {
    const { data: user } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", row.user_id)
      .single()

    if (user?.email) {
      sendCartAbandonmentEmail(user.email, user.name || "Farmer", row.items, row.total, row.user_id).catch(() => {})
    }

    // Schedule next reminder 24 h from now
    await supabase
      .from("cart_abandonment_reminders")
      .update({
        reminder_count: row.reminder_count + 1,
        last_reminded_at: now.toISOString(),
        next_remind_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("user_id", row.user_id)
  }

  return NextResponse.json({
    advanced: { toProcessing: toProcessing?.length ?? 0, toShipped: toShipped?.length ?? 0 },
    cartReminders: abandons?.length ?? 0,
  })
}

export const GET = run
export const POST = run
