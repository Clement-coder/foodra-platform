/**
 * POST /api/weather-email
 * Daily weather forecast + crop advisory emails — DISABLED.
 * To re-enable, restore the full implementation from git history.
 */
import { NextResponse } from "next/server"

function run(_request: Request) {
  return NextResponse.json({ disabled: true, sent: 0 })
}

export const GET  = run
export const POST = run
