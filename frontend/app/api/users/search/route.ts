import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

function mapUser(u: any) {
  return {
    id: u.id,
    name: u.name || "Unknown",
    avatar: u.avatar_url || "",
    wallet: u.wallet_address,
    role: u.role || "member",
    isVerified: !!u.is_verified,
  }
}

// GET /api/users/search?q=name  — search by name
// GET /api/users/search?wallet=0x...  — lookup by wallet address
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  const wallet = searchParams.get("wallet")?.trim()

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json([])

  // Wallet lookup — returns single user or null
  if (wallet) {
    const { data } = await supabase
      .from("users")
      .select("id, name, avatar_url, wallet_address, role, is_verified")
      .ilike("wallet_address", wallet)
      .maybeSingle()

    return NextResponse.json(data ? mapUser(data) : null)
  }

  // Name search
  if (!q || q.length < 2) return NextResponse.json([])

  const { data } = await supabase
    .from("users")
    .select("id, name, avatar_url, wallet_address, role, is_verified")
    .ilike("name", `%${q}%`)
    .not("wallet_address", "is", null)
    .limit(10)

  return NextResponse.json((data ?? []).map(mapUser))
}
