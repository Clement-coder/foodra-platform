"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, ShoppingBag, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/withAuth";
import { useUser } from "@/lib/useUser";
import { usePrivy } from "@privy-io/react-auth";
import { authFetch } from "@/lib/authFetch";

interface PurchaseSummary {
  totalOrders: number;
  totalSpent: number;
  totalItems: number;
}

function PurchasesPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { getAccessToken } = usePrivy();
  const [summary, setSummary] = useState<PurchaseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    authFetch(getAccessToken, `/api/orders?userId=${currentUser.id}`)
      .then((r) => r.json())
      .then((orders: any[]) => {
        if (!Array.isArray(orders)) return;
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
        setSummary({ totalOrders, totalSpent, totalItems });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-6">My Purchases</h1>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card className="border-[#118C4C]/20">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-[#118C4C]" />
              </div>
              <p className="text-3xl font-bold text-[#118C4C]">{summary?.totalOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground text-center">Total Orders</p>
            </CardContent>
          </Card>

          <Card className="border-[#118C4C]/20">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#118C4C]" />
              </div>
              <p className="text-3xl font-bold text-[#118C4C]">{summary?.totalItems ?? 0}</p>
              <p className="text-xs text-muted-foreground text-center">Items Purchased</p>
            </CardContent>
          </Card>

          <Card className="border-[#118C4C]/20">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center">
                <span className="text-[#118C4C] font-bold text-sm">₦</span>
              </div>
              <p className="text-3xl font-bold text-[#118C4C]">
                {(summary?.totalSpent ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground text-center">Total Spent</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="mt-6">
        <Button
          onClick={() => router.push("/orders")}
          className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
        >
          View All Orders
        </Button>
      </div>
    </div>
  );
}

export default withAuth(PurchasesPage);
