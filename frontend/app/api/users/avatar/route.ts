import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { base64 } = await request.json()
    if (!base64) return NextResponse.json({ error: "base64 required" }, { status: 400 })

    const match = base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return NextResponse.json({ error: "Invalid image format" }, { status: 400 })

    const [, mimeType, base64Data] = match
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg"
    const buffer = Buffer.from(base64Data, "base64")
    const path = `${auth.user.id}/avatar.${ext}`

    await supabaseAdmin.storage.from("avatars").remove([`${auth.user.id}/avatar.jpg`, `${auth.user.id}/avatar.png`, `${auth.user.id}/avatar.webp`])

    const { error } = await supabaseAdmin.storage.from("avatars").upload(path, buffer, { contentType: mimeType, upsert: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(path)
    await supabaseAdmin.from("users").update({ avatar_url: data.publicUrl }).eq("id", auth.user.id)

    return NextResponse.json({ avatarUrl: data.publicUrl })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
  }
}
