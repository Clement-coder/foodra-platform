import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth";

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
        users!orders_buyer_id_fkey(id, name, email, phone, avatar_url, wallet_address),
        order_items(*, products(farmer_id, users!products_farmer_id_fkey(id, name, email, phone, avatar_url, location)))
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
        escrowOrderId: item.escrow_order_id || null,
        farmerWallet: item.farmer_wallet || null,
        escrowStatus: item.escrow_status || "none",
        farmerId: item.products?.farmer_id || null,
      })) ?? [],
      farmers: Array.from(farmersMap.values()),
      totalAmount: o.total_amount,
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      escrowTxHash: o.escrow_tx_hash || null,
      escrowStatus: o.escrow_status || "none",
      usdcAmount: o.usdc_amount || null,
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
      if (status !== "Shipped") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      const { data: items } = await supabase
        .from("order_items")
        .select("products!inner(farmer_id)")
        .eq("order_id", id)
      const isFarmerOnOrder = (items ?? []).some((i: any) => i.products?.farmer_id === auth.user.id)
      if (!isFarmerOnOrder) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
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
        }
      }
    }

  // Notify on escrow resolution
    if (body.escrow_status) {
      if (auth.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      const { data: order } = await supabase.from("orders").select("buyer_id").eq("id", id).single()
      if (order?.buyer_id) {
        const msg = body.escrow_status === "released"
          ? "Payment has been released to the farmer."
          : "Payment has been refunded to your wallet."
        await createNotification({
          userId: order.buyer_id,
          type: "order",
          title: body.escrow_status === "released" ? "Payment Released" : "Payment Refunded",
          message: msg,
          link: `/orders/${id}`,
        })
      }
      const { error: escrowErr } = await supabase.from("orders").update({ escrow_status: body.escrow_status }).eq("id", id)
      if (escrowErr) return NextResponse.json({ error: escrowErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
