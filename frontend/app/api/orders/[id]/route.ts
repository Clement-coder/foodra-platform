import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { data: o, error } = await supabase
    .from("orders")
    .select(`*, order_items(*), users!orders_buyer_id_fkey(id, name, email, phone, avatar_url, wallet_address)`)
    .eq("id", id)
    .single();

  if (error || !o) return NextResponse.json({ error: "Order not found" }, { status: 404 });

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
    })) ?? [],
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
    deliveryCity: o.delivery_city || null,
    deliveryState: o.delivery_state || null,
  });
}
