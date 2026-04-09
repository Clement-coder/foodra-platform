import { NextResponse } from "next/server"
import webpush from "web-push"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST /api/push — save subscription
export async function POST(req: Request) {
  const { subscription, userId } = await req.json()
  if (!subscription || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  await supabase.from("push_subscriptions").upsert(
    { user_id: userId, subscription: JSON.stringify(subscription), endpoint: subscription.endpoint },
    { onConflict: "endpoint" }
  )

  return NextResponse.json({ success: true })
}

// DELETE /api/push — remove subscription
export async function DELETE(req: Request) {
  const { endpoint } = await req.json()
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint)
  return NextResponse.json({ success: true })
}
