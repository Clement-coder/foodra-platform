import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/users/search?q=name — search users that have a wallet address
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json([])

  const { data } = await supabase
    .from("users")
    .select("id, name, avatar_url, wallet_address, role, is_verified")
    .ilike("name", `%${q}%`)
    .not("wallet_address", "is", null)
    .limit(10)

  return NextResponse.json(
    (data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name || "Unknown",
      avatar: u.avatar_url || "",
      wallet: u.wallet_address,
      role: u.role || "member",
      isVerified: !!u.is_verified,
    }))
  )
}
