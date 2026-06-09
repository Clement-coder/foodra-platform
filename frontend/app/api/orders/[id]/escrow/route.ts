import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";
import { AuthError, requireAuthenticatedUser } from "@/lib/serverAuth";
import { sendEscrowStatusEmail, sendEscrowLockedBuyerEmail, sendDeliveryConfirmedBuyerEmail, sendWalletDeductionEmail } from "@/lib/email";

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
        .select("total_amount, usdc_amount, escrow_tx_hash, order_items(products!inner(farmer_id))")
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
          const { data: farmer } = await supabase.from("users").select("email, name").eq("id", farmerId).single();
          if (farmer?.email) {
            sendEscrowStatusEmail(farmer.email, farmer.name || "Farmer", id, "locked", Number(orderData.total_amount), farmerId as string).catch(() => {});
          }
        }
        // Notify + email buyer that payment is locked
        await createNotification({
          userId: order.buyer_id,
          type: "order",
          title: "Payment Locked in Escrow 🔒",
          message: `₦${Number(orderData.total_amount).toLocaleString()} is secured in escrow for order #${id.slice(-6).toUpperCase()}. Funds release when you confirm delivery.`,
          link: `/orders/${id}`,
        });
        const txH = escrowTxHash || orderData.escrow_tx_hash;
        const { data: buyer } = await supabase.from("users").select("email, name").eq("id", order.buyer_id).single();
        if (buyer?.email) {
          sendEscrowLockedBuyerEmail(buyer.email, buyer.name || "Customer", id, Number(orderData.total_amount), Number(usdcAmount || orderData.usdc_amount || 0), txH || null, order.buyer_id).catch(() => {});
          if (usdcAmount || orderData.usdc_amount) {
            const usdc = Number(usdcAmount || orderData.usdc_amount);
            sendWalletDeductionEmail(buyer.email, buyer.name || "Customer", id, usdc, Number(orderData.total_amount), txH || null, order.buyer_id).catch(() => {});
          }
        }
      }
    }

    // Notify farmer when buyer confirms delivery (funds released to farmer)
    if (escrowStatus === "released") {
      const { data: orderData } = await supabase
        .from("orders")
        .select("total_amount, usdc_amount, order_items(products!inner(farmer_id))")
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
            title: "Payment Released to You 💸",
            message: `The buyer confirmed delivery. ₦${Number(orderData.total_amount).toLocaleString()}${orderData.usdc_amount ? ` (${Number(orderData.usdc_amount).toFixed(2)} USDC)` : ""} has been released from escrow to your wallet.`,
            link: "/sales",
          });
          const { data: farmer } = await supabase.from("users").select("email, name").eq("id", farmerId).single();
          if (farmer?.email) {
            sendEscrowStatusEmail(farmer.email, farmer.name || "Farmer", id, "released", Number(orderData.total_amount), farmerId as string).catch(() => {});
          }
        }
        // Notify + email buyer that delivery is confirmed
        await createNotification({
          userId: order.buyer_id,
          type: "order",
          title: "Delivery Confirmed ✅",
          message: `You confirmed delivery for order #${id.slice(-6).toUpperCase()}. Payment has been released to the farmer. Thank you!`,
          link: `/orders/${id}`,
        });
        const { data: buyer } = await supabase.from("users").select("email, name").eq("id", order.buyer_id).single();
        if (buyer?.email) {
          sendDeliveryConfirmedBuyerEmail(buyer.email, buyer.name || "Customer", id, Number(orderData.total_amount), order.buyer_id).catch(() => {});
        }
      }
    }

    // Update per-item escrow order IDs and farmer wallet
    if (items?.length) {
      for (const item of items) {
        const updatePayload: Record<string, any> = {
          escrow_order_id: item.escrowOrderId,
          escrow_status: escrowStatus || "locked",
        }
        if (item.farmerWallet) updatePayload.farmer_wallet = item.farmerWallet
        await supabase
          .from("order_items")
          .update(updatePayload)
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
