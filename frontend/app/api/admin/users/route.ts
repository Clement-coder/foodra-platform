import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"
import { sendRoleChangedEmail } from "@/lib/email"
import { createNotification } from "@/lib/notify"

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

    // Notify + email the user about their role change
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
    await createNotification({
      userId,
      type: "system",
      title: "Account Role Updated",
      message: `Your Foodra account role has been changed to ${roleLabel} by an admin.`,
      link: "/profile",
    })
    if (data?.email) {
      sendRoleChangedEmail(data.email, data.name || "User", role, userId).catch(() => {})
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
