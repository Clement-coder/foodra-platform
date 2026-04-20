import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/health — platform health check
export async function GET() {
  const supabaseAdmin = getSupabaseAdminClient()
  let dbOk = false

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from("users").select("id").limit(1)
    dbOk = !error
  }

  const status = dbOk ? "ok" : "degraded"
  return NextResponse.json(
    { status, db: dbOk ? "connected" : "error", ts: new Date().toISOString() },
    { status: dbOk ? 200 : 503 }
  )
}
