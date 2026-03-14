"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, PackageOpen, Calendar, DollarSign, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import { NotificationDiv } from "@/components/NotificationDiv";
import withAuth from "../../components/withAuth";
import { useOrders } from "@/lib/useCart";
import { useEscrow } from "@/lib/useEscrow";

function OrdersPage() {
  const { orders, refreshOrders } = useOrders();
  const { confirmDelivery, raiseDispute, loading } = useEscrow();
  const router = useRouter();
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const handleConfirmDelivery = async (orderId: string, escrowOrderId: string) => {
    setActiveOrderId(orderId);
    const ok = await confirmDelivery(escrowOrderId);
    if (ok) {
      await fetch(`/api/orders/${orderId}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowStatus: "released" }),
      });
      setNotification({ type: "success", message: "Delivery confirmed! Payment released to farmer." });
      refreshOrders();
    } else {
      setNotification({ type: "error", message: "Failed to confirm delivery. Please try again." });
    }
    setActiveOrderId(null);
  };

  const handleRaiseDispute = async (orderId: string, escrowOrderId: string) => {
    setActiveOrderId(orderId);
    const ok = await raiseDispute(escrowOrderId);
    if (ok) {
      await fetch(`/api/orders/${orderId}/escrow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowStatus: "disputed" }),
      });
      setNotification({ type: "success", message: "Dispute raised. Our team will review and resolve it." });
      refreshOrders();
    } else {
      setNotification({ type: "error", message: "Failed to raise dispute. Please try again." });
    }
    setActiveOrderId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {notification && (
        <NotificationDiv
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

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
        <div className="space-y-6">
          {orders.map((order, index) => {
            const escrowOrderId = order.items[0]?.escrowOrderId;
            const escrowStatus = order.escrowStatus;
            const isActive = activeOrderId === order.id;
            const canAct = escrowStatus === "locked" && escrowOrderId;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden shadow-lg border-[#118C4C]/20">
                  <CardHeader className="bg-[#118C4C]/5 flex flex-row items-center justify-between p-4 border-b-2 border-[#118C4C]/20 flex-wrap gap-2">
                    <CardTitle className="text-xl font-bold">
                      Order #{order.id.slice(-6)}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-[#118C4C] text-white hover:bg-[#0d6d3a]">{order.status}</Badge>
                      <EscrowStatusBadge status={escrowStatus} />
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-[#118C4C]/10">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-[#118C4C]" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ordered on</p>
                          <p className="font-semibold">
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                        <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                          <DollarSign className="h-5 w-5 text-[#118C4C]" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Order Total</p>
                          <p className="font-bold text-lg text-[#118C4C]">
                            ₦{order.totalAmount.toLocaleString()}
                            {order.usdcAmount ? (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({order.usdcAmount.toFixed(2)} USDC)
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-4 mb-6">
                      {order.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-[#118C4C]/10"
                        >
                          <Image
                            src={item.image}
                            alt={item.productName}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover border-2 border-[#118C4C]/20"
                          />
                          <div className="flex-grow">
                            <p className="font-semibold text-lg mb-1">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × ₦{item.pricePerUnit.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold text-lg">
                            ₦{(item.quantity * item.pricePerUnit).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Escrow Actions */}
                    {canAct && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#118C4C]/10">
                        <Button
                          onClick={() => handleConfirmDelivery(order.id, escrowOrderId!)}
                          disabled={isActive && loading}
                          className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isActive && loading ? "Processing..." : "Confirm Delivery"}
                        </Button>
                        <Button
                          onClick={() => handleRaiseDispute(order.id, escrowOrderId!)}
                          disabled={isActive && loading}
                          variant="outline"
                          className="flex-1 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Raise Dispute
                        </Button>
                      </div>
                    )}

                    {/* Tx hash link */}
                    {order.escrowTxHash && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Escrow tx:{" "}
                        <a
                          href={`https://sepolia.basescan.org/tx/${order.escrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#118C4C] underline underline-offset-2"
                        >
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
    </div>
  );
}

export default withAuth(OrdersPage);
