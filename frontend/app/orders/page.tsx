"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, PackageOpen, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import withAuth from "../../components/withAuth";
import { loadFromLocalStorage } from "@/lib/localStorage"
import type { Order } from "@/lib/types"

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedOrders = loadFromLocalStorage<Order[]>("foodra_orders", [])
    setOrders(storedOrders)
    setLoading(false)
  }, [])

  const getStatusVariant = (status: Order["status"]): "green" | "blue" | "yellow" | "red" | "gray" => {
    switch (status) {
      case "Delivered":
        return "green"
      case "Shipped":
        return "blue"
      case "Processing":
        return "yellow"
      case "Cancelled":
        return "red"
      default:
        return "gray"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/6"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 bg-gray-200 rounded-md"></div>
                    <div className="flex-grow space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">My Orders</h1>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-block bg-accent p-6 rounded-full mb-6">
            <PackageOpen className="h-20 w-20 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-semibold mb-3">No Orders Yet</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            It looks like you haven't placed any orders. Head over to the marketplace to find fresh products.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden shadow-md border border-border/60">
                <CardHeader className="bg-muted/50 flex flex-row items-center justify-between p-4">
                  <CardTitle className="text-xl">Order #{order.id.slice(-6)}</CardTitle>
                  <Badge variant={getStatusVariant(order.status)} className="text-sm">{order.status}</Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ordered on</p>
                        <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Order Total</p>
                        <p className="font-bold text-lg text-green-600">N{order.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex items-start gap-6">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover border border-border/50"
                        />
                        <div className="flex-grow">
                          <p className="font-semibold text-lg mb-1">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x N{item.pricePerUnit.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold text-lg">
                          N{(item.quantity * item.pricePerUnit).toLocaleString()}
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
  )
}

export default withAuth(OrdersPage);