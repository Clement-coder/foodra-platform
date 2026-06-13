/**
 * POST /api/cart/remind
 * Called by the client 1 hour after cart becomes non-empty and idle.
 * Sends the first abandonment email immediately, then registers the user
 * in cart_abandonment_reminders so the hourly cron sends 24h follow-ups.
 */
import { NextResponse } from "next/server"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"
import { sendCartAbandonmentEmail } from "@/lib/email"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { items, total } = await request.json()

    if (!items?.length) {
      // Cart is empty — clear any pending reminder row
      const supabase = getSupabaseAdminClient()
      if (supabase) await supabase.from("cart_abandonment_reminders").delete().eq("user_id", auth.user.id)
      return NextResponse.json({ ok: true })
    }

    const supabase = getSupabaseAdminClient()
    const email =
      auth.user.email ??
      (supabase
        ? (await supabase.from("users").select("email").eq("id", auth.user.id).single()).data?.email
        : null)

    // Send first email immediately
    if (email) {
      sendCartAbandonmentEmail(email, auth.user.name || "Farmer", items, total, auth.user.id).catch(() => {})
    }

    // Register/refresh reminder row so cron fires again at 24 h
    if (supabase) {
      const nextRemind = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      await supabase.from("cart_abandonment_reminders").upsert(
        {
          user_id: auth.user.id,
          items,
          total,
          reminder_count: 1,
          last_reminded_at: new Date().toISOString(),
          next_remind_at: nextRemind,
        },
        { onConflict: "user_id" }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
