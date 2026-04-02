import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// PATCH /api/admin/users - update user role
export async function PATCH(request: Request) {
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { actorPrivyId, userId, role } = await request.json()

  const { data: actor } = await supabaseAdmin
    .from("users").select("role").eq("privy_id", actorPrivyId).single()
  if (!actor || actor.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from("users").update({ role }).eq("id", userId).select("*").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
