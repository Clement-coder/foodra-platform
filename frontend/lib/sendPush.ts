import webpush from "web-push"
import { getSupabaseAdminClient } from "./supabaseAdmin"

function getWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId)

  if (!subs?.length) return

  const wp = getWebPush()
  await Promise.allSettled(
    subs.map((row: any) => {
      const sub = JSON.parse(row.subscription)
      return wp.sendNotification(sub, JSON.stringify(payload)).catch(() => {
        supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
      })
    })
  )
}
