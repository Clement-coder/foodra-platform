"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, PackageOpen, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { DisputeModal } from "@/components/DisputeModal";
import withAuth from "../../components/withAuth";
import { useOrders } from "@/lib/useCart";
import { useEscrow } from "@/lib/useEscrow";
import { useUser } from "@/lib/useUser";
import { RatingModal } from "@/components/RatingModal";
import { authFetch } from "@/lib/authFetch";
import { OrderCard, ORDER_STATUS } from "@/components/OrderCard";
import { OrdersPageSkeleton } from "@/components/Skeleton";
import type { Order } from "@/lib/types";

const TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type Tab = typeof TABS[number];

function OrdersPage() {
  const { orders, refreshOrders, loading: ordersLoading } = useOrders();
  const { confirmDelivery, raiseDispute, loading } = useEscrow();
  const { currentUser } = useUser();
  const { getAccessToken } = usePrivy();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ orderId: string; farmerId: string; farmerName: string } | null>(null);

  // Poll for status updates every 30 s so UI reflects cron-driven changes
  useEffect(() => {
    const interval = setInterval(refreshOrders, 30_000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  const tabCount = (tab: Tab) => tab === "All" ? orders.length : orders.filter(o => o.status === tab).length;
  const visible = activeTab === "All" ? orders : orders.filter(o => o.status === activeTab);

  const handleDelete = async (orderId: string) => {
    if (!currentUser) return;
    const ok = await confirm({ title: "Delete Order", message: "Remove this order permanently?", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await authFetch(getAccessToken, `/api/orders?orderId=${orderId}&userId=${currentUser.id}`, { method: "DELETE" });
    toast.success("Order removed.");
    refreshOrders();
  };

  const handleConfirmDelivery = async (orderId: string, escrowOrderId: string) => {
    const ok = await confirm({ title: "Confirm Delivery", message: "Confirm you received this order? This releases payment to the farmer.", confirmLabel: "Confirm Delivery" });
    if (!ok) return;
    setActiveOrderId(orderId);
    const success = await confirmDelivery(escrowOrderId);
    if (success) {
      // Update escrow_status + order status to Delivered in one call
      await authFetch(getAccessToken, `/api/orders/${orderId}/escrow`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowStatus: "released" }),
      });
      await authFetch(getAccessToken, `/api/orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Delivered" }),
      });
      toast.success("Delivery confirmed! Payment released to farmer.");
      refreshOrders();
      const order = orders.find(o => o.id === orderId);
      const farmer = order?.farmers?.[0];
      if (farmer) setRatingTarget({ orderId, farmerId: farmer.id, farmerName: farmer.name });
    } else {
      toast.error("Failed to confirm delivery. Please try again.");
    }
    setActiveOrderId(null);
  };

  const handleConfirmDeliverySimple = async (orderId: string) => {
    const ok = await confirm({ title: "Confirm Delivery", message: "Confirm you received this order?", confirmLabel: "Confirm Delivery" });
    if (!ok) return;
    setActiveOrderId(orderId);
    const res = await authFetch(getAccessToken, `/api/orders/${orderId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Delivered" }),
    });
    if (res.ok) {
      toast.success("Delivery confirmed!");
      refreshOrders();
      const order = orders.find(o => o.id === orderId);
      const farmer = order?.farmers?.[0];
      if (farmer) setRatingTarget({ orderId, farmerId: farmer.id, farmerName: farmer.name });
    } else {
      toast.error("Failed to confirm delivery. Please try again.");
    }
    setActiveOrderId(null);
  };

  const handleRaiseDispute = async (reason: string, details: string) => {
    if (!disputeOrder) return;
    const escrowOrderId = disputeOrder.items?.find(i => i.escrowOrderId)?.escrowOrderId;
    setActiveOrderId(disputeOrder.id);
    const ok = await raiseDispute(escrowOrderId!);
    if (ok) {
      await authFetch(getAccessToken, `/api/orders/${disputeOrder.id}/escrow`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escrowStatus: "disputed" }) });
      await authFetch(getAccessToken, `/api/orders/${disputeOrder.id}/dispute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) }).catch(() => {});
      toast.success("Dispute raised. Our team will review within 3–5 business days.");
      refreshOrders();
    } else {
      toast.error("Failed to raise dispute. Please try again.");
    }
    setActiveOrderId(null);
    setDisputeOrder(null);
  };

  if (ordersLoading) return <OrdersPageSkeleton />;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-[#118C4C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">My Orders</h1>
            <p className="text-xs text-muted-foreground">{orders.length} total order{orders.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {TABS.map((tab) => {
          const count = tabCount(tab);
          const active = activeTab === tab;
          const s = tab !== "All" ? ORDER_STATUS[tab] : null;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0
                ${active ? "bg-[#118C4C] text-white border-[#118C4C] shadow-sm" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"}`}
            >
              {s && <span className={active ? "text-white/80" : s.text}>{s.icon}</span>}
              {tab}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#118C4C]/10 mb-4 border border-[#118C4C]/20">
            <PackageOpen className="h-10 w-10 text-[#118C4C]" />
          </div>
          <h2 className="text-lg font-semibold mb-2">{activeTab === "All" ? "No Orders Yet" : `No ${activeTab} Orders`}</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-5">
            {activeTab === "All" ? "Head to the marketplace to find fresh products from local farmers." : `You have no orders with "${activeTab}" status.`}
          </p>
          {activeTab === "All" && (
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => router.push("/marketplace")}>
              Browse Marketplace
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {visible.map((order: Order, index: number) => (
              <motion.div key={order.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22, delay: index * 0.04 }}>
                <OrderCard
                  order={order}
                  isProcessing={activeOrderId === order.id && loading}
                  onConfirmDelivery={handleConfirmDelivery}
                  onConfirmDeliverySimple={handleConfirmDeliverySimple}
                  onRaiseDispute={(o) => setDisputeOrder(o)}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {disputeOrder && (
        <DisputeModal
          isOpen={!!disputeOrder}
          onClose={() => setDisputeOrder(null)}
          orderId={disputeOrder.id}
          loading={activeOrderId === disputeOrder.id && loading}
          onConfirm={handleRaiseDispute}
        />
      )}
      {ratingTarget && currentUser && (
        <RatingModal
          isOpen={!!ratingTarget} onClose={() => setRatingTarget(null)}
          orderId={ratingTarget.orderId} farmerId={ratingTarget.farmerId} farmerName={ratingTarget.farmerName}
        />
      )}
    </div>
  );
}

export default withAuth(OrdersPage);
