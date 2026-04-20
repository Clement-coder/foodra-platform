import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { rateLimit, getClientIp } from "@/lib/rateLimit"

// POST /api/contact — contact form submission
export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = rateLimit(`contact:${ip}`, { limit: 3, windowSec: 3600 })
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })

  const body = await request.json()
  const { name, email, subject, message } = body

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { error } = await supabaseAdmin.from("support_messages").insert({
    user_id: null,
    name,
    email,
    subject: subject || "Contact Form",
    message,
    source: "contact_page",
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
