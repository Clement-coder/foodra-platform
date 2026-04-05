import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/notifications?userId=xxx  — fetch user's notifications
// GET /api/notifications?broadcast=true&actorPrivyId=xxx — admin: get all users for broadcast
export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/notifications — create notification(s)
// Body: { userId, type, title, message, link? }  — single user
// Body: { broadcast: true, actorPrivyId, type, title, message, link? } — all users (admin only)
export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const body = await request.json()

  if (body.broadcast) {
    // Admin broadcast
    const { data: actor } = await supabase.from("users").select("role").eq("privy_id", body.actorPrivyId).single()
    if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

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

  // Single user notification
  const { data, error } = await supabase.from("notifications").insert({
    user_id: body.userId,
    type: body.type || "system",
    title: body.title,
    message: body.message,
    link: body.link || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/notifications — mark as read
// Body: { userId, notificationId? } — if no notificationId, marks ALL as read
export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { userId, notificationId } = await request.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId)
  if (notificationId) query = query.eq("id", notificationId)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
