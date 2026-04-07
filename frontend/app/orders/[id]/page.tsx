"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Phone, User, Mail, Package,
  Calendar, DollarSign, ExternalLink, Loader2, CheckCircle, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import { DisputeModal } from "@/components/DisputeModal";
import withAuth from "@/components/withAuth";
import { useEscrow } from "@/lib/useEscrow";
import { useUser } from "@/lib/useUser";
import { useToast } from "@/lib/toast";
import type { Order } from "@/lib/types";

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const { currentUser } = useUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const { confirmDelivery, raiseDispute, loading: escrowLoading, error: escrowError } = useEscrow();

  const fetchOrder = () =>
    fetch(`/api/orders/${id}`).then((r) => r.json()).then(setOrder).finally(() => setLoading(false));

  useEffect(() => { fetchOrder(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const escrowOrderId = order?.items.find((i) => i.escrowOrderId)?.escrowOrderId;
  // Show actions if locked OR if tx hash exists but status wasn't saved (broken save scenario)
  const canAct = order && (order.escrowStatus === "locked" || (!!order.escrowTxHash && order.escrowStatus === "none")) && !!escrowOrderId;

  const handleConfirm = async () => {
    if (!order || !escrowOrderId) return;
    const ok = await confirm({ title: "Confirm Delivery", message: "Confirm you received this order? This will release payment to the farmer.", confirmLabel: "Confirm Delivery" });
    if (!ok) return;
    const success = await confirmDelivery(escrowOrderId);
    if (success) {
      await fetch(`/api/orders/${order.id}/escrow`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escrowStatus: "released" }) });
      toast.success("Delivery confirmed! Payment released to farmer.");
      fetchOrder();
    } else {
      toast.error(escrowError || "Failed to confirm delivery. Please try again.");
    }
  };

  const handleDispute = async (reason: string, details: string) => {
    if (!order || !escrowOrderId) return;
    const success = await raiseDispute(escrowOrderId);
    if (success) {
      await fetch(`/api/orders/${order.id}/escrow`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escrowStatus: "disputed" }) });
      await fetch(`/api/orders/${order.id}/dispute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details, userId: currentUser?.id }) }).catch(() => {});
      toast.success("Dispute raised. Our team will review within 3–5 business days.");
      setDisputeOpen(false);
      fetchOrder();
    } else {
      toast.error(escrowError || "Failed to raise dispute. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-16 h-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full">
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]" />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 m-auto w-10 h-10 bg-[#118C4C] rounded-full opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-[#118C4C] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button onClick={() => router.push("/orders")} className="mt-4 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Back to Orders</Button>
      </div>
    );
  }

  const hasDelivery = order.deliveryFullName || order.deliveryAddress;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="h-2 w-10 bg-[#118C4C] rounded" />
            Order Details
          </h1>
          <p className="text-muted-foreground text-sm mt-1">#{order.id.slice(-10).toUpperCase()}</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/orders")} className="gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="space-y-5">
        {/* Status row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-[#118C4C]/20">
            <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-[#118C4C]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Placed on</p>
                  <p className="font-semibold text-sm">
                    {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-[#118C4C]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-bold text-[#118C4C]">
                    ₦{order.totalAmount.toLocaleString()}
                    {order.usdcAmount ? <span className="text-xs text-muted-foreground ml-1">({order.usdcAmount.toFixed(2)} USDC)</span> : null}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-[#118C4C] text-white hover:bg-[#0d6d3a]">{order.status}</Badge>
                <EscrowStatusBadge status={order.escrowStatus} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action buttons */}
        {canAct && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <Card className="border-[#118C4C]/30 bg-[#118C4C]/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Your payment is secured in escrow. Have you received your items?</p>
                <div className="flex gap-3">
                  <Button onClick={handleConfirm} disabled={escrowLoading} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
                    {escrowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {escrowLoading ? "Processing..." : "Confirm Delivery"}
                  </Button>
                  <Button onClick={() => setDisputeOpen(true)} disabled={escrowLoading} variant="outline" className="flex-1 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2">
                    <AlertTriangle className="h-4 w-4" /> Raise Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Items */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-[#118C4C]/20">
            <CardHeader className="pb-3 border-b border-[#118C4C]/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-[#118C4C]" /> Items Ordered
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-[#118C4C]/10">
                  <Image src={item.image} alt={item.productName} width={64} height={64} className="rounded-lg object-cover border-2 border-[#118C4C]/20" unoptimized />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} × ₦{item.pricePerUnit.toLocaleString()}</p>
                  </div>
                  <p className="font-bold text-[#118C4C]">₦{(item.quantity * item.pricePerUnit).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery address */}
        {hasDelivery && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-[#118C4C]/20">
              <CardHeader className="pb-3 border-b border-[#118C4C]/10">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#118C4C]" /> Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{order.deliveryFullName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />{order.deliveryPhone}
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{order.deliveryAddress}, {order.deliveryCity}, {order.deliveryState}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Seller info */}
        {order.farmers && order.farmers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="border-[#118C4C]/20">
              <CardHeader className="pb-3 border-b border-[#118C4C]/10">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-[#118C4C]" /> Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {order.farmers.map((farmer) => (
                  <a key={farmer.id} href={`/users/${farmer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    {farmer.avatar ? (
                      <Image src={farmer.avatar} alt={farmer.name} width={44} height={44} className="rounded-full object-cover border-2 border-[#118C4C]/20 flex-shrink-0" unoptimized />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#118C4C]/10 border-2 border-[#118C4C]/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-[#118C4C]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm hover:underline underline-offset-2">{farmer.name || "—"}</p>
                      {farmer.location && <p className="text-xs text-muted-foreground">{farmer.location}</p>}
                      {farmer.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />{farmer.phone}
                        </p>
                      )}
                      {farmer.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />{farmer.email}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Escrow tx */}
        {order.escrowTxHash && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-[#118C4C]/20">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-1">Escrow Transaction</p>
                <a href={`https://sepolia.basescan.org/tx/${order.escrowTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#118C4C] text-sm font-mono hover:underline">
                  {order.escrowTxHash.slice(0, 14)}...{order.escrowTxHash.slice(-8)}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <DisputeModal
        isOpen={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        orderId={order.id}
        loading={escrowLoading}
        onConfirm={handleDispute}
      />
    </div>
  );
}

export default withAuth(OrderDetailPage);
