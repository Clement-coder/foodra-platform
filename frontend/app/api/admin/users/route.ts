import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"

// PATCH /api/admin/users - update user role
export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

    await requireAdminUser(request)
    const { userId, role } = await request.json()

    const { data, error } = await supabaseAdmin
      .from("users").update({ role }).eq("id", userId).select("*").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
