import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertSelfOrAdmin, AuthError, requireAdminUser, requireAuthenticatedUser } from "@/lib/serverAuth"

// GET /api/notifications?userId=xxx  — fetch user's notifications
// GET /api/notifications?broadcast=true&actorPrivyId=xxx — admin: get all users for broadcast
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || auth.user.id
    assertSelfOrAdmin(auth.user, userId)

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// POST /api/notifications — create notification(s)
// Body: { userId, type, title, message, link? }  — single user
// Body: { broadcast: true, actorPrivyId, type, title, message, link? } — all users (admin only)
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const body = await request.json()

    if (body.broadcast) {
      await requireAdminUser(request)
      const { data: users } = await supabase.from("users").select("id")
      if (!users?.length) return NextResponse.json({ success: true })

      const rows = users.map((u: any) => ({
        user_id: u.id,
        type: body.type || "broadcast",
        title: body.title,
        message: body.message,
        link: body.link || null,
      }))

      const { error } = await supabase.from("notifications").insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, count: rows.length })
    }

    await requireAdminUser(request)
    const { data, error } = await supabase.from("notifications").insert({
      user_id: body.userId,
      type: body.type || "system",
      title: body.title,
      message: body.message,
      link: body.link || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

// PATCH /api/notifications — mark as read
// Body: { userId, notificationId? } — if no notificationId, marks ALL as read
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { userId, notificationId } = await request.json()
    const targetUserId = userId || auth.user.id
    assertSelfOrAdmin(auth.user, targetUserId)

    let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", targetUserId)
    if (notificationId) query = query.eq("id", notificationId)

    const { error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
