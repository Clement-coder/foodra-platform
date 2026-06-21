"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Package, DollarSign, ShoppingBag, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalesPageSkeleton } from "@/components/Skeleton";
import withAuth from "@/components/withAuth";
import { useUser } from "@/lib/useUser";
import { usePrivy } from "@privy-io/react-auth";
import { authFetch } from "@/lib/authFetch";

function SalesDashboard() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { getAccessToken } = usePrivy();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    authFetch(getAccessToken, `/api/orders/farmer?farmerId=${currentUser.id}`)
      .then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]); // eslint-disable-line

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === "Delivered")
      .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const pendingRevenue = orders
      .filter((o) => ["Processing", "Shipped"].includes(o.status))
      .reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    return { totalRevenue, pendingRevenue, totalOrders: orders.length, totalItems: orders.reduce((s: number, o: any) => s + (o.items?.length || 0), 0) };
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; image: string; revenue: number; qty: number }>();
    for (const order of orders.filter((o) => o.status === "Delivered")) {
      for (const item of order.items || []) {
        const e = map.get(item.productId) || { name: item.productName, image: item.image, revenue: 0, qty: 0 };
        e.revenue += item.pricePerUnit * item.quantity;
        e.qty += item.quantity;
        map.set(item.productId, e);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  if (loading) return <SalesPageSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="h-2 w-10 bg-[#118C4C] rounded" />
            Sales Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your sales overview</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 border-[#118C4C]/30">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `₦${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
          { label: "Pending Revenue", value: `₦${stats.pendingRevenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20" },
          { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
          { label: "Items Sold", value: stats.totalItems, icon: Package, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-[#118C4C]/20">
            <CardContent className="p-5 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {topProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-[#118C4C]/20 mb-6">
            <CardHeader className="pb-3 border-b border-[#118C4C]/10">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#118C4C]" /> Top Products by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  {p.image ? (
                    <Image src={p.image} alt={p.name} width={40} height={40} className="rounded-lg object-cover border border-[#118C4C]/20" unoptimized />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted border border-[#118C4C]/20" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} units sold</p>
                  </div>
                  <p className="text-sm font-bold text-[#118C4C]">₦{p.revenue.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-[#118C4C]/20">
          <CardHeader className="pb-3 border-b border-[#118C4C]/10">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#118C4C]" /> Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 rounded-xl border border-[#118C4C]/10 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Order #{order.id.slice(-6).toUpperCase()}</span>
                      <Badge className="bg-[#118C4C] text-white text-xs">{order.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="font-bold text-[#118C4C] text-sm">₦{order.totalAmount.toLocaleString()}</span>
                    </div>
                    {order.buyer && (
                      <p className="text-xs text-muted-foreground">Buyer: <span className="font-medium text-foreground">{order.buyer.name || "Anonymous"}</span></p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(order.items || []).map((item: any, i: number) => (
                        <span key={i} className="text-[11px] bg-[#118C4C]/10 text-[#118C4C] px-2 py-0.5 rounded-full">
                          {item.productName} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default withAuth(SalesDashboard);
