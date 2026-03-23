import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

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
    console.error("Error updating escrow:", error);
    return NextResponse.json({ error: error?.message || "Failed to update escrow" }, { status: 500 });
  }
}
