import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"
import bcrypt from "bcryptjs"

// POST /api/wallet/pin — set or change wallet PIN
// Body: { pin: string, currentPin?: string }
// - First-time setup: only pin required
// - Change: both currentPin and pin required
export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { pin, currentPin } = await request.json()

    if (!pin || !/^\d{4}$/.test(String(pin)))
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 })

    const supabase = getSupabaseAdminClient()!

    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("pin_hash")
      .eq("user_id", auth.user.id)
      .single()

    if (!wallet)
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })

    // If PIN already set, require current PIN to change it
    if (wallet.pin_hash) {
      if (!currentPin)
        return NextResponse.json({ error: "Current PIN is required to set a new PIN" }, { status: 400 })

      const valid = await bcrypt.compare(String(currentPin), wallet.pin_hash)
      if (!valid)
        return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 400 })
    }

    const pin_hash = await bcrypt.hash(String(pin), 10)

    await supabase
      .from("wallet_accounts")
      .update({ pin_hash })
      .eq("user_id", auth.user.id)

    // Reset any failed attempts on PIN change
    await supabase
      .from("wallet_pin_attempts")
      .upsert({ user_id: auth.user.id, fail_count: 0, locked_until: null, updated_at: new Date().toISOString() },
        { onConflict: "user_id" })

    return NextResponse.json({ success: true, message: wallet.pin_hash ? "PIN changed" : "PIN set" })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Failed to update PIN" }, { status: 500 })
  }
}
