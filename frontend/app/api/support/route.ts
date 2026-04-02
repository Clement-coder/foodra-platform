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
  const { userId, message, imageBase64, isAdminReply } = body

  if (!userId || (!message && !imageBase64)) return NextResponse.json({ error: "userId and message or image required" }, { status: 400 })

  let imageUrl: string | null = null

  if (imageBase64) {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (match) {
      const [, mimeType, base64Data] = match
      const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg"
      const buffer = Buffer.from(base64Data, "base64")
      const path = `support/${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, { contentType: mimeType })
      if (!uploadError) {
        const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path)
        imageUrl = data.publicUrl
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("support_messages")
    .insert({ user_id: userId, message: message || "📎 Image", image_url: imageUrl, is_admin_reply: isAdminReply || false })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
