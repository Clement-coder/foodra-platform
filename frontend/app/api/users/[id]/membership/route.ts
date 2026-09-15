import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { computeMembership } from "@/lib/membership"

// GET /api/users/[id]/membership — compute, persist, and return membership score
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  // Fetch all inputs in parallel
  const [userRes, ordersRes, disputesRes] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("name, phone, location, avatar_url, created_at, is_verified")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", id),
    // Correctly query the order_disputes table — not a column on orders
    supabaseAdmin
      .from("order_disputes")
      .select("id")
      .eq("user_id", id)
      .limit(1),
  ])

  const user = userRes.data

  const membership = computeMembership({
    hasName: !!user?.name,
    hasPhone: !!user?.phone,
    hasLocation: !!user?.location,
    hasAvatar: !!user?.avatar_url,
    createdAt: user?.created_at || new Date().toISOString(),
    ordersCount: ordersRes.count || 0,
    hasDisputes: (disputesRes.data?.length ?? 0) > 0,
    isVerified: !!user?.is_verified,
  })

  // Persist the computed score and tier back to the DB so it stays in sync
  await supabaseAdmin
    .from("users")
    .update({
      membership_score: membership.total,
      membership_tier: membership.tier,
      // Auto-verify on Champion, but don't strip verified status if score drops
      ...(membership.isAutoVerified ? { is_verified: true } : {}),
    })
    .eq("id", id)

  return NextResponse.json(membership)
}
