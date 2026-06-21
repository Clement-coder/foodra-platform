import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { requireAuthenticatedUser, AuthError } from "@/lib/serverAuth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") ?? "20")

    const supabase = getSupabaseAdminClient()!
    const { data } = await supabase
      .from("wallet_transactions")
      .select("id, type, category, amount_ngn, balance_after, note, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    return NextResponse.json(data ?? [])
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
