import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"

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
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { productId, comment } = await request.json()

    if (!productId || !comment?.trim())
      return NextResponse.json({ error: "productId and comment required" }, { status: 400 })

    // Block product owner from commenting on their own product
    const { data: product } = await supabase
      .from("products")
      .select("farmer_id, name")
      .eq("id", productId)
      .single()

    if (product?.farmer_id === auth.user.id)
      return NextResponse.json({ error: "You cannot comment on your own product" }, { status: 403 })

    const { data, error } = await supabase
      .from("product_comments")
      .insert({ product_id: productId, user_id: auth.user.id, comment: comment.trim() })
      .select("id, comment, created_at, user_id, users!product_comments_user_id_fkey(name, avatar_url)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the product owner (farmer)
    if (product && product.farmer_id !== auth.user.id) {
      await createNotification({
        userId: product.farmer_id,
        type: "order",
        title: "New Comment on Your Product 💬",
        message: `Someone commented on your product "${product.name}".`,
        link: `/marketplace/${productId}`,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
  }
}
