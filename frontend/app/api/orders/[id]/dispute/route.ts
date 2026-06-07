import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createNotification } from "@/lib/notify";
import { AuthError, requireAdminUser, requireAuthenticatedUser } from "@/lib/serverAuth";
import { sendDisputeSubmittedEmail, sendDisputeResolvedEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthenticatedUser(request);
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    const { reason, details } = await request.json();
    if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });

    // Allow buyer OR admin to raise a dispute
    const { data: order } = await supabase.from("orders").select("buyer_id").eq("id", id).single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (auth.user.role !== "admin" && order.buyer_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for existing open dispute to avoid duplicates
    const { data: existing } = await supabase
      .from("order_disputes")
      .select("id")
      .eq("order_id", id)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "An open dispute already exists for this order." }, { status: 409 });
    }

    const { error } = await supabase.from("order_disputes").insert({
      order_id: id,
      user_id: order.buyer_id,
      reason,
      details: details || null,
      status: "open",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark order escrow as disputed
    await supabase.from("orders").update({ escrow_status: "disputed" }).eq("id", id);

    await createNotification({
      userId: order.buyer_id,
      type: "order",
      title: "Dispute Submitted",
      message: `Your dispute for order #${id.slice(-6).toUpperCase()} has been received. We'll review it within 3–5 business days.`,
      link: `/orders/${id}`,
    });

    // Also notify all admin users
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin");
    for (const admin of admins ?? []) {
      await createNotification({
        userId: admin.id,
        type: "order",
        title: "New Dispute",
        message: `A dispute was raised for order #${id.slice(-6).toUpperCase()}.`,
        link: `/admin`,
      });
    }

    // Email buyer
    const { data: buyer } = await supabase.from("users").select("email, name").eq("id", order.buyer_id).single();
    if (buyer?.email) {
      sendDisputeSubmittedEmail(buyer.email, buyer.name || "Customer", id, reason, order.buyer_id).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Failed to submit dispute" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    await requireAdminUser(request);
    const { disputeId, status, escrowResolution } = await request.json();

    if (!disputeId || !status) {
      return NextResponse.json({ error: "disputeId and status required" }, { status: 400 });
    }

    // Update dispute status
    const { error } = await supabase.from("order_disputes").update({ status, resolved_at: new Date().toISOString() }).eq("id", disputeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch dispute to get buyer
    const { data: dispute } = await supabase
      .from("order_disputes")
      .select("user_id, order_id")
      .eq("id", disputeId)
      .single();

    if (dispute?.order_id) {
      // Update order escrow status based on resolution
      if (escrowResolution === "released" || escrowResolution === "refunded") {
        await supabase.from("orders").update({ escrow_status: escrowResolution }).eq("id", dispute.order_id);
      }
    }

    if (dispute?.user_id) {
      const resolutionMsg = escrowResolution === "released"
        ? "The escrow payment has been released to the farmer."
        : escrowResolution === "refunded"
        ? "The escrow payment has been refunded to your wallet."
        : "Your dispute has been reviewed and resolved by our team.";

      await createNotification({
        userId: dispute.user_id,
        type: "order",
        title: "Dispute Resolved",
        message: resolutionMsg,
        link: `/orders/${dispute.order_id}`,
      });

      const { data: buyer } = await supabase.from("users").select("email, name").eq("id", dispute.user_id).single();
      if (buyer?.email) {
        sendDisputeResolvedEmail(buyer.email, buyer.name || "Customer", dispute.order_id, dispute.user_id).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
