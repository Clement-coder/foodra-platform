import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"

// POST /api/products/[id]/views — increment view count
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ ok: false })

  try {
    // Try to get authenticated user, but don't require it
    let userId = null
    try {
      const auth = await requireAuthenticatedUser(req)
      userId = auth.user.id
    } catch {
      // Anonymous view tracking is fine
    }

    // Use upsert to prevent duplicate views from same user within 24 hours
    if (userId) {
      await supabaseAdmin.rpc('record_unique_view', {
        p_product_id: id,
        p_user_id: userId
      })
    } else {
      // Anonymous view - just insert
      await supabaseAdmin.from("product_views").insert({ 
        product_id: id,
        user_id: null 
      })
    }
  } catch (error) {
    // Ignore most errors but log them
    console.error('View tracking error:', error)
  }
  return NextResponse.json({ ok: true })
}
