import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import crypto from "crypto"

// MetaMap sends a signature header to verify authenticity
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.METAMAP_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-signature")

    if (process.env.METAMAP_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)

    // MetaMap sends eventName + resource with identity details
    const eventName: string = payload?.eventName || ""
    const identity = payload?.resource || payload?.identity || {}

    // Only act on successful verification
    if (eventName !== "verification_completed" && eventName !== "step_completed") {
      return NextResponse.json({ received: true })
    }

    // MetaMap passes the userId we sent as metadata
    const userId: string | undefined =
      identity?.metadata?.userId ||
      payload?.metadata?.userId

    if (!userId) {
      console.warn("MetaMap webhook: no userId in metadata", payload)
      return NextResponse.json({ received: true })
    }

    const status: string = identity?.status || identity?.verificationStatus || ""
    const isVerified = status === "verified" || status === "reviewNeeded" || eventName === "verification_completed"

    if (!isVerified) {
      return NextResponse.json({ received: true })
    }

    const supabase = getSupabaseAdminClient()
    if (!supabase) throw new Error("Supabase admin not configured")

    const { error } = await supabase
      .from("users")
      .update({ is_verified: true })
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("MetaMap webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
