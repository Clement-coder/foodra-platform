import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/users/[id]/stats — public farmer stats
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const [productsRes, ordersRes, ratingsRes] = await Promise.all([
    supabaseAdmin.from("products").select("id", { count: "exact" }).eq("farmer_id", id).eq("is_available", true),
    supabaseAdmin.from("order_items").select("orders!inner(escrow_status)").eq("orders.escrow_status", "released"),
    supabaseAdmin.from("ratings").select("rating").eq("farmer_id", id),
  ])

  const productCount = productsRes.count ?? 0
  const completedOrders = ordersRes.data?.length ?? 0
  const ratings = ratingsRes.data ?? []
  const avgRating = ratings.length > 0
    ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length
    : 0

  return NextResponse.json({
    productCount,
    completedOrders,
    ratingCount: ratings.length,
    avgRating: Math.round(avgRating * 10) / 10,
  })
}
