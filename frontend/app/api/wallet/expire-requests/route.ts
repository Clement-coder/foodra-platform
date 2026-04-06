import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"

// POST /api/wallet/expire-requests
// Called by a cron job (e.g. Vercel cron) or on-demand to expire stale pending requests
export async function POST() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { data: expired, error } = await supabase
    .from("wallet_funding_requests")
    .update({ status: "Expired" })
    .eq("status", "Pending")
    .lt("expires_at", new Date().toISOString())
    .select("id, user_id, reference, ngn_amount")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify each affected user
  for (const r of expired || []) {
    await createNotification({
      userId: r.user_id,
      type: "system",
      title: "Funding Request Expired",
      message: `Your funding request (ref: ${r.reference}) for ₦${Number(r.ngn_amount).toLocaleString()} has expired. Please create a new request if you still wish to fund your wallet.`,
      link: "/wallet",
    })
  }

  return NextResponse.json({ expired: expired?.length ?? 0 })
}
