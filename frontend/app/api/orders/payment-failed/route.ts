import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"
import { sendPaymentFailedEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { orderId, reason } = await request.json()
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 })

    const supabase = getSupabaseAdminClient()

    // Fetch order items for the breakdown email
    let items: { name: string; qty: number; price: number }[] = []
    let total = 0
    if (supabase) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, price")
        .eq("order_id", orderId)
      if (orderItems?.length) {
        items = orderItems.map((i: any) => ({ name: i.product_name, qty: i.quantity, price: Number(i.price) }))
        total = items.reduce((s, i) => s + i.price * i.qty, 0)
      }

      // Clean up the pending order (only if it belongs to this user and has no locked escrow)
      await supabase.from("order_items").delete().eq("order_id", orderId)
      await supabase.from("orders").delete().eq("id", orderId).eq("buyer_id", auth.user.id).neq("escrow_status", "locked")
    }

    if (auth.user.email) {
      sendPaymentFailedEmail(auth.user.email, auth.user.name || "User", orderId, reason, auth.user.id, items, total || undefined).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
