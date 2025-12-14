"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, PackageOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { loadFromLocalStorage } from "@/lib/localStorage"
import type { Order } from "@/lib/types"

export default function OrdersPage() {
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
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <p>Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-block bg-accent p-6 rounded-full mb-4">
            <PackageOpen className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            It looks like you haven't placed any orders. Head over to the marketplace to find fresh products from local farmers.
          </p>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Ordered on: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-bold">Total: N{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-4">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="rounded-md object-cover"
                        />
                        <div className="flex-grow">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x N{item.pricePerUnit.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">
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
