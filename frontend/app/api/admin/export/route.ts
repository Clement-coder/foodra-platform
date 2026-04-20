import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/admin/stats/export — CSV export of platform data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const actorPrivyId = searchParams.get("actorPrivyId")
  const type = searchParams.get("type") || "orders"

  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { data: actor } = await supabaseAdmin
    .from("users").select("role").eq("privy_id", actorPrivyId || "").single()
  if (!actor || actor.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let rows: any[] = []
  let headers: string[] = []

  if (type === "orders") {
    const { data } = await supabaseAdmin
      .from("orders").select("id, status, total_amount, escrow_status, created_at").order("created_at", { ascending: false })
    headers = ["ID", "Status", "Total (NGN)", "Escrow Status", "Created At"]
    rows = (data || []).map(o => [o.id, o.status, o.total_amount, o.escrow_status, o.created_at])
  } else if (type === "users") {
    const { data } = await supabaseAdmin
      .from("users").select("id, name, email, role, location, created_at").order("created_at", { ascending: false })
    headers = ["ID", "Name", "Email", "Role", "Location", "Joined"]
    rows = (data || []).map(u => [u.id, u.name, u.email, u.role, u.location, u.created_at])
  } else if (type === "funding") {
    const { data } = await supabaseAdmin
      .from("funding_applications").select("id, full_name, location, farm_type, amount_requested, status, created_at")
    headers = ["ID", "Name", "Location", "Farm Type", "Amount", "Status", "Submitted"]
    rows = (data || []).map(f => [f.id, f.full_name, f.location, f.farm_type, f.amount_requested, f.status, f.created_at])
  }

  const csv = [headers, ...rows].map(r => r.map((v: any) => `"${v ?? ""}"`).join(",")).join("\n")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="foodra-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
