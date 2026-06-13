import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

// GET /api/products/[id]/stats — get product purchase statistics
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabaseAdmin = getSupabaseAdminClient()
  if (!supabaseAdmin) return NextResponse.json({ error: "Server error" }, { status: 500 })

  try {
    // Get product details
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("farmer_id")
      .eq("id", id)
      .single()

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Get purchase statistics for this product
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select(`
        quantity,
        orders!inner(buyer_id, status, escrow_status)
      `)
      .eq("product_id", id)
      .in("orders.status", ["Delivered", "Shipped"])
      .neq("orders.escrow_status", "refunded")

    // Calculate stats
    const totalSold = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const uniqueBuyers = new Set(orderItems?.map((item: any) => item.orders.buyer_id) || []).size

    // Get farmer's total product count
    const { count: farmerProductCount } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("farmer_id", product.farmer_id)
      .eq("is_available", true)

    return NextResponse.json({
      totalSold,
      uniqueBuyers,
      farmerProductCount: farmerProductCount || 0
    })
  } catch (error) {
    console.error("Error fetching product stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
