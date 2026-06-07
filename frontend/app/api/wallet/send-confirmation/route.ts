import { NextResponse } from "next/server"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"
import { sendCryptoSentEmail, sendCryptoReceivedEmail } from "@/lib/email"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { amount, token, toAddress, toName, txHash, ngnEquiv } = await request.json()

    const supabase = getSupabaseAdminClient()

    // Sender email (fallback to DB if auth doesn't carry it)
    const senderEmail = auth.user.email ||
      (supabase ? (await supabase.from("users").select("email").eq("id", auth.user.id).single()).data?.email : null)

    // Email sender
    if (senderEmail) {
      sendCryptoSentEmail(
        senderEmail, auth.user.name || "User",
        amount, token, toAddress, toName ?? null,
        txHash ?? null, ngnEquiv ?? null,
        auth.user.id
      ).catch((e) => console.error("Crypto send email error:", e))
    }

    // Email recipient if they're a Foodra user
    if (supabase && toAddress) {
      const { data: recipient } = await supabase
        .from("users")
        .select("id, name, email")
        .ilike("wallet_address", toAddress)
        .single()

      if (recipient?.email) {
        sendCryptoReceivedEmail(
          recipient.email, recipient.name || "User",
          amount, token,
          auth.user.wallet_address || "Unknown", auth.user.name ?? null,
          txHash ?? null, ngnEquiv ?? null,
          recipient.id
        ).catch((e) => console.error("Crypto receive email error:", e))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
