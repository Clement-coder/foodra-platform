import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const extFromMime = (mime: string) => {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "bin"
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 500 })
    }

    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Failed to initialize Supabase admin client" }, { status: 500 })
    }

    const body = (await request.json()) as { base64?: string; fileName?: string }
    if (!body?.base64) {
      return NextResponse.json({ error: "base64 image is required" }, { status: 400 })
    }

    const match = body.base64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) {
      return NextResponse.json({ error: "Invalid base64 image format" }, { status: 400 })
    }

    const mimeType = match[1]
    const base64Data = match[2]
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, or WEBP." }, { status: 400 })
    }

    const buffer = Buffer.from(base64Data, "base64")
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image too large. Max size is 5MB." }, { status: 400 })
    }

    const extension = extFromMime(mimeType)
    const sanitizedName = (body.fileName || "product-image")
      .replace(/\.[a-zA-Z0-9]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 60)
    const filePath = `${Date.now()}-${sanitizedName}.${extension}`

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from("products")
      .upload(filePath, buffer, { contentType: mimeType, upsert: false })

    if (uploadError) throw uploadError

    const { data } = supabaseAdmin.storage.from("products").getPublicUrl(filePath)

    return NextResponse.json({ imageUrl: data.publicUrl, path: filePath })
  } catch (error: any) {
    console.error("Error uploading product image:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to upload image", code: error?.code },
      { status: 500 }
    )
  }
}
