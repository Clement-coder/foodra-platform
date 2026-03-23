import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get("farmerId");
  if (!farmerId) return NextResponse.json({ error: "farmerId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("order_items")
    .select(`
      *,
      orders!inner(
        id, status, escrow_status, escrow_tx_hash, usdc_amount, total_amount, created_at,
        delivery_full_name, delivery_phone, delivery_address, delivery_street2,
        delivery_landmark, delivery_city, delivery_state, delivery_country,
        users!orders_buyer_id_fkey(
          id, name, email, phone, avatar_url, location,
          delivery_addresses(full_name, phone, address_line, street_line2, landmark, city, state, country, is_default, created_at)
        )
      ),
      products!inner(farmer_id)
    `)
    .eq("products.farmer_id", farmerId)
    .order("orders(created_at)", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ordersMap = new Map<string, any>();
  for (const item of data ?? []) {
    const o = item.orders;
    if (!ordersMap.has(o.id)) {
      const u = o.users;

      // Use order snapshot first, fall back to buyer's default delivery address
      const savedAddrs: any[] = u?.delivery_addresses ?? [];
      const defaultAddr = savedAddrs.find((a: any) => a.is_default) ?? savedAddrs[0] ?? null;

      const delivery = {
        fullName: o.delivery_full_name || defaultAddr?.full_name || null,
        phone: o.delivery_phone || defaultAddr?.phone || null,
        address: o.delivery_address || defaultAddr?.address_line || null,
        street2: o.delivery_street2 || defaultAddr?.street_line2 || null,
        landmark: o.delivery_landmark || defaultAddr?.landmark || null,
        city: o.delivery_city || defaultAddr?.city || null,
        state: o.delivery_state || defaultAddr?.state || null,
        country: o.delivery_country || defaultAddr?.country || u?.location || null,
      };

      ordersMap.set(o.id, {
        id: o.id,
        status: o.status,
        escrowStatus: o.escrow_status || "none",
        escrowTxHash: o.escrow_tx_hash || null,
        usdcAmount: o.usdc_amount || null,
        totalAmount: o.total_amount,
        createdAt: o.created_at,
        buyer: u ? {
          id: u.id,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          avatar: u.avatar_url || "",
          location: u.location || "",
        } : null,
        delivery,
        items: [],
      });
    }
    ordersMap.get(o.id).items.push({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      pricePerUnit: item.price,
      image: item.image_url || "",
      escrowStatus: item.escrow_status || "none",
      escrowOrderId: item.escrow_order_id || null,
    });
  }

  return NextResponse.json(Array.from(ordersMap.values()));
}
