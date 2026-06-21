import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

function mapUser(u: any, wallet?: any) {
  return {
    id: u.id,
    name: u.name || "Unknown",
    avatar: u.avatar_url || "",
    role: u.role || "buyer",
    isVerified: !!u.is_verified,
    foodra_tag: wallet?.foodra_tag || null,
  }
}

// GET /api/users/search?q=name
// GET /api/users/search?foodra_tag=FDR-XXX
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  const foodra_tag = searchParams.get("foodra_tag")?.trim()?.toUpperCase()

  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json([])

  // Foodra tag lookup
  if (foodra_tag) {
    const { data: wallet } = await supabase
      .from("wallet_accounts")
      .select("user_id, foodra_tag")
      .eq("foodra_tag", foodra_tag)
      .maybeSingle()

    if (!wallet) return NextResponse.json([])

    const { data: user } = await supabase
      .from("users")
      .select("id, name, avatar_url, role, is_verified")
      .eq("id", wallet.user_id)
      .maybeSingle()

    return NextResponse.json(user ? [mapUser(user, wallet)] : [])
  }

  // Name or email search
  if (!q || q.length < 2) return NextResponse.json([])

  const { data: users } = await supabase
    .from("users")
    .select("id, name, avatar_url, role, is_verified")
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(10)

  if (!users?.length) return NextResponse.json([])

  // Attach foodra tags
  const ids = users.map((u) => u.id)
  const { data: wallets } = await supabase
    .from("wallet_accounts")
    .select("user_id, foodra_tag")
    .in("user_id", ids)

  const walletMap = Object.fromEntries((wallets ?? []).map((w) => [w.user_id, w]))
  return NextResponse.json(users.map((u) => mapUser(u, walletMap[u.id])))
}
