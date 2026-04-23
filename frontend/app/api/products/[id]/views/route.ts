import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/products/[id]/views — increment view count
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ ok: false })

  try {
    await supabaseAdmin.from("product_views").insert({ product_id: id }).throwOnError()
  } catch {
    // Ignore errors (duplicate views, etc.)
  }
  return NextResponse.json({ ok: true })
}
