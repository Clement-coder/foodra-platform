"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, Bell, BellOff, ShoppingCart } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/lib/toast"
import { useCart } from "@/lib/useCart"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"
import { getWishlist, removeFromWishlist, setAlertPrice, type WishlistItem } from "@/lib/wishlist"

export default function WishlistPage() {
  const { getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const [items, setItems] = useState<WishlistItem[]>([])
  const { addToCart } = useCart()
  const { toast } = useToast()

  const refresh = async () => {
    if (currentUser?.id) {
      const res = await authFetch(getAccessToken, "/api/wishlist")
      if (res.ok) {
        setItems(await res.json())
        return
      }
    }
    setItems(getWishlist())
  }

  useEffect(() => {
    refresh()
    const handler = () => { void refresh() }
    window.addEventListener("wishlistchange", handler)
    return () => window.removeEventListener("wishlistchange", handler)
  }, [currentUser?.id, getAccessToken])

  const handleRemove = async (productId: string) => {
    if (currentUser?.id) {
      await authFetch(getAccessToken, `/api/wishlist?productId=${productId}`, { method: "DELETE" })
    } else {
      removeFromWishlist(productId)
    }
    toast.success("Removed from wishlist")
    await refresh()
  }

  const handleAlertToggle = async (item: WishlistItem) => {
    if (item.alertPrice !== null) {
      if (currentUser?.id) {
        await authFetch(getAccessToken, "/api/wishlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId, alertPrice: null }),
        })
      } else {
        setAlertPrice(item.productId, null)
      }
      toast.success("Price alert removed")
    } else {
      const price = prompt(`Set alert price for ${item.productName} (₦):`, String(item.priceAtAdd))
      if (price && !isNaN(Number(price))) {
        if (currentUser?.id) {
          await authFetch(getAccessToken, "/api/wishlist", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.productId, alertPrice: Number(price) }),
          })
        } else {
          setAlertPrice(item.productId, Number(price))
        }
        toast.success(`Alert set at ₦${Number(price).toLocaleString()}`)
      }
    }
    await refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-7 w-7 text-red-500 fill-current" />
        <h1 className="text-3xl font-bold text-foreground">Wishlist</h1>
        <span className="ml-auto text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">Save products you love and set price alerts</p>
          <Link href="/marketplace">
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="border-[#118C4C]/20">
              <CardContent className="p-4 flex gap-4 items-center">
                <Link href={`/marketplace/${item.productId}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/${item.productId}`}>
                    <h3 className="font-semibold text-foreground truncate hover:text-[#118C4C]">{item.productName}</h3>
                  </Link>
                  <p className="text-[#118C4C] font-bold">₦{Number(item.currentPrice ?? item.priceAtAdd).toLocaleString()}</p>
                  {item.alertPrice !== null && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5">
                      <Bell className="h-3 w-3" />
                      Alert at ₦{item.alertPrice.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => handleAlertToggle(item)}
                    className={item.alertPrice !== null ? "text-orange-500" : "text-muted-foreground"}>
                    {item.alertPrice !== null ? <Bell className="h-4 w-4 fill-current" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-[#118C4C]"
                    onClick={() => { addToCart({ productId: item.productId, productName: item.productName, pricePerUnit: item.priceAtAdd, quantity: 1, image: item.image }); toast.success("Added to cart") }}>
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleRemove(item.productId)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
