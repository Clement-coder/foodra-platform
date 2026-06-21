import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const supabase = getSupabaseAdminClient()!

    let { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("balance_ngn, foodra_tag, pin_hash, created_at")
      .eq("user_id", auth.user.id)
      .single()

    if (!wallet) {
      const { data: created } = await supabase
        .from("wallet_accounts")
        .insert({ user_id: auth.user.id, foodra_tag: "" })
        .select("balance_ngn, foodra_tag, pin_hash, created_at")
        .single()
      wallet = created
    }

    return NextResponse.json({
      balance_ngn: wallet?.balance_ngn ?? "0",
      foodra_tag:  wallet?.foodra_tag  ?? "",
      has_pin:     !!wallet?.pin_hash,
    })
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
