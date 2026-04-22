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

  const privyConfigured = !!(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_SECRET_KEY
  )

  const allOk = dbOk && privyConfigured
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      db: dbOk ? "connected" : "error",
      auth: privyConfigured ? "configured" : "missing_secret",
      ts: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  )
}
