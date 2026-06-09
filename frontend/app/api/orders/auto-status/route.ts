/**
 * POST /api/orders/auto-status
 * Advances Pending→Processing (24h) and Processing→Shipped (48h).
 * Called by Vercel Cron (vercel.json) or manually.
 * Protected by CRON_SECRET env var.
 */
import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { sendOrderStatusEmail } from "@/lib/email"

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

  const now = new Date()
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  // Pending → Processing
  const { data: toProcessing } = await supabase
    .from("orders")
    .update({ status: "Processing", updated_at: now.toISOString() })
    .eq("status", "Pending")
    .not("escrow_status", "in", '("locked","disputed")')
    .lte("created_at", h24)
    .select("id, buyer_id")

  // Processing → Shipped (24h after becoming Processing, tracked via updated_at)
  const { data: toShipped } = await supabase
    .from("orders")
    .update({ status: "Shipped", updated_at: now.toISOString() })
    .eq("status", "Processing")
    .not("escrow_status", "in", '("locked","disputed")')
    .lte("updated_at", h24)
    .select("id, buyer_id")

  // Notify buyers
  const notify = async (orders: any[], status: string) => {
    const msgs: Record<string, string> = {
      Processing: "Your order is being processed.",
      Shipped: "Your order has been shipped and is on its way!",
    }
    for (const o of orders || []) {
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

  return NextResponse.json({
    advanced: { toProcessing: toProcessing?.length ?? 0, toShipped: toShipped?.length ?? 0 },
  })
}
