import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { computeMembership } from "@/lib/membership"

// GET /api/users/[id]/membership — get membership score with server-side data
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  // Get user profile
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("name, phone, location, avatar, created_at, is_verified")
    .eq("id", id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Get orders count
  const { count: ordersCount } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact" })
    .eq("user_id", id)

  // Check for disputes
  const { count: disputesCount } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact" })
    .eq("user_id", id)
    .eq("has_dispute", true)

  const membership = computeMembership({
    hasName: !!user.name,
    hasPhone: !!user.phone,
    hasLocation: !!user.location,
    hasAvatar: !!user.avatar,
    createdAt: user.created_at,
    ordersCount: ordersCount || 0,
    hasDisputes: (disputesCount || 0) > 0,
    isVerified: !!user.is_verified,
  })

  return NextResponse.json(membership)
}
