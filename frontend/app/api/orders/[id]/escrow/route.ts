import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
    const actor = await requireAuthenticatedUser(request);

    const { data: order } = await supabase
      .from("orders")
      .select("id, buyer_id")
      .eq("id", id)
      .single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (actor.user.role !== "admin" && order.buyer_id !== actor.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { escrowTxHash, escrowStatus, usdcAmount, items, deliveryFullName, deliveryPhone, deliveryAddress, deliveryStreet2, deliveryLandmark, deliveryCity, deliveryState, deliveryCountry } = body;

    const orderUpdate: Record<string, unknown> = {};
    if (escrowTxHash) orderUpdate.escrow_tx_hash = escrowTxHash;
    if (escrowStatus) orderUpdate.escrow_status = escrowStatus;
    if (usdcAmount !== undefined) orderUpdate.usdc_amount = usdcAmount;
    if (deliveryFullName) orderUpdate.delivery_full_name = deliveryFullName;
    if (deliveryPhone) orderUpdate.delivery_phone = deliveryPhone;
    if (deliveryAddress) orderUpdate.delivery_address = deliveryAddress;
    if (deliveryStreet2) orderUpdate.delivery_street2 = deliveryStreet2;
    if (deliveryLandmark) orderUpdate.delivery_landmark = deliveryLandmark;
    if (deliveryCity) orderUpdate.delivery_city = deliveryCity;
    if (deliveryState) orderUpdate.delivery_state = deliveryState;
    if (deliveryCountry) orderUpdate.delivery_country = deliveryCountry;

    if (Object.keys(orderUpdate).length > 0) {
      const { error } = await supabase
        .from("orders")
        .update(orderUpdate)
        .eq("id", id);
      if (error) throw error;
    }

    // Notify farmer when escrow is locked (payment secured)
    if (escrowStatus === "locked") {
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_amount, order_items(products!inner(farmer_id))")
        .eq("id", id)
        .single();
      if (orderData) {
        const farmerIds = [...new Set(
          (orderData.order_items as any[]).map((i: any) => i.products?.farmer_id).filter(Boolean)
        )];
        for (const farmerId of farmerIds) {
          await createNotification({
            userId: farmerId as string,
            type: "order",
            title: "Payment Secured in Escrow 🔒",
            message: `A buyer has paid ₦${Number(orderData.total_amount).toLocaleString()} for your product. Funds are held in escrow until delivery is confirmed.`,
            link: "/sales",
          });
        }
      }
    }

    // Update per-item escrow order IDs
    if (items?.length) {
      for (const item of items) {
        await supabase
          .from("order_items")
          .update({ escrow_order_id: item.escrowOrderId, escrow_status: escrowStatus || "locked" })
          .eq("order_id", id)
          .eq("product_id", item.productId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error updating escrow:", error);
    return NextResponse.json({ error: error?.message || "Failed to update escrow" }, { status: 500 });
  }
}
