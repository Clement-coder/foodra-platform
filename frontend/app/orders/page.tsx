"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import {
  ArrowLeft, PackageOpen, Calendar, CheckCircle, AlertTriangle, Trash2,
  MapPin, Phone, ExternalLink, Clock, Truck, Package, XCircle, RotateCcw,
  ShieldCheck, ShieldAlert, ShieldOff, Banknote,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import { useToast } from "@/lib/toast";
import { DisputeModal } from "@/components/DisputeModal";
import withAuth from "../../components/withAuth";
import { useOrders } from "@/lib/useCart";
import { useEscrow } from "@/lib/useEscrow";
import { useUser } from "@/lib/useUser";
import { RatingModal } from "@/components/RatingModal";
import { authFetch } from "@/lib/authFetch";

// Status meta for colors + icons
const STATUS_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  Pending:    { label: "Pending",    icon: <Clock className="h-3.5 w-3.5" />,    bg: "bg-amber-50 dark:bg-amber-950/30",    text: "text-amber-700 dark:text-amber-400",   border: "border-amber-300 dark:border-amber-700" },
  Processing: { label: "Processing", icon: <RotateCcw className="h-3.5 w-3.5" />, bg: "bg-blue-50 dark:bg-blue-950/30",     text: "text-blue-700 dark:text-blue-400",     border: "border-blue-300 dark:border-blue-700" },
  Shipped:    { label: "Shipped",    icon: <Truck className="h-3.5 w-3.5" />,    bg: "bg-purple-50 dark:bg-purple-950/30",  text: "text-purple-700 dark:text-purple-400", border: "border-purple-300 dark:border-purple-700" },
  Delivered:  { label: "Delivered",  icon: <Package className="h-3.5 w-3.5" />,  bg: "bg-green-50 dark:bg-green-950/30",   text: "text-green-700 dark:text-green-400",   border: "border-green-300 dark:border-green-700" },
  Cancelled:  { label: "Cancelled",  icon: <XCircle className="h-3.5 w-3.5" />,  bg: "bg-red-50 dark:bg-red-950/30",       text: "text-red-700 dark:text-red-400",       border: "border-red-300 dark:border-red-700" },
}

const ESCROW_META: Record<string, { icon: React.ReactNode; label: string; text: string }> = {
  locked:   { icon: <ShieldCheck className="h-3.5 w-3.5" />,  label: "Escrow Locked",   text: "text-blue-600" },
  released: { icon: <Banknote className="h-3.5 w-3.5" />,     label: "Payment Released", text: "text-green-600" },
  disputed: { icon: <ShieldAlert className="h-3.5 w-3.5" />,  label: "In Dispute",       text: "text-red-600" },
  refunded: { icon: <ShieldOff className="h-3.5 w-3.5" />,    label: "Refunded",         text: "text-gray-600" },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, icon: <Clock className="h-3.5 w-3.5" />, bg: "bg-muted", text: "text-muted-foreground", border: "border-border" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}>
      {meta.icon} {meta.label}
    </span>
  )
}

function OrdersPage() {
  const { orders, refreshOrders } = useOrders();
  const { confirmDelivery, raiseDispute, loading } = useEscrow();
  const { currentUser } = useUser();
  const { getAccessToken } = usePrivy();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<{ orderId: string; escrowOrderId: string } | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ orderId: string; farmerId: string; farmerName: string } | null>(null);

  const handleDeleteOrder = async (orderId: string) => {
    if (!currentUser) return;
    const ok = await confirm({ title: "Delete Order", message: "Remove this order permanently?", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await authFetch(getAccessToken, `/api/orders?orderId=${orderId}&userId=${currentUser.id}`, { method: "DELETE" });
    toast.success("Order removed.");
    refreshOrders();
  };

  const handleConfirmDelivery = async (orderId: string, escrowOrderId: string) => {
    const ok = await confirm({ title: "Confirm Delivery", message: "Confirm you received this order? This will release payment to the farmer.", confirmLabel: "Confirm Delivery" });
    if (!ok) return;
    setActiveOrderId(orderId);
    const success = await confirmDelivery(escrowOrderId);
    if (success) {
      await authFetch(getAccessToken, `/api/orders/${orderId}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowStatus: "released" }),
      });
      toast.success("Delivery confirmed! Payment released to farmer.");
      refreshOrders();
      const order = orders.find(o => o.id === orderId)
      const farmer = order?.farmers?.[0]
      if (farmer) setRatingTarget({ orderId, farmerId: farmer.id, farmerName: farmer.name })
    } else {
      toast.error("Failed to confirm delivery. Please try again.");
    }
    setActiveOrderId(null);
  };

  const handleRaiseDispute = async (orderId: string, escrowOrderId: string, reason: string, details: string) => {
    setActiveOrderId(orderId);
    const ok = await raiseDispute(escrowOrderId);
    if (ok) {
      await authFetch(getAccessToken, `/api/orders/${orderId}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowStatus: "disputed" }),
      });
      await authFetch(getAccessToken, `/api/orders/${orderId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      }).catch(() => {});
      toast.success("Dispute raised. Our team will review and resolve it within 3–5 business days.");
      refreshOrders();
    } else {
      toast.error("Failed to raise dispute. Please try again.");
    }
    setActiveOrderId(null);
    setDisputeOrder(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <div className="h-2 w-10 bg-[#118C4C] rounded" />
          My Orders
          <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{orders.length}</span>
        </h1>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#118C4C]/10 mb-6 border-2 border-[#118C4C]/20">
            <PackageOpen className="h-12 w-12 text-[#118C4C]" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">No Orders Yet</h2>
          <p className="text-muted-foreground text-base max-w-sm mx-auto mb-6">
            You haven't placed any orders. Head to the marketplace to find fresh products.
          </p>
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => router.push("/marketplace")}>
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const escrowOrderId = (order.items || []).find((i) => i.escrowOrderId)?.escrowOrderId;
            const escrowStatus = order.escrowStatus;
            const isActive = activeOrderId === order.id;
            const canAct = (escrowStatus === "locked" || (!!order.escrowTxHash && escrowStatus === "none")) && !!escrowOrderId;
            const escrowMeta = escrowStatus ? ESCROW_META[escrowStatus] : undefined;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <Card
                  className="overflow-hidden border border-[#118C4C]/20 hover:border-[#118C4C]/40 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#118C4C]/8 to-transparent border-b border-[#118C4C]/15">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm tracking-wide">#{order.id.slice(-6).toUpperCase()}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <StatusBadge status={order.status} />
                      {escrowMeta && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${escrowMeta.text}`}>
                          {escrowMeta.icon} {escrowMeta.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Date + amount row */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-[#118C4C] text-lg">₦{Number(order.totalAmount).toLocaleString()}</span>
                        {order.usdcAmount ? (
                          <span className="text-xs text-muted-foreground ml-1.5">({Number(order.usdcAmount).toFixed(4)} USDC)</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {(order.items || []).map((item) => (
                        <div key={item.productId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-[#118C4C]/10">
                          {item.image ? (
                            <Image src={item.image} alt={item.productName} width={52} height={52} className="rounded-lg object-cover flex-shrink-0 border border-[#118C4C]/20" unoptimized />
                          ) : (
                            <div className="w-[52px] h-[52px] rounded-lg bg-muted flex-shrink-0 border border-[#118C4C]/20 flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × ₦{Number(item.pricePerUnit).toLocaleString()}</p>
                          </div>
                          <p className="font-bold text-sm text-[#118C4C] flex-shrink-0">
                            ₦{(item.quantity * item.pricePerUnit).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Delivery info */}
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 text-xs" onClick={(e) => e.stopPropagation()}>
                        <MapPin className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">{order.deliveryFullName}</span>
                          {" · "}{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}{order.deliveryState ? `, ${order.deliveryState}` : ""}
                          {order.deliveryPhone && (
                            <span className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" /> {order.deliveryPhone}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Tx hash */}
                    {order.escrowTxHash && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <ShieldCheck className="h-3.5 w-3.5 text-[#118C4C]" />
                        <a
                          href={`https://${process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? "" : "sepolia."}basescan.org/tx/${order.escrowTxHash}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[#118C4C] underline underline-offset-2 hover:text-[#0d6d3a]"
                        >
                          {order.escrowTxHash.slice(0, 12)}...{order.escrowTxHash.slice(-8)}
                        </a>
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {escrowStatus === "none" && (
                        <Button onClick={() => handleDeleteOrder(order.id)} variant="outline" size="sm"
                          className="text-red-600 border-red-400/40 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 text-xs">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                      {canAct && (
                        <>
                          <Button
                            onClick={() => handleConfirmDelivery(order.id, escrowOrderId!)}
                            disabled={isActive && loading}
                            className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5 text-sm h-9"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {isActive && loading ? "Processing..." : "Confirm Delivery"}
                          </Button>
                          <Button
                            onClick={() => setDisputeOrder({ orderId: order.id, escrowOrderId: escrowOrderId! })}
                            disabled={isActive && loading}
                            variant="outline"
                            className="flex-1 border-red-400/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 text-sm h-9"
                          >
                            <AlertTriangle className="h-4 w-4" /> Raise Dispute
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {disputeOrder && (
        <DisputeModal
          isOpen={!!disputeOrder}
          onClose={() => setDisputeOrder(null)}
          orderId={disputeOrder.orderId}
          loading={activeOrderId === disputeOrder.orderId && loading}
          onConfirm={(reason, details) =>
            handleRaiseDispute(disputeOrder.orderId, disputeOrder.escrowOrderId, reason, details)
          }
        />
      )}
      {ratingTarget && currentUser && (
        <RatingModal
          isOpen={!!ratingTarget}
          onClose={() => setRatingTarget(null)}
          orderId={ratingTarget.orderId}
          farmerId={ratingTarget.farmerId}
          farmerName={ratingTarget.farmerName}
        />
      )}
    </div>
  );
}

export default withAuth(OrdersPage);
