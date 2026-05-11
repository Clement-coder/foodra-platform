import { NextResponse } from "next/server"
import webpush from "web-push"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth"

function getWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req)
    const { subscription } = await req.json()
    if (!subscription) return NextResponse.json({ error: "Missing subscription" }, { status: 400 })

    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })

    await supabase.from("push_subscriptions").upsert(
      { user_id: auth.user.id, subscription: JSON.stringify(subscription), endpoint: subscription.endpoint },
      { onConflict: "endpoint" }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req)
    const { endpoint } = await req.json()
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 })
    
    await supabase.from("push_subscriptions").delete()
      .eq("endpoint", endpoint)
      .eq("user_id", auth.user.id) // Ensure users can only delete their own
      
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
