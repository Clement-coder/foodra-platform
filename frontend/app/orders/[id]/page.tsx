"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import {
   ArrowLeft, MapPin, Phone, User, Package,
   Calendar, ExternalLink, Loader2, CheckCircle, AlertTriangle, Download, Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import { DisputeModal } from "@/components/DisputeModal";
import { StatusPill, JourneyBar } from "@/components/OrderCard";
import withAuth from "@/components/withAuth";
import { WrongAccountBanner } from "@/components/WrongAccountBanner";
import { useEscrow } from "@/lib/useEscrow";
import { useToast } from "@/lib/toast";
import { downloadReceiptImage, maskSensitive } from "@/lib/receipt";
import type { Order } from "@/lib/types";
import { authFetch } from "@/lib/authFetch";

function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const { getAccessToken } = usePrivy();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const { confirmDelivery, raiseDispute, loading: escrowLoading, error: escrowError } = useEscrow();

  const fetchOrder = () =>
    authFetch(getAccessToken, `/api/orders/${id}`).then((r) => r.json()).then(setOrder).finally(() => setLoading(false));

  useEffect(() => { fetchOrder(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const escrowOrderId = order?.items.find((i) => i.escrowOrderId)?.escrowOrderId;
  // Escrow actions (confirm/dispute on-chain) require locked escrow
  const canEscrowAct = order && (order.escrowStatus === "locked" || (!!order.escrowTxHash && order.escrowStatus === "none")) && !!escrowOrderId;
  // Dispute can be raised any time the order is not already cancelled/disputed
  const canDispute = order && !["Cancelled", "disputed"].includes(order.escrowStatus ?? "") && order.status !== "Cancelled";

  const handleConfirm = async () => {
    if (!order || !escrowOrderId) return;
    const ok = await confirm({ title: "Confirm Delivery", message: "Confirm you received this order? This will release payment to the farmer.", confirmLabel: "Confirm Delivery" });
    if (!ok) return;
    const success = await confirmDelivery(escrowOrderId);
    if (success) {
      await authFetch(getAccessToken, `/api/orders/${order.id}/escrow`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ escrowStatus: "released" }) });
      toast.success("Delivery confirmed! Payment released to farmer.");
      fetchOrder();
    } else {
      toast.error(escrowError || "Failed to confirm delivery. Please try again.");
    }
  };

  const handleDispute = async (reason: string, details: string) => {
    if (!order) return;
    // Try to raise on-chain dispute if escrow exists
    if (escrowOrderId) {
      const success = await raiseDispute(escrowOrderId);
      if (success) {
        await authFetch(getAccessToken, `/api/orders/${order.id}/escrow`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ escrowStatus: "disputed" }),
        });
      }
    }
    // Always save dispute record in DB
    const res = await authFetch(getAccessToken, `/api/orders/${order.id}/dispute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });
    if (res.ok) {
      toast.success("Dispute raised. Our team will review within 3–5 business days.");
      setDisputeOpen(false);
      fetchOrder();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Failed to submit dispute.");
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

  const downloadInvoice = async () => {
    const farmerNames = [...new Set(order.farmers?.map(f => f.name).filter(Boolean) || [])]
    const lines = [
      { label: "Order ID", value: `#${order.id.slice(-6).toUpperCase()}` },
      { label: "Date", value: new Date(order.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }) },
      { label: "Status", value: order.status },
      ...(farmerNames.length ? [{ label: "Sold by", value: farmerNames.join(", ") }] : []),
      { label: "", value: "" },
      ...order.items.map(i => ({
        label: `${i.productName} ×${i.quantity}`,
        value: `₦${(i.pricePerUnit * i.quantity).toLocaleString()}`,
      })),
      { label: "", value: "" },
      { label: "Total", value: `₦${Number(order.totalAmount).toLocaleString()}`, bold: true, green: true },
      ...(order.usdcAmount ? [{ label: "USDC equivalent", value: `${order.usdcAmount.toFixed(2)} USDC`, small: true }] : []),
      ...(order.escrowStatus && order.escrowStatus !== "none" ? [{ label: "Payment status", value: order.escrowStatus, small: true }] : []),
      { label: "", value: "" },
      // Delivery — mask sensitive fields
      ...(order.deliveryFullName ? [{ label: "Recipient", value: maskSensitive(order.deliveryFullName), small: true }] : []),
      ...(order.deliveryPhone ? [{ label: "Phone", value: maskSensitive(order.deliveryPhone), small: true }] : []),
      ...(order.deliveryAddress ? [{ label: "Address", value: `${order.deliveryCity || ""}, ${order.deliveryState || ""}`, small: true }] : []),
    ]
    downloadReceiptImage({
      title: "ORDER RECEIPT",
      subtitle: `Receipt #${order.id.slice(-6).toUpperCase()}`,
      lines,
      filename: `foodra-order-${order.id.slice(-6).toUpperCase()}`,
    })
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <WrongAccountBanner />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="h-2 w-10 bg-[#118C4C] rounded" />
            Order Details
          </h1>
          <p className="text-muted-foreground text-sm mt-1">#{order.id.slice(-10).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/orders")} className="gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={downloadInvoice} className="gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
            <Download className="h-4 w-4" /> Receipt
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Status row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border overflow-hidden">
            <div className="px-5 py-3 bg-muted/30 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-bold text-sm tracking-widest">{order.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={order.status} />
                <EscrowStatusBadge status={order.escrowStatus} />
              </div>
            </div>
            <CardContent className="p-5">
              {order.status !== "Cancelled" && <JourneyBar status={order.status} />}
              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                <div className="text-right">
                  <p className="font-black text-[#118C4C] text-xl">₦{Number(order.totalAmount).toLocaleString()}</p>
                  {order.usdcAmount ? <p className="text-xs text-muted-foreground">{Number(order.usdcAmount).toFixed(4)} USDC</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action buttons */}
        {(canEscrowAct || canDispute) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <Card className="border-[#118C4C]/30 bg-[#118C4C]/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">
                  {canEscrowAct
                    ? "Your payment is secured in escrow. Have you received your items?"
                    : "Have an issue with this order?"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {canEscrowAct && (
                    <Button onClick={handleConfirm} disabled={escrowLoading} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 w-full">
                      {escrowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      {escrowLoading ? "Processing..." : "Confirm Delivery"}
                    </Button>
                  )}
                  {canDispute && (
                    <Button onClick={() => setDisputeOpen(true)} disabled={escrowLoading} variant="outline" className="flex-1 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2 w-full">
                      <AlertTriangle className="h-4 w-4" /> Raise Dispute
                    </Button>
                  )}
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
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} width={64} height={64} className="rounded-lg object-cover border-2 border-[#118C4C]/20" unoptimized />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted border-2 border-[#118C4C]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">No img</span>
                    </div>
                  )}
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
                <p className="text-xs text-amber-600 dark:text-amber-400 pt-1 border-t border-border mt-2">
                  🚚 A small delivery fee applies when your order arrives — we'll keep you posted on the details.
                </p>
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
                <a href={`https://${process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? "" : "sepolia."}basescan.org/tx/${order.escrowTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#118C4C] text-sm font-mono hover:underline">
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
