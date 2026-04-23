import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AuthError, requireAdminUser } from "@/lib/serverAuth"

// GET /api/admin/stats - admin dashboard stats
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient()
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

    await requireAdminUser(request)

    const [users, products, funding, orders, enrollments, supportMessages, trainings, walletRequests, disputes, verificationRequests] = await Promise.all([
      supabaseAdmin.from("users").select("id, name, email, phone, location, avatar_url, wallet_address, role, is_verified, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("products").select("id, name, category, price, quantity, unit, image_url, location, is_available, created_at, farmer_id").order("created_at", { ascending: false }),
      supabaseAdmin.from("funding_applications").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("orders").select("id, buyer_id, total_amount, status, escrow_status, escrow_tx_hash, delivery_full_name, delivery_address, delivery_city, delivery_state, delivery_phone, created_at, order_items(id, product_id, product_name, quantity, price, image_url)").order("created_at", { ascending: false }),
      supabaseAdmin.from("training_enrollments").select("id, training_id, user_id, full_name, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("support_messages").select("id, user_id, message, image_url, is_admin_reply, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("trainings").select("id, title, summary, date, mode, location, instructor_name, capacity, image_url, created_at").order("date", { ascending: true }),
      supabaseAdmin.from("wallet_funding_requests").select("*, users(id, name, email, wallet_address)").order("created_at", { ascending: false }),
      supabaseAdmin.from("order_disputes").select("id, order_id, user_id, reason, details, status, created_at, users(id, name, email)").order("created_at", { ascending: false }),
      supabaseAdmin.from("verification_requests").select("*, users(id, name, email, avatar_url, is_verified)").order("submitted_at", { ascending: false }),
    ])

    return NextResponse.json({
      users: users.data || [],
      products: products.data || [],
      funding: funding.data || [],
      orders: orders.data || [],
      enrollments: enrollments.data || [],
      supportMessages: supportMessages.data || [],
      trainings: trainings.data || [],
      walletRequests: walletRequests.data || [],
      disputes: disputes.data || [],
      verificationRequests: verificationRequests.data || [],
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 })
  }
}
