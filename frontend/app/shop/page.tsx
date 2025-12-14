"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CartItem } from "@/lib/types"
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"

export default function ShopPage() {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    const storedCart = loadFromLocalStorage<CartItem[]>("foodra_cart", [])
    setCart(storedCart)
  }

  const updateQuantity = (productId: string, change: number) => {
    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + change)
        return { ...item, quantity: newQuantity }
      }
      return item
    })

    setCart(updatedCart)
    saveToLocalStorage("foodra_cart", updatedCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const removeItem = (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId)
    setCart(updatedCart)
    saveToLocalStorage("foodra_cart", updatedCart)
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.pricePerUnit * item.quantity, 0)
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-muted rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Browse the marketplace and add products to your cart</p>
          <Link href="/marketplace">
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
              Browse Marketplace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground mb-1 truncate">{item.productName}</h3>
                      <p className="text-[#118C4C] font-bold text-xl mb-3">
                        ₦{(item.pricePerUnit * item.quantity).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                          <Button
                            // size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="h-8 w-8"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            // size="icon"
                            variant="ghost"
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="h-8 w-8"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items ({cart.length})</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-green-600 dark:text-green-400">Free</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground text-lg">Total</span>
                  <span className="font-bold text-[#118C4C] text-2xl">₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <Button className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white mb-3" size="lg">
                Proceed to Checkout
              </Button>

              <Link href="/marketplace">
                <Button variant="outline" className="w-full bg-transparent">
                  Continue Shopping
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure checkout • Free delivery on all orders
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
