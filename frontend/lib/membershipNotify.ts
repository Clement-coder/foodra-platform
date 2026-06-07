/**
 * Server-side helper: compute membership tier for a user and fire an upgrade
 * email if their tier has increased since `previousTier`.
 *
 * Call this after any action that can raise a tier:
 *  - profile completion (PATCH /api/users/sync)
 *  - new order placed (POST /api/orders)
 */
import { computeMembership, TIERS } from "@/lib/membership"
import { sendMembershipUpgradeEmail } from "@/lib/email"

const tierRank = (tier: string) => TIERS.findIndex(t => t.tier === tier)

export async function checkAndNotifyMembershipUpgrade(
  supabase: any,
  userId: string,
  previousTier: string,
) {
  try {
    const [userRes, ordersRes, disputesRes] = await Promise.all([
      supabase.from("users").select("name, email, has_name:name, phone, location, avatar_url, created_at, is_verified").eq("id", userId).single(),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", userId),
      supabase.from("order_disputes").select("id").eq("user_id", userId).limit(1),
    ])

    const u = userRes.data
    if (!u?.email) return

    const score = computeMembership({
      hasName: !!u.name,
      hasPhone: !!u.phone,
      hasLocation: !!u.location,
      hasAvatar: !!u.avatar_url,
      createdAt: u.created_at,
      ordersCount: ordersRes.count ?? 0,
      hasDisputes: (disputesRes.data?.length ?? 0) > 0,
      isVerified: !!u.is_verified,
    })

    if (tierRank(score.tier) > tierRank(previousTier)) {
      sendMembershipUpgradeEmail(u.email, u.name || "User", score.tier, score.total, userId).catch(() => {})
    }
  } catch {
    // non-critical — never block the main response
  }
}
