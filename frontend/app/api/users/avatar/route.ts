import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { base64, userId } = await request.json()
  if (!base64 || !userId) return NextResponse.json({ error: "base64 and userId required" }, { status: 400 })

  const match = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return NextResponse.json({ error: "Invalid image format" }, { status: 400 })

  const [, mimeType, base64Data] = match
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg"
  const buffer = Buffer.from(base64Data, "base64")
  const path = `${userId}/avatar.${ext}`

  // Remove old avatar files
  await supabaseAdmin.storage.from("avatars").remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`])

  const { error } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, { contentType: mimeType, upsert: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path)

  // Update user record
  await supabaseAdmin.from("users").update({ avatar_url: data.publicUrl }).eq("id", userId)

  return NextResponse.json({ avatarUrl: data.publicUrl })
}
