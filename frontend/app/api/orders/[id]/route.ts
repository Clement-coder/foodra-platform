import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth";
import { sendOrderStatusEmail } from "@/lib/email";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    const { data: o, error } = await supabase
      .from("orders")
      .select(`
        *, 
        users!orders_buyer_id_fkey(id, name, email, phone, avatar_url),
        order_items(*, products(users!products_farmer_id_fkey(id, name, email, phone, avatar_url, location)))
      `)
      .eq("id", id)
      .single();

    if (error || !o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const farmerIds = new Set((o.order_items ?? []).map((item: any) => item.products?.farmer_id).filter(Boolean));
    const canView = auth.user.role === "admin" || o.buyer_id === auth.user.id || farmerIds.has(auth.user.id);
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const farmersMap = new Map<string, any>();
    for (const item of o.order_items ?? []) {
      const farmer = item.products?.users;
      const farmerId = item.products?.farmer_id;
      if (farmer && farmerId && !farmersMap.has(farmerId)) {
        farmersMap.set(farmerId, {
          id: farmer.id,
          name: farmer.name || "",
          email: farmer.email || "",
          phone: farmer.phone || "",
          avatar: farmer.avatar_url || "",
          location: farmer.location || "",
        });
      }
    }

    return NextResponse.json({
      id: o.id,
      userId: o.buyer_id,
      items: o.order_items?.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        pricePerUnit: item.price,
        quantity: item.quantity,
        image: item.image_url || "",
        farmerId: item.products?.farmer_id || null,
      })) ?? [],
      farmers: Array.from(farmersMap.values()),
      totalAmount: o.total_amount,
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      escrowTxHash: null,
      escrowStatus: "none",
      usdcAmount: null,
      buyerName: o.users?.name || null,
      buyerPhone: o.users?.phone || null,
      buyerEmail: o.users?.email || null,
      deliveryFullName: o.delivery_full_name || null,
      deliveryPhone: o.delivery_phone || null,
      deliveryAddress: o.delivery_address || null,
      deliveryStreet2: o.delivery_street2 || null,
      deliveryLandmark: o.delivery_landmark || null,
      deliveryCity: o.delivery_city || null,
      deliveryState: o.delivery_state || null,
      deliveryCountry: o.delivery_country || null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { id } = await params
    const supabase = getSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 })

    const body = await request.json()
    const { actorPrivyId, status } = body
    void actorPrivyId

    if (auth.user.role !== "admin") {
      if (status === "Delivered") {
        // Only the buyer can confirm delivery
        const { data: order } = await supabase.from("orders").select("buyer_id").eq("id", id).single()
        if (order?.buyer_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      } else if (status === "Shipped") {
        const { data: items } = await supabase
          .from("order_items")
          .select("products!inner(farmer_id)")
          .eq("order_id", id)
        const isFarmerOnOrder = (items ?? []).some((i: any) => i.products?.farmer_id === auth.user.id)
        if (!isFarmerOnOrder) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const STATUS_ORDER = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]

    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      // Never move status backward (except admin can do anything)
      .in("status", auth.user.role === "admin"
        ? STATUS_ORDER
        : STATUS_ORDER.slice(0, STATUS_ORDER.indexOf(status))
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify buyer of status change
    if (status) {
      const { data: order } = await supabase.from("orders").select("buyer_id").eq("id", id).single()
      if (order?.buyer_id) {
        const statusMessages: Record<string, string> = {
          Processing: "Your order is being processed.",
          Shipped: "Your order has been shipped and is on its way!",
          Delivered: "Your order has been delivered. Enjoy!",
          Cancelled: "Your order has been cancelled.",
        }
        if (statusMessages[status]) {
          await createNotification({
            userId: order.buyer_id,
            type: "order",
            title: `Order ${status}`,
            message: statusMessages[status],
            link: `/orders/${id}`,
          })
          // Email buyer
          const { data: buyer } = await supabase.from("users").select("email, name").eq("id", order.buyer_id).single()
          if (buyer?.email) sendOrderStatusEmail(buyer.email, buyer.name || "Customer", id, status, order.buyer_id).catch(() => {})
        }
      }
    }

  // Notify on escrow resolution — removed (no blockchain)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
