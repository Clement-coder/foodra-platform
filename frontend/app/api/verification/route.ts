import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createNotification } from "@/lib/notify"
import { AuthError, requireAdminUser, requireAuthenticatedUser } from "@/lib/serverAuth"

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const { searchParams } = new URL(request.url)
    const mineOnly = searchParams.get("mine") === "1"

    if (mineOnly || auth.user.role !== "admin") {
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", auth.user.id)
        .maybeSingle()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    const { data, error } = await supabase
      .from("verification_requests")
      .select("*, users(id, name, email, avatar_url, is_verified)")
      .order("submitted_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to fetch verification requests" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const auth = await requireAuthenticatedUser(request)
    const body = await request.json()

    if (auth.user.role !== "farmer" && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Only farmers can request verification" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("verification_requests")
      .upsert({
        user_id: auth.user.id,
        id_type: body.idType,
        id_number: body.idNumber,
        farm_address: body.farmAddress,
        farm_size: body.farmSize,
        status: "Pending",
        admin_note: null,
        reviewed_at: null,
      }, { onConflict: "user_id" })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin")
    for (const admin of admins || []) {
      await createNotification({
        userId: admin.id,
        type: "system",
        title: "New Farmer Verification Request",
        message: `${auth.user.name || "A farmer"} submitted a verification request for review.`,
        link: "/admin",
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to submit verification request" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    await requireAdminUser(request)
    const body = await request.json()
    const { requestId, status, adminNote } = body

    if (!requestId || !status) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from("verification_requests")
      .update({
        status,
        admin_note: adminNote || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("*")
      .single()

    if (error || !updated) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 })

    await supabase
      .from("users")
      .update({ is_verified: status === "Approved" })
      .eq("id", updated.user_id)

    await createNotification({
      userId: updated.user_id,
      type: "system",
      title: status === "Approved" ? "Farmer Verification Approved" : "Farmer Verification Update",
      message: status === "Approved"
        ? "Your farmer profile has been verified."
        : `Your verification request was rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`,
      link: "/profile",
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to update verification request" }, { status: 500 })
  }
}
