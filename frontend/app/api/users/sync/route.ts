import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type SyncBody = {
  privyId: string
  name: string
  email: string
  wallet: string
  avatar: string
}

type UpdateBody = {
  privyId: string
  phone?: string
  location?: string
  role?: "farmer" | "buyer" | "admin"
  avatar_url?: string
}

const mapUser = (u: any) => ({
  id: u.id,
  name: u.name || "",
  email: u.email || "",
  avatar: u.avatar_url || "",
  wallet: u.wallet_address || "",
  createdAt: u.created_at,
  phone: u.phone || "",
  location: u.location || undefined,
  role: u.role || "buyer",
})

const isMissingColumnError = (error: any) =>
  error?.code === "42703" || String(error?.message || "").includes("does not exist")

const removeMissingColumnFromPayload = (payload: Record<string, any>, error: any) => {
  const message = String(error?.message || "")
  const match = message.match(/column\s+"([^"]+)"/i)
  if (match?.[1]) {
    delete payload[match[1]]
    return true
  }

  // Common fallback for role/phone migrations not yet applied
  if ("role" in payload) {
    delete payload.role
    return true
  }
  if ("phone" in payload) {
    delete payload.phone
    return true
  }

  return false
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 500 })
    }

    const body = (await request.json()) as SyncBody
    if (!body?.privyId) {
      return NextResponse.json({ error: "privyId is required" }, { status: 400 })
    }

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("privy_id", body.privyId)
      .maybeSingle()

    const payload: Record<string, any> = existingUser
      ? {
          name: body.name || "User",
          email: body.email || null,
          wallet_address: body.wallet || null,
          // Don't overwrite a custom uploaded avatar — only set if user has no avatar yet
          ...(existingUser.avatar_url ? {} : { avatar_url: body.avatar || null }),
        }
      : {
          privy_id: body.privyId,
          name: body.name || "User",
          email: body.email || null,
          wallet_address: body.wallet || null,
          avatar_url: body.avatar || null,
          role: "buyer",
        }

    const runWrite = async () => {
      const query = existingUser
        ? supabaseAdmin.from("users").update(payload).eq("privy_id", body.privyId)
        : supabaseAdmin.from("users").insert(payload)
      return query.select("*").single()
    }

    let { data, error } = await runWrite()
    if (error && isMissingColumnError(error) && removeMissingColumnFromPayload(payload, error)) {
      ;({ data, error } = await runWrite())
    }

    if (error) throw error
    return NextResponse.json(mapUser(data))
  } catch (error: any) {
    console.error("Error syncing user:", error)
    const hint =
      error?.code === "42501"
        ? "Permission denied. Ensure SUPABASE_SERVICE_ROLE_KEY is set and server restarted."
        : undefined
    return NextResponse.json(
      { error: error?.message || "Failed to sync user", code: error?.code, hint },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase service role key is not configured" }, { status: 500 })
    }

    const body = (await request.json()) as UpdateBody
    if (!body?.privyId) {
      return NextResponse.json({ error: "privyId is required" }, { status: 400 })
    }

    const updatePayload: Record<string, string | null> = {}
    if ("phone" in body) updatePayload.phone = body.phone || null
    if ("avatar_url" in body) updatePayload.avatar_url = body.avatar_url || null
    if ("location" in body) updatePayload.location = body.location || null
    if ("role" in body && body.role) updatePayload.role = body.role

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 })
    }

    const runUpdate = async () =>
      supabaseAdmin
        .from("users")
        .update(updatePayload)
        .eq("privy_id", body.privyId)
        .select("*")
        .single()

    let { data, error } = await runUpdate()
    while (error && isMissingColumnError(error) && removeMissingColumnFromPayload(updatePayload, error)) {
      if (Object.keys(updatePayload).length === 0) {
        const { data: existing, error: fetchError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("privy_id", body.privyId)
          .single()
        if (fetchError) throw fetchError
        return NextResponse.json(mapUser(existing))
      }
      ;({ data, error } = await runUpdate())
    }

    if (error) throw error
    return NextResponse.json(mapUser(data))
  } catch (error: any) {
    console.error("Error updating user profile fields:", error)
    const hint =
      error?.code === "42501"
        ? "Permission denied. Ensure SUPABASE_SERVICE_ROLE_KEY is set and server restarted."
        : undefined
    return NextResponse.json(
      { error: error?.message || "Failed to update user profile", code: error?.code, hint },
      { status: 500 }
    )
  }
}
