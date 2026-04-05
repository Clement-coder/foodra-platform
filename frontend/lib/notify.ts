import { getSupabaseAdminClient } from "./supabaseAdmin"

interface NotifyPayload {
  userId: string
  type: "order" | "funding" | "training" | "support" | "broadcast" | "system"
  title: string
  message: string
  link?: string
}

export async function createNotification(payload: NotifyPayload) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return
  await supabase.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link || null,
  })
}
