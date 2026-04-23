import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"

// GET /api/admin/rate  — fetch current rate
// PATCH /api/admin/rate — update rate (admin only)

export async function GET() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })
  const { data, error } = await supabase
    .from("rate_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })
    const { user } = await requireAdminUser(request)

    const body = await request.json()
    const { actorPrivyId, base_ngn_per_usdc, spread_percent } = body
    void actorPrivyId

    const { data: existing } = await supabase.from("rate_settings").select("id").limit(1).single()
    if (existing) {
      const { data, error } = await supabase
        .from("rate_settings")
        .update({ base_ngn_per_usdc, spread_percent, updated_by: user.id, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    } else {
      const { data, error } = await supabase
        .from("rate_settings")
        .insert({ base_ngn_per_usdc, spread_percent, updated_by: user.id })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to update rate" }, { status: 500 })
  }
}
