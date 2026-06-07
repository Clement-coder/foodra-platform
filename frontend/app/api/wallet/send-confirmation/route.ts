import { NextResponse } from "next/server"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"
import { sendCryptoSentEmail, sendCryptoReceivedEmail } from "@/lib/email"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { amount, token, toAddress, toName, txHash, ngnEquiv } = await request.json()

    if (!amount || !token || !toAddress) {
      return NextResponse.json({ error: "amount, token, toAddress required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Fetch sender email from DB (Privy auth may not include it)
    const senderEmail = auth.user.email
      ?? (supabase
          ? (await supabase.from("users").select("email").eq("id", auth.user.id).single()).data?.email
          : null)

    const senderName = auth.user.name || "User"
    const senderWallet = auth.user.wallet_address || ""

    // ── Email: sender ──
    if (senderEmail) {
      sendCryptoSentEmail(
        senderEmail, senderName,
        amount, token,
        toAddress, toName ?? null,
        txHash ?? null,
        ngnEquiv ?? null,
        auth.user.id
      ).catch(e => console.error("Crypto sent email error:", e))
    } else {
      console.warn("send-confirmation: no sender email for user", auth.user.id)
    }

    // ── Email: recipient if they're a Foodra user ──
    if (supabase && toAddress) {
      const { data: recipient } = await supabase
        .from("users")
        .select("id, name, email")
        .ilike("wallet_address", toAddress)
        .maybeSingle()

      if (recipient?.email) {
        sendCryptoReceivedEmail(
          recipient.email, recipient.name || "User",
          amount, token,
          senderWallet, senderName,
          txHash ?? null,
          ngnEquiv ?? null,
          recipient.id
        ).catch(e => console.error("Crypto received email error:", e))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error("send-confirmation error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
