import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"

// POST /api/admin/message — admin sends a notification to a specific user
export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { actorPrivyId, targetUserId, message } = await request.json()
  if (!actorPrivyId || !targetUserId || !message?.trim())
    return NextResponse.json({ error: "actorPrivyId, targetUserId, message required" }, { status: 400 })

  const { data: actor } = await supabase.from("users").select("role, name").eq("privy_id", actorPrivyId).single()
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Save as a support message (is_admin_reply=true) so it appears in the Support tab
  await supabase.from("support_messages").insert({
    user_id: targetUserId,
    message: message.trim(),
    is_admin_reply: true,
  })

  // Also send an in-app notification
  await createNotification({
    userId: targetUserId,
    type: "broadcast",
    title: "Message from Foodra Admin",
    message: message.trim(),
    link: undefined,
  })

  return NextResponse.json({ success: true })
}
