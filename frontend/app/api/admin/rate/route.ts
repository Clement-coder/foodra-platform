import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

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
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const body = await request.json()
  const { actorPrivyId, base_ngn_per_usdc, spread_percent } = body

  if (!actorPrivyId) return NextResponse.json({ error: "actorPrivyId required" }, { status: 400 })

  const { data: actor } = await supabase.from("users").select("id, role").eq("privy_id", actorPrivyId).single()
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Upsert — always keep a single row by deleting old and inserting new
  const { data: existing } = await supabase.from("rate_settings").select("id").limit(1).single()
  if (existing) {
    const { data, error } = await supabase
      .from("rate_settings")
      .update({ base_ngn_per_usdc, spread_percent, updated_by: actor.id, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    const { data, error } = await supabase
      .from("rate_settings")
      .insert({ base_ngn_per_usdc, spread_percent, updated_by: actor.id })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
}
