"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, PackageOpen, Calendar, DollarSign, CheckCircle, AlertTriangle, Trash2, MapPin, Phone, ExternalLink } from "lucide-react";
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
      // Find farmer info from the order and prompt rating
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
      // Save dispute details
      await authFetch(getAccessToken, `/api/orders/${orderId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      }).catch(() => {}); // non-blocking — dispute is already on-chain
      toast.success("Dispute raised. Our team will review and resolve it within 3–5 business days.");
      refreshOrders();
    } else {
      toast.error("Failed to raise dispute. Please try again.");
    }
    setActiveOrderId(null);
    setDisputeOrder(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <div className="h-2 w-12 bg-[#118C4C] rounded"></div>
          My Orders
        </h1>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-block bg-[#118C4C]/10 p-8 rounded-full mb-6 border-2 border-[#118C4C]/20">
            <PackageOpen className="h-20 w-20 text-[#118C4C]" />
          </div>
          <h2 className="text-3xl font-semibold mb-3">No Orders Yet</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-6">
            It looks like you haven't placed any orders. Head over to the marketplace to find fresh products.
          </p>
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => router.push("/marketplace")}>
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const escrowOrderId = order.items.find((i) => i.escrowOrderId)?.escrowOrderId;
            const escrowStatus = order.escrowStatus;
            const isActive = activeOrderId === order.id;
            const canAct = (escrowStatus === "locked" || (!!order.escrowTxHash && escrowStatus === "none")) && !!escrowOrderId;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
              >
                <Card className="overflow-hidden border-[#118C4C]/20 hover:border-[#118C4C]/50 transition-colors cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#118C4C]/5 border-b border-[#118C4C]/15">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                      Order #{order.id.slice(-6).toUpperCase()}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#118C4C] text-white hover:bg-[#0d6d3a] text-xs">{order.status}</Badge>
                      <EscrowStatusBadge status={escrowStatus} />
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Meta row */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <span className="font-bold text-[#118C4C] text-base">
                        ₦{order.totalAmount.toLocaleString()}
                        {order.usdcAmount ? <span className="text-xs text-muted-foreground font-normal ml-1">({order.usdcAmount.toFixed(2)} USDC)</span> : null}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-[#118C4C]/10">
                          {item.image ? (
                            <Image src={item.image} alt={item.productName} width={52} height={52} className="rounded-md object-cover flex-shrink-0 border border-[#118C4C]/20" unoptimized />
                          ) : (
                            <div className="w-[52px] h-[52px] rounded-md bg-muted flex-shrink-0 border border-[#118C4C]/20 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">No img</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} × ₦{item.pricePerUnit.toLocaleString()}</p>
                          </div>
                          <p className="font-semibold text-sm flex-shrink-0">₦{(item.quantity * item.pricePerUnit).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    {/* Delivery snippet */}
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-[#118C4C]/10 text-xs" onClick={(e) => e.stopPropagation()}>
                        <MapPin className="h-3.5 w-3.5 text-[#118C4C] flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">{order.deliveryFullName}</span>
                          {" · "}{order.deliveryAddress}, {order.deliveryCity}, {order.deliveryState}
                          {order.deliveryPhone && <span> · <Phone className="h-3 w-3 inline" /> {order.deliveryPhone}</span>}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    {escrowStatus === "none" && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button onClick={() => handleDeleteOrder(order.id)} variant="outline" size="sm" className="text-red-600 border-red-500/30 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 text-xs">
                          <Trash2 className="h-3.5 w-3.5" /> Remove Order
                        </Button>
                      </div>
                    )}

                    {canAct && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button onClick={() => handleConfirmDelivery(order.id, escrowOrderId!)} disabled={isActive && loading} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5 text-sm h-9">
                          <CheckCircle className="h-4 w-4" />
                          {isActive && loading ? "Processing..." : "Confirm Delivery"}
                        </Button>
                        <Button onClick={() => setDisputeOrder({ orderId: order.id, escrowOrderId: escrowOrderId! })} disabled={isActive && loading} variant="outline" className="flex-1 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5 text-sm h-9">
                          <AlertTriangle className="h-4 w-4" /> Raise Dispute
                        </Button>
                      </div>
                    )}

                    {order.escrowTxHash && (
                      <p className="text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                        Tx:{" "}
                        <a href={`https://sepolia.basescan.org/tx/${order.escrowTxHash}`} target="_blank" rel="noopener noreferrer" className="text-[#118C4C] underline underline-offset-2">
                          {order.escrowTxHash.slice(0, 10)}...{order.escrowTxHash.slice(-6)}
                        </a>
                      </p>
                    )}
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
