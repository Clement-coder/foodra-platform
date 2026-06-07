import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"
import { sendAdminMessageEmail } from "@/lib/email"

// POST /api/admin/message
// - { targetUserId, message }       → send to one user
// - { broadcast: true, message }    → send to ALL users
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    await requireAdminUser(request)
    const { targetUserId, broadcast, message } = await request.json()

    if (!message?.trim())
      return NextResponse.json({ error: "message is required" }, { status: 400 })

    if (broadcast) {
      // Fetch all users with an email
      const { data: users, error } = await supabase.from("users").select("id, email, name").not("email", "is", null)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await Promise.all(
        (users ?? []).map(async (user) => {
          await createNotification({
            userId: user.id,
            type: "broadcast",
            title: "Message from Foodra Admin",
            message: message.trim(),
            link: undefined,
          })
          if (user.email) {
            await sendAdminMessageEmail(user.email, user.name || "User", message.trim()).catch(() => {})
          }
        })
      )

      return NextResponse.json({ success: true, sent: users?.length ?? 0 })
    }

    // Single user
    if (!targetUserId)
      return NextResponse.json({ error: "targetUserId or broadcast required" }, { status: 400 })

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

    const { data: user } = await supabase.from("users").select("email, name").eq("id", targetUserId).single()
    if (user?.email) await sendAdminMessageEmail(user.email, user.name || "User", message.trim()).catch(() => {})

    return NextResponse.json({ success: true, sent: 1 })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

