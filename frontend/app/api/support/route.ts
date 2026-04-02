import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/support?userId=... - get messages for a user
export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("support_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// POST /api/support - send a message
export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const body = await request.json()
  const { userId, message, imageUrl, isAdminReply } = body

  if (!userId || !message) return NextResponse.json({ error: "userId and message required" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("support_messages")
    .insert({ user_id: userId, message, image_url: imageUrl || null, is_admin_reply: isAdminReply || false })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
