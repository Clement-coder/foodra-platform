"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, PackageOpen, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import withAuth from "../../components/withAuth";
import { useOrders } from "@/lib/useCart";

function OrdersPage() {
  const { orders } = useOrders();
  const router = useRouter();

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
            It looks like you haven't placed any orders. Head over to the
            marketplace to find fresh products.
          </p>
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => router.push('/marketplace')}>
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden shadow-lg border-[#118C4C]/20">
                <CardHeader className="bg-[#118C4C]/5 flex flex-row items-center justify-between p-4 border-b-2 border-[#118C4C]/20">
                  <CardTitle className="text-xl font-bold">
                    Order #{order.id.slice(-6)}
                  </CardTitle>
                  <Badge className="bg-[#118C4C] text-white hover:bg-[#0d6d3a]">Processing</Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b-2 border-[#118C4C]/10">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-[#118C4C]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ordered on
                        </p>
                        <p className="font-semibold">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                      <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                        <DollarSign className="h-5 w-5 text-[#118C4C]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Order Total
                        </p>
                        <p className="font-bold text-lg text-[#118C4C]">
                          ₦{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
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
                          <p className="font-semibold text-lg mb-1">
                            {item.productName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x N
                            {item.pricePerUnit.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold text-lg">
                          N
                          {(
                            item.quantity * item.pricePerUnit
                          ).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(OrdersPage);