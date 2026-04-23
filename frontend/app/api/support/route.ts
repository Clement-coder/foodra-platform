import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { assertSelfOrAdmin, AuthError, requireAdminUser, requireAuthenticatedUser } from "@/lib/serverAuth"

// GET /api/support?userId=... - get messages for a user
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || auth.user.id
    assertSelfOrAdmin(auth.user, userId)

    const { data, error } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/support - send a message
export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const body = await request.json()
    const { userId, message, imageBase64, isAdminReply } = body
    const targetUserId = userId || auth.user.id

    if (!targetUserId || (!message && !imageBase64)) return NextResponse.json({ error: "userId and message or image required" }, { status: 400 })
    if (isAdminReply) {
      if (auth.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    } else {
      assertSelfOrAdmin(auth.user, targetUserId)
    }

    let imageUrl: string | null = null

    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
      if (match) {
        const [, mimeType, base64Data] = match
        const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg"
        const buffer = Buffer.from(base64Data, "base64")
        const path = `support/${targetUserId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, { contentType: mimeType })
        if (!uploadError) {
          const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path)
          imageUrl = data.publicUrl
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("support_messages")
      .insert({ user_id: targetUserId, message: message || "📎 Image", image_url: imageUrl, is_admin_reply: isAdminReply || false })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (isAdminReply && targetUserId) {
      await createNotification({
        userId: targetUserId,
        type: "support",
        title: "New Support Reply",
        message: message && message !== "📎 Image" ? message.slice(0, 100) : "Admin sent you an image.",
      })
    }

    if (!isAdminReply) {
      const { data: admins } = await supabaseAdmin.from("users").select("id").eq("role", "admin")
      for (const admin of admins || []) {
        await createNotification({
          userId: admin.id,
          type: "support",
          title: "New Support Message",
          message: message && message !== "📎 Image" ? message.slice(0, 100) : "A user sent an image.",
          link: "/admin",
        })
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

// PATCH /api/support - resolve a conversation (delete all messages for a user)
export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

    await requireAdminUser(request)
    const body = await request.json()
    const { userId } = body

    const { error } = await supabaseAdmin.from("support_messages").delete().eq("user_id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to resolve conversation" }, { status: 500 })
  }
}
