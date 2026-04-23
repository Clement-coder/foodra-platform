import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";
import { AuthError, requireAdminUser, requireAuthenticatedUser } from "@/lib/serverAuth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthenticatedUser(request)
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    const body = await request.json();
    const { reason, details } = body;

    if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });

    const { data: order } = await supabase.from("orders").select("buyer_id").eq("id", id).single();
    if (!order || order.buyer_id !== auth.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const buyerId = order.buyer_id;

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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to submit dispute" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    await requireAdminUser(request)
    const body = await request.json();
    const { disputeId, status } = body;

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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
