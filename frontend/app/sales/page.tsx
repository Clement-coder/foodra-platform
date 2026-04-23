"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, PackageOpen, MapPin, Phone, Mail, User, Calendar,
  ExternalLink, Loader2, Share2, Check, TrendingUp, ShieldCheck, Package, Truck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import { FarmerAnalyticsDashboard } from "@/components/FarmerAnalyticsDashboard";
import withAuth from "@/components/withAuth";
import { useUser } from "@/lib/useUser";
import { usePrivy } from "@privy-io/react-auth";
import { useToast } from "@/lib/toast";
import { authFetch } from "@/lib/authFetch";

interface SaleOrder {
  id: string;
  status: string;
  escrowStatus: string;
  escrowTxHash: string | null;
  usdcAmount: number | null;
  totalAmount: number;
  createdAt: string;
  buyer: { id: string; name: string; email: string; phone: string; avatar: string; location: string } | null;
  delivery: { fullName: string | null; phone: string | null; address: string | null; street2: string | null; landmark: string | null; city: string | null; state: string | null; country: string | null };
  items: { productId: string; productName: string; quantity: number; pricePerUnit: number; image: string; escrowStatus: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  locked: "Secured in Escrow ✅",
  released: "Payment Released to Farmer ✅",
  disputed: "Under Dispute ⚠️",
  refunded: "Refunded",
  none: "No Escrow (Direct Order)",
};

function buildShareText(sale: SaleOrder): string {
  const d = sale.delivery;
  const b = sale.buyer;
  const items = sale.items.map((i) => `• ${i.productName} ×${i.quantity}`).join("\n");
  const address = [d.address, d.street2, d.landmark ? `Near ${d.landmark}` : null, d.city, d.state, d.country].filter(Boolean).join(", ");
  return `📦 DELIVERY REQUEST — Foodra Order #${sale.id.slice(-6).toUpperCase()}

RECIPIENT
Name: ${d.fullName || b?.name || "—"}
Phone: ${d.phone || b?.phone || "—"}

DELIVERY ADDRESS
${address || "Not provided"}

ITEMS
${items}

ORDER VALUE: ₦${sale.totalAmount.toLocaleString()}${sale.usdcAmount ? ` (${sale.usdcAmount.toFixed(2)} USDC)` : ""}
PAYMENT STATUS: ${STATUS_LABELS[sale.escrowStatus] ?? sale.escrowStatus}

Powered by Foodra — foodra.app`;
}

function ShareButton({ sale }: { sale: SaleOrder }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = buildShareText(sale);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Foodra Delivery — Order #${sale.id.slice(-6).toUpperCase()}`, text });
        return;
      } catch { /* fallback to copy */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button onClick={handleShare} variant="outline" size="sm" className="gap-1.5 border-[#118C4C]/30 text-[#118C4C] hover:bg-[#118C4C]/5 text-xs h-8">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Share for Logistics"}
    </Button>
  );
}

function SalesPage() {
  const { currentUser } = useUser();
  const { user: privyUser, getAccessToken } = usePrivy();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingId, setShippingId] = useState<string | null>(null);

  const fetchSales = () => {
    if (!currentUser) return;
    authFetch(getAccessToken, `/api/orders/farmer?farmerId=${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, [currentUser]);

  const handleMarkShipped = async (orderId: string) => {
    const ok = await confirm({ title: "Mark as Shipped", message: "Confirm you have dispatched this order?", confirmLabel: "Mark Shipped" });
    if (!ok) return;
    setShippingId(orderId);
    const res = await authFetch(getAccessToken, `/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Shipped" }),
    });
    setShippingId(null);
    if (res.ok) {
      toast.success("Order marked as shipped.");
      fetchSales();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || "Failed to update order.");
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

  const totalRevenue = sales.reduce((s, o) => s + o.totalAmount, 0);
  const lockedCount = sales.filter((o) => o.escrowStatus === "locked").length;
  const releasedCount = sales.filter((o) => o.escrowStatus === "released").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="h-2 w-10 bg-[#118C4C] rounded" />
            My Sales
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track orders for your listed products and manage deliveries</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {sales.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-block bg-[#118C4C]/10 p-8 rounded-full mb-6 border-2 border-[#118C4C]/20">
            <PackageOpen className="h-20 w-20 text-[#118C4C]" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">No Sales Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            When buyers purchase your listed products, their orders will appear here. You'll see full buyer contact details, delivery addresses, and payment status so you can fulfil orders confidently.
          </p>
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => router.push("/listing/new")}>
            List a Product
          </Button>
        </div>
      ) : (
        <>
          {/* Analytics Dashboard */}
          <FarmerAnalyticsDashboard sales={sales} />

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total Orders", value: sales.length, icon: Package, color: "text-[#118C4C]" },
              { label: "Awaiting Delivery", value: lockedCount, icon: ShieldCheck, color: "text-yellow-600" },
              { label: "Completed", value: releasedCount, icon: TrendingUp, color: "text-green-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-[#118C4C]/20">
                <CardContent className="p-3 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-5">
            {sales.map((sale, index) => {
              const d = sale.delivery;
              const hasDelivery = !!d.address;
              const fullAddress = [d.address, d.street2, d.landmark ? `Near ${d.landmark}` : null, d.city, d.state, d.country].filter(Boolean).join(", ");

              return (
                <motion.div key={sale.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
                  <Card className="border-[#118C4C]/20 overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#118C4C]/5 border-b border-[#118C4C]/15">
                      <div>
                        <span className="font-bold text-sm">Order #{sale.id.slice(-6).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-inline items-center gap-1">
                          <Calendar className="h-3 w-3 inline mr-0.5" />
                          {new Date(sale.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#118C4C] text-white text-xs">{sale.status}</Badge>
                        <EscrowStatusBadge status={sale.escrowStatus} />
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {/* Items sold */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items Ordered</p>
                        <div className="space-y-2">
                          {sale.items.map((item) => (
                            <div key={item.productId} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-[#118C4C]/10">
                              <Image src={item.image} alt={item.productName} width={52} height={52} className="rounded-md object-cover flex-shrink-0 border border-[#118C4C]/20" unoptimized />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{item.productName}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} unit{item.quantity > 1 ? "s" : ""} × ₦{item.pricePerUnit.toLocaleString()} each</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-sm text-[#118C4C]">₦{(item.quantity * item.pricePerUnit).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#118C4C]/10">
                          <span className="text-sm text-muted-foreground">Order Total</span>
                          <span className="font-bold text-[#118C4C]">
                            ₦{sale.totalAmount.toLocaleString()}
                            {sale.usdcAmount ? <span className="text-xs text-muted-foreground font-normal ml-1">({sale.usdcAmount.toFixed(2)} USDC)</span> : null}
                          </span>
                        </div>
                      </div>

                      {/* Buyer info card */}
                      {sale.buyer && (
                        <div className="rounded-xl border border-[#118C4C]/20 overflow-hidden">
                          <div className="px-3 py-2 bg-[#118C4C]/5 border-b border-[#118C4C]/10">
                            <p className="text-xs font-semibold text-[#118C4C] uppercase tracking-wide">Buyer Information</p>
                          </div>
                          <div className="p-3 space-y-2">
                            <a href={`/users/${sale.buyer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                              {sale.buyer.avatar ? (
                                <Image src={sale.buyer.avatar} alt={sale.buyer.name} width={40} height={40} className="rounded-full object-cover border-2 border-[#118C4C]/20 flex-shrink-0" unoptimized />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#118C4C]/10 border-2 border-[#118C4C]/20 flex items-center justify-center flex-shrink-0">
                                  <User className="h-5 w-5 text-[#118C4C]" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm hover:underline underline-offset-2">{sale.buyer.name || "—"}</p>
                                {sale.buyer.location && <p className="text-xs text-muted-foreground">{sale.buyer.location}</p>}
                              </div>
                            </a>
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                              {sale.buyer.phone && (
                                <a href={`tel:${sale.buyer.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  <div className="p-1 bg-[#118C4C]/10 rounded"><Phone className="h-3.5 w-3.5 text-[#118C4C]" /></div>
                                  {sale.buyer.phone}
                                </a>
                              )}
                              {sale.buyer.email && (
                                <a href={`mailto:${sale.buyer.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  <div className="p-1 bg-[#118C4C]/10 rounded"><Mail className="h-3.5 w-3.5 text-[#118C4C]" /></div>
                                  {sale.buyer.email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivery address card */}
                      {hasDelivery && (
                        <div className="rounded-xl border border-[#118C4C]/20 overflow-hidden">
                          <div className="px-3 py-2 bg-[#118C4C]/5 border-b border-[#118C4C]/10 flex items-center justify-between">
                            <p className="text-xs font-semibold text-[#118C4C] uppercase tracking-wide">Delivery Address</p>
                            <ShareButton sale={sale} />
                          </div>
                          <div className="p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-[#118C4C]/10 rounded"><User className="h-3.5 w-3.5 text-[#118C4C]" /></div>
                              <span className="font-semibold text-sm">{d.fullName}</span>
                            </div>
                            {d.phone && (
                              <a href={`tel:${d.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <div className="p-1 bg-[#118C4C]/10 rounded"><Phone className="h-3.5 w-3.5 text-[#118C4C]" /></div>
                                {d.phone}
                              </a>
                            )}
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className="p-1 bg-[#118C4C]/10 rounded mt-0.5 flex-shrink-0"><MapPin className="h-3.5 w-3.5 text-[#118C4C]" /></div>
                              <span className="leading-relaxed">{fullAddress}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Escrow note */}
                      {sale.escrowStatus === "locked" && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 text-xs text-yellow-700 dark:text-yellow-400">
                          <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <p>Payment of ₦{sale.totalAmount.toLocaleString()} is secured in escrow. It will be released to you once the buyer confirms delivery.</p>
                        </div>
                      )}

                      {/* Mark as Shipped */}
                      {sale.escrowStatus === "locked" && sale.status !== "Shipped" && sale.status !== "Delivered" && (
                        <Button
                          onClick={() => handleMarkShipped(sale.id)}
                          disabled={shippingId === sale.id}
                          size="sm"
                          className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2"
                        >
                          {shippingId === sale.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Truck className="h-4 w-4" />
                          )}
                          Mark as Shipped
                        </Button>
                      )}
                      {sale.status === "Shipped" && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 text-xs text-blue-700 dark:text-blue-400">
                          <Truck className="h-4 w-4 flex-shrink-0" />
                          <p>Marked as shipped. Awaiting buyer delivery confirmation.</p>
                        </div>
                      )}
                      {sale.escrowStatus === "released" && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 text-xs text-green-700 dark:text-green-400">
                          <TrendingUp className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <p>Payment released! ₦{sale.totalAmount.toLocaleString()} has been sent to your wallet.</p>
                        </div>
                      )}

                      {/* Tx link */}
                      {sale.escrowTxHash && (
                        <p className="text-xs text-muted-foreground">
                          Escrow tx:{" "}
                          <a href={`https://sepolia.basescan.org/tx/${sale.escrowTxHash}`} target="_blank" rel="noopener noreferrer" className="text-[#118C4C] underline underline-offset-2 inline-flex items-center gap-1">
                            {sale.escrowTxHash.slice(0, 10)}...{sale.escrowTxHash.slice(-6)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default withAuth(SalesPage);
