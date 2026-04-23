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

    await supabaseAdmin.from("product_views").insert({ 
      product_id: id,
      user_id: userId 
    }).throwOnError()
  } catch {
    // Ignore errors (duplicate views, etc.)
  }
  return NextResponse.json({ ok: true })
}
