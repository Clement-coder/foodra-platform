import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"

// POST /api/admin/message — admin sends a notification to a specific user
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    await requireAdminUser(request)
    const { targetUserId, message } = await request.json()
    if (!targetUserId || !message?.trim())
      return NextResponse.json({ error: "targetUserId and message required" }, { status: 400 })

    await supabase.from("support_messages").insert({
      user_id: targetUserId,
      message: message.trim(),
      is_admin_reply: true,
    })

    await createNotification({
      userId: targetUserId,
      type: "broadcast",
      title: "Message from Foodra Admin",
      message: message.trim(),
      link: undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to send admin message" }, { status: 500 })
  }
}
