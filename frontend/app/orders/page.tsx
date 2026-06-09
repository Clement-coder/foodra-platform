"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import {
  ArrowLeft, PackageOpen, Calendar, CheckCircle, AlertTriangle, Trash2,
  MapPin, Phone, ExternalLink, Clock, Truck, Package, XCircle, RotateCcw,
  ShieldCheck, ShieldAlert, ShieldOff, Banknote, ChevronRight, ShoppingBag,
  User, Hash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { DisputeModal } from "@/components/DisputeModal";
import withAuth from "../../components/withAuth";
import { useOrders } from "@/lib/useCart";
import { useEscrow } from "@/lib/useEscrow";
import { useUser } from "@/lib/useUser";
import { RatingModal } from "@/components/RatingModal";
import { authFetch } from "@/lib/authFetch";
import type { Order } from "@/lib/types";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
  Pending:    { icon: <Clock className="h-3.5 w-3.5" />,     bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-300",   border: "border-amber-300/70 dark:border-amber-700/50",   dot: "bg-amber-400" },
  Processing: { icon: <RotateCcw className="h-3.5 w-3.5" />, bg: "bg-sky-50 dark:bg-sky-950/40",       text: "text-sky-700 dark:text-sky-300",        border: "border-sky-300/70 dark:border-sky-700/50",       dot: "bg-sky-400" },
  Shipped:    { icon: <Truck className="h-3.5 w-3.5" />,     bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300",  border: "border-violet-300/70 dark:border-violet-700/50", dot: "bg-violet-400" },
  Delivered:  { icon: <Package className="h-3.5 w-3.5" />,   bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300/70 dark:border-emerald-700/50", dot: "bg-emerald-400" },
  Cancelled:  { icon: <XCircle className="h-3.5 w-3.5" />,   bg: "bg-red-50 dark:bg-red-950/40",       text: "text-red-600 dark:text-red-400",        border: "border-red-300/70 dark:border-red-700/50",       dot: "bg-red-400" },
}

const ESCROW: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  locked:   { icon: <ShieldCheck className="h-3.5 w-3.5" />,  label: "Escrow Locked",    bg: "bg-blue-50 dark:bg-blue-950/40",   text: "text-blue-600 dark:text-blue-400" },
  released: { icon: <Banknote className="h-3.5 w-3.5" />,     label: "Payment Released", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  disputed: { icon: <ShieldAlert className="h-3.5 w-3.5" />,  label: "In Dispute",       bg: "bg-red-50 dark:bg-red-950/40",     text: "text-red-600 dark:text-red-400" },
  refunded: { icon: <ShieldOff className="h-3.5 w-3.5" />,    label: "Refunded",         bg: "bg-gray-100 dark:bg-gray-800/40",  text: "text-gray-600 dark:text-gray-400" },
}

// Order journey steps — which step is "active" based on status
const JOURNEY = ["Pending", "Processing", "Shipped", "Delivered"] as const;

function JourneyBar({ status }: { status: string }) {
  const idx = JOURNEY.indexOf(status as any);
  if (idx === -1) return null; // cancelled — skip
  return (
    <div className="flex items-center gap-0 mt-1 mb-3">
      {JOURNEY.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        const s = STATUS[step];
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-0.5 ${active ? "scale-110" : ""} transition-transform`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? `${s.bg} ${s.border}` : "bg-muted border-border"}`}>
                <span className={done ? s.text : "text-muted-foreground"} style={{ transform: "scale(0.8)" }}>
                  {s.icon}
                </span>
              </div>
              <span className={`text-[9px] font-medium hidden sm:block ${done ? s.text : "text-muted-foreground"}`}>{step}</span>
            </div>
            {i < JOURNEY.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${i < idx ? "bg-[#118C4C]" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {status}
    </span>
  );
}

const TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const;
type Tab = typeof TABS[number];

function OrdersPage() {
  const { orders, refreshOrders } = useOrders();
  const { confirmDelivery, raiseDispute, loading } = useEscrow();
  const { currentUser } = useUser();
  const { getAccessToken } = usePrivy();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<{ orderId: string; escrowOrderId: string } | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ orderId: string; farmerId: string; farmerName: string } | null>(null);

  const tabCount = (tab: Tab) => tab === "All" ? orders.length : orders.filter(o => o.status === tab).length;
  const visible = activeTab === "All" ? orders : orders.filter(o => o.status === activeTab);

  const handleDeleteOrder = async (orderId: string) => {
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
      await authFetch(getAccessToken, `/api/orders/${orderId}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowStatus: "released" }),
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

  const handleRaiseDispute = async (orderId: string, escrowOrderId: string, reason: string, details: string) => {
    setActiveOrderId(orderId);
    const ok = await raiseDispute(escrowOrderId);
    if (ok) {
      await authFetch(getAccessToken, `/api/orders/${orderId}/escrow`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escrowStatus: "disputed" }) });
      await authFetch(getAccessToken, `/api/orders/${orderId}/dispute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) }).catch(() => {});
      toast.success("Dispute raised. Our team will review within 3–5 business days.");
      refreshOrders();
    } else {
      toast.error("Failed to raise dispute. Please try again.");
    }
    setActiveOrderId(null);
    setDisputeOrder(null);
  };

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
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5 border-[#118C4C]/30 hover:bg-[#118C4C]/5 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {TABS.map((tab) => {
          const count = tabCount(tab);
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border
                ${active
                  ? "bg-[#118C4C] text-white border-[#118C4C] shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
            >
              {tab !== "All" && STATUS[tab] && (
                <span className={active ? "text-white/80" : STATUS[tab].text}>
                  {STATUS[tab].icon}
                </span>
              )}
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

      {/* Orders list */}
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
            {visible.map((order: Order, index: number) => {
              const escrowOrderId = (order.items || []).find((i) => i.escrowOrderId)?.escrowOrderId;
              const escrowStatus = order.escrowStatus;
              const isActive = activeOrderId === order.id;
              const canAct = (escrowStatus === "locked" || (!!order.escrowTxHash && escrowStatus === "none")) && !!escrowOrderId;
              const escrowMeta = escrowStatus ? ESCROW[escrowStatus] : undefined;
              const isCancelled = order.status === "Cancelled";

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <Card className="overflow-hidden border border-border hover:border-[#118C4C]/40 hover:shadow-md transition-all group">
                    {/* ── Top bar ── */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-bold text-sm tracking-widest text-foreground">{order.id.slice(-6).toUpperCase()}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={order.status} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Journey progress bar — skip for Cancelled */}
                      {!isCancelled && <JourneyBar status={order.status} />}

                      {/* Date + Amount */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <div className="text-right">
                          <span className="font-black text-[#118C4C] text-base">₦{Number(order.totalAmount).toLocaleString()}</span>
                          {order.usdcAmount ? (
                            <span className="block text-[10px] text-muted-foreground">{Number(order.usdcAmount).toFixed(4)} USDC</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5">
                        {(order.items || []).map((item) => (
                          <div key={item.productId} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/60">
                            {item.image ? (
                              <Image src={item.image} alt={item.productName} width={44} height={44}
                                className="rounded-lg object-cover flex-shrink-0 border border-border" unoptimized />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-muted flex-shrink-0 border border-border flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm leading-tight truncate">{item.productName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.quantity} unit{item.quantity > 1 ? "s" : ""} · ₦{Number(item.pricePerUnit).toLocaleString()} each
                              </p>
                            </div>
                            <p className="font-bold text-sm text-[#118C4C] flex-shrink-0">
                              ₦{(item.quantity * item.pricePerUnit).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Farmers */}
                      {order.farmers && order.farmers.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            Sold by{" "}
                            {order.farmers.map((f: any, i: number) => (
                              <span key={f.id}>
                                <button
                                  className="font-semibold text-foreground hover:text-[#118C4C] transition-colors"
                                  onClick={(e) => { e.stopPropagation(); router.push(`/users/${f.id}`); }}
                                >
                                  {f.name || "Farmer"}
                                </button>
                                {i < order.farmers!.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}

                      {/* Delivery address */}
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-sky-500 flex-shrink-0 mt-px" />
                          <div className="text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">{order.deliveryFullName}</span>
                            {" — "}{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}{order.deliveryState ? `, ${order.deliveryState}` : ""}
                            {order.deliveryPhone && (
                              <span className="flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" /> {order.deliveryPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Escrow badge + tx hash */}
                      {(escrowMeta || order.escrowTxHash) && (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          {escrowMeta && (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${escrowMeta.bg} ${escrowMeta.text}`}>
                              {escrowMeta.icon} {escrowMeta.label}
                            </span>
                          )}
                          {order.escrowTxHash && (
                            <a
                              href={`https://${process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? "" : "sepolia."}basescan.org/tx/${order.escrowTxHash}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[10px] text-[#118C4C] hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {order.escrowTxHash.slice(0, 10)}…{order.escrowTxHash.slice(-6)}
                            </a>
                          )}
                        </div>
                      )}

                      {/* ── Actions ── */}
                      <div className="flex gap-2 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
                        {!escrowStatus || escrowStatus === "none" ? (
                          <Button onClick={() => handleDeleteOrder(order.id)} variant="outline" size="sm"
                            className="gap-1.5 text-xs text-red-600 border-red-400/40 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <Trash2 className="h-3.5 w-3.5" /> Remove Order
                          </Button>
                        ) : null}
                        {canAct && (
                          <>
                            <Button
                              onClick={() => handleConfirmDelivery(order.id, escrowOrderId!)}
                              disabled={isActive && loading}
                              size="sm"
                              className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {isActive && loading ? "Processing…" : "Confirm Delivery"}
                            </Button>
                            <Button
                              onClick={() => setDisputeOrder({ orderId: order.id, escrowOrderId: escrowOrderId! })}
                              disabled={isActive && loading}
                              variant="outline" size="sm"
                              className="flex-1 gap-1.5 border-red-400/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <AlertTriangle className="h-4 w-4" /> Raise Dispute
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground ml-auto"
                        >
                          View Details <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {disputeOrder && (
        <DisputeModal
          isOpen={!!disputeOrder}
          onClose={() => setDisputeOrder(null)}
          orderId={disputeOrder.orderId}
          loading={activeOrderId === disputeOrder.orderId && loading}
          onConfirm={(reason, details) => handleRaiseDispute(disputeOrder.orderId, disputeOrder.escrowOrderId, reason, details)}
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
