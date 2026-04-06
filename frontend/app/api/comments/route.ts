import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"

// GET /api/comments?productId=xxx
export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  const { data, error } = await supabase
    .from("product_comments")
    .select("id, comment, created_at, user_id, users!product_comments_user_id_fkey(name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/comments
export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { productId, userId, comment } = await request.json()
  if (!productId || !userId || !comment?.trim())
    return NextResponse.json({ error: "productId, userId, comment required" }, { status: 400 })

  const { data, error } = await supabase
    .from("product_comments")
    .insert({ product_id: productId, user_id: userId, comment: comment.trim() })
    .select("id, comment, created_at, user_id, users!product_comments_user_id_fkey(name, avatar_url)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the product owner (farmer)
  const { data: product } = await supabase
    .from("products")
    .select("farmer_id, name")
    .eq("id", productId)
    .single()

  if (product && product.farmer_id !== userId) {
    await createNotification({
      userId: product.farmer_id,
      type: "order",
      title: "New Comment on Your Product 💬",
      message: `Someone commented on your product "${product.name}".`,
      link: `/marketplace/${productId}`,
    })
  }

  return NextResponse.json(data)
}
