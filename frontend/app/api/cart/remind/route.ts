/**
 * POST /api/cart/remind
 * Called by the client after 1 hour of inactivity on the cart page, then every 3 hours.
 * Body: { items: { name, qty, price }[], total: number }
 * Sends a cart abandonment email to the authenticated user.
 */
import { NextResponse } from "next/server"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"
import { sendCartAbandonmentEmail } from "@/lib/email"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { items, total } = await request.json()

    if (!items?.length) return NextResponse.json({ ok: true })

    const supabase = getSupabaseAdminClient()
    const email = auth.user.email
      ?? (supabase ? (await supabase.from("users").select("email").eq("id", auth.user.id).single()).data?.email : null)

    if (email) {
      sendCartAbandonmentEmail(email, auth.user.name || "Farmer", items, total, auth.user.id).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
