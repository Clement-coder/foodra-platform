import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"

function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let ref = "RC-"
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

// GET /api/wallet/fund-request?userId=xxx  — user's own requests
// GET /api/wallet/fund-request?admin=1&actorPrivyId=xxx  — all requests (admin)
export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const isAdmin = searchParams.get("admin") === "1"
  const actorPrivyId = searchParams.get("actorPrivyId")

  if (isAdmin) {
    if (!actorPrivyId) return NextResponse.json({ error: "actorPrivyId required" }, { status: 400 })
    const { data: actor } = await supabase.from("users").select("role").eq("privy_id", actorPrivyId).single()
    if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const { data, error } = await supabase
      .from("wallet_funding_requests")
      .select("*, users(id, name, email, wallet_address)")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("wallet_funding_requests admin GET error:", error.message)
      return NextResponse.json([])
    }
    return NextResponse.json(data)
  }

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })
  const { data, error } = await supabase
    .from("wallet_funding_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) {
    // Table may not exist yet — return empty rather than 500
    console.error("wallet_funding_requests GET error:", error.message)
    return NextResponse.json([])
  }
  return NextResponse.json(data)
}

// POST /api/wallet/fund-request — create a new funding request
export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const body = await request.json()
  const { userId, ngnAmount } = body
  if (!userId || !ngnAmount) return NextResponse.json({ error: "userId and ngnAmount required" }, { status: 400 })

  // Fetch current rate — fall back to default if not configured
  const { data: rate } = await supabase
    .from("rate_settings")
    .select("base_ngn_per_usdc, spread_percent")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()

  const baseRate = rate?.base_ngn_per_usdc ?? 1600
  const spreadPct = 0  // no platform fee
  const effectiveRate = baseRate
  const usdcAmount = parseFloat((ngnAmount / effectiveRate).toFixed(6))

  if (usdcAmount < 1) {
    return NextResponse.json({ error: `Minimum funding is 1 USDC. Please enter at least ₦${Math.ceil(effectiveRate).toLocaleString()}.` }, { status: 400 })
  }

  // Generate unique reference
  let reference = generateReference()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase.from("wallet_funding_requests").select("id").eq("reference", reference).single()
    if (!existing) break
    reference = generateReference()
    attempts++
  }

  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString() // 20 minutes

  const { data, error } = await supabase
    .from("wallet_funding_requests")
    .insert({
      user_id: userId,
      reference,
      ngn_amount: ngnAmount,
      usdc_amount: usdcAmount,
      rate_ngn_per_usdc: effectiveRate,
      spread_percent: spreadPct,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 })

  // Notify user
  await createNotification({
    userId,
    type: "system",
    title: "Funding Request Received",
    message: `Your request to fund ₦${Number(ngnAmount).toLocaleString()} (≈ ${usdcAmount} USDC) has been received. Reference: ${reference}. Please complete the bank transfer within 20 minutes.`,
    link: "/wallet",
  })

  return NextResponse.json(data)
}

// PATCH /api/wallet/fund-request — admin approve/reject or expire
export async function PATCH(request: Request) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

  const body = await request.json()
  const { requestId, status, actorPrivyId, adminNote } = body

  if (!requestId || !status || !actorPrivyId)
    return NextResponse.json({ error: "requestId, status, actorPrivyId required" }, { status: 400 })

  const { data: actor } = await supabase.from("users").select("role").eq("privy_id", actorPrivyId).single()
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await supabase
    .from("wallet_funding_requests")
    .update({ status, admin_note: adminNote || null })
    .eq("id", requestId)
    .select("*, users(id, name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify user
  if (data?.user_id) {
    const msgs: Record<string, string> = {
      Confirmed: `Your bank transfer of ₦${Number(data.ngn_amount).toLocaleString()} (ref: ${data.reference}) has been confirmed. ${data.usdc_amount} USDC has been credited to your wallet.`,
      Rejected: `Your funding request (ref: ${data.reference}) was rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`,
      Expired: `Your funding request (ref: ${data.reference}) has expired. Please create a new request.`,
    }
    await createNotification({
      userId: data.user_id,
      type: "system",
      title: status === "Confirmed" ? "Wallet Funded ✅" : status === "Rejected" ? "Funding Request Rejected" : "Funding Request Expired",
      message: msgs[status] || "",
      link: "/wallet",
    })
  }

  return NextResponse.json(data)
}
