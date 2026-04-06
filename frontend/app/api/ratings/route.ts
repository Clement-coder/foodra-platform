import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"

// GET /api/ratings?farmerId=xxx  — public: avg + count per star
// GET /api/ratings?farmerId=xxx&detail=1  — full list with buyer name (for profile)
export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const farmerId = searchParams.get("farmerId")
  const detail = searchParams.get("detail") === "1"

  if (!farmerId) return NextResponse.json({ error: "farmerId required" }, { status: 400 })

  const { data, error } = await supabase
    .from("farmer_ratings")
    .select(detail ? "id, stars, created_at, buyer_id, users!farmer_ratings_buyer_id_fkey(name, avatar_url)" : "stars")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ratings = data || []
  const total = ratings.length
  const avg = total ? ratings.reduce((s: number, r: any) => s + r.stars, 0) / total : 0
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach((r: any) => { breakdown[r.stars] = (breakdown[r.stars] || 0) + 1 })

  return NextResponse.json({ avg: parseFloat(avg.toFixed(1)), total, breakdown, ratings: detail ? ratings : [] })
}

// POST /api/ratings — submit a rating (buyer only, after delivery)
export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { buyerId, farmerId, orderId, stars } = await request.json()
  if (!buyerId || !farmerId || !orderId || !stars)
    return NextResponse.json({ error: "buyerId, farmerId, orderId, stars required" }, { status: 400 })

  // Verify order belongs to buyer and is delivered/released
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, escrow_status, status")
    .eq("id", orderId)
    .single()

  if (!order || order.buyer_id !== buyerId)
    return NextResponse.json({ error: "Order not found or not yours" }, { status: 403 })

  if (order.escrow_status !== "released" && order.status !== "Delivered")
    return NextResponse.json({ error: "You can only rate after delivery is confirmed" }, { status: 400 })

  const { data, error } = await supabase
    .from("farmer_ratings")
    .insert({ farmer_id: farmerId, buyer_id: buyerId, order_id: orderId, stars })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You already rated this order" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify farmer
  await createNotification({
    userId: farmerId,
    type: "order",
    title: "New Rating Received ⭐",
    message: `You received a ${stars}-star rating from a buyer.`,
    link: "/profile",
  })

  return NextResponse.json(data)
}
