import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json();
  const { reason, details, userId } = body;

  if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });

  let buyerId = userId;
  if (!buyerId) {
    const { data: order } = await supabase.from("orders").select("buyer_id").eq("id", id).single();
    buyerId = order?.buyer_id;
  }
  if (!buyerId) return NextResponse.json({ error: "Could not resolve user" }, { status: 400 });

  const { error } = await supabase.from("order_disputes").insert({
    order_id: id,
    user_id: buyerId,
    reason,
    details: details || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createNotification({
    userId: buyerId,
    type: "order",
    title: "Dispute Submitted",
    message: `Your dispute for order #${id.slice(-6).toUpperCase()} has been received. We'll review it within 3–5 business days.`,
    link: `/orders/${id}`,
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json();
  const { disputeId, status, actorPrivyId } = body;

  // Verify admin
  const { data: actor } = await supabase.from("users").select("role").eq("privy_id", actorPrivyId).single();
  if (!actor || actor.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("order_disputes").update({ status }).eq("id", disputeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify the buyer that their dispute has been resolved
  const { data: dispute } = await supabase.from("order_disputes").select("user_id, order_id").eq("id", disputeId).single();
  if (dispute?.user_id) {
    await createNotification({
      userId: dispute.user_id,
      type: "order",
      title: "Dispute Resolved",
      message: "Your dispute has been reviewed and resolved by our team. Check your order for the updated payment status.",
      link: `/orders/${dispute.order_id}`,
    });
  }

  return NextResponse.json({ success: true });
}
