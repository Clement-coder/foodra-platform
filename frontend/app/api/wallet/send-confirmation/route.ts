import { NextResponse } from "next/server"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"
import { sendCryptoSentEmail } from "@/lib/email"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { amount, token, toAddress, toName, txHash, ngnEquiv } = await request.json()

    const supabase = getSupabaseAdminClient()
    // Fallback email lookup if auth doesn't carry it
    const userEmail = auth.user.email ||
      (supabase ? (await supabase.from("users").select("email").eq("id", auth.user.id).single()).data?.email : null)

    if (userEmail) {
      sendCryptoSentEmail(
        userEmail, auth.user.name || "User",
        amount, token, toAddress, toName ?? null,
        txHash ?? null, ngnEquiv ?? null,
        auth.user.id
      ).catch((e) => console.error("Crypto send email error:", e))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
