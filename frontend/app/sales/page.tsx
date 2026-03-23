"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, PackageOpen, MapPin, Phone, Mail, User, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EscrowStatusBadge } from "@/components/EscrowStatusBadge";
import withAuth from "@/components/withAuth";
import { useUser } from "@/lib/useUser";

interface SaleOrder {
  id: string;
  status: string;
  escrowStatus: string;
  escrowTxHash: string | null;
  usdcAmount: number | null;
  totalAmount: number;
  createdAt: string;
  buyer: { id: string; name: string; email: string; phone: string; avatar: string } | null;
  delivery: { fullName: string | null; phone: string | null; address: string | null; street2: string | null; landmark: string | null; city: string | null; state: string | null; country: string | null };
  items: { productId: string; productName: string; quantity: number; pricePerUnit: number; image: string; escrowStatus: string }[];
}

function SalesPage() {
  const { currentUser } = useUser();
  const router = useRouter();
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/orders/farmer?farmerId=${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => setSales(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [currentUser]);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <div className="h-2 w-10 bg-[#118C4C] rounded" />
          My Sales
        </h1>
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
            When buyers purchase your products, their orders will appear here with full delivery and contact details.
          </p>
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => router.push("/listing/new")}>
            List a Product
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale, index) => (
            <motion.div key={sale.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
              <Card className="border-[#118C4C]/20 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#118C4C]/5 border-b border-[#118C4C]/15">
                  <span className="font-semibold text-sm">Order #{sale.id.slice(-6).toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#118C4C] text-white text-xs">{sale.status}</Badge>
                    <EscrowStatusBadge status={sale.escrowStatus} />
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Date + total */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(sale.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                    <span className="font-bold text-[#118C4C]">
                      ₦{sale.totalAmount.toLocaleString()}
                      {sale.usdcAmount ? <span className="text-xs text-muted-foreground font-normal ml-1">({sale.usdcAmount.toFixed(2)} USDC)</span> : null}
                    </span>
                  </div>

                  {/* Items sold */}
                  <div className="space-y-2">
                    {sale.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-[#118C4C]/10">
                        <Image src={item.image} alt={item.productName} width={48} height={48} className="rounded-md object-cover flex-shrink-0 border border-[#118C4C]/20" unoptimized />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} × ₦{item.pricePerUnit.toLocaleString()}</p>
                        </div>
                        <p className="font-semibold text-sm">₦{(item.quantity * item.pricePerUnit).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Buyer info */}
                  {sale.buyer && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-[#118C4C]/10 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Buyer</p>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-[#118C4C]" />
                        <span className="font-medium">{sale.buyer.name || "—"}</span>
                      </div>
                      {sale.buyer.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{sale.buyer.phone}
                        </div>
                      )}
                      {sale.buyer.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{sale.buyer.email}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery address */}
                  {sale.delivery.address && (
                    <div className="p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/15 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Deliver To</p>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-3.5 w-3.5 text-[#118C4C]" />{sale.delivery.fullName}
                      </div>
                      {sale.delivery.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{sale.delivery.phone}
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-[#118C4C]" />
                        <span>
                          {sale.delivery.address}
                          {sale.delivery.street2 ? `, ${sale.delivery.street2}` : ""}
                          {sale.delivery.landmark ? ` (Near ${sale.delivery.landmark})` : ""}
                          {", "}{sale.delivery.city}, {sale.delivery.state}, {sale.delivery.country}
                        </span>
                      </div>
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
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(SalesPage);
