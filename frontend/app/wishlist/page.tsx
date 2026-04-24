"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, Trash2, Bell, BellOff, ShoppingCart, Check, X, ArrowLeft } from "lucide-react"
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
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [alertInputId, setAlertInputId] = useState<string | null>(null)
  const [alertInputValue, setAlertInputValue] = useState("")
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  const handleRemove = async (productId: string) => {
    if (currentUser?.id) {
      await authFetch(getAccessToken, `/api/wishlist?productId=${productId}`, { method: "DELETE" })
    } else {
      removeFromWishlist(productId)
    }
    toast.success("Removed from wishlist")
    await refresh()
  }

  const openAlertInput = (item: WishlistItem) => {
    setAlertInputId(item.productId)
    setAlertInputValue(item.alertPrice !== null ? String(item.alertPrice) : "")
  }

  const saveAlert = async (productId: string, remove = false) => {
    const price = remove ? null : Number(alertInputValue)
    if (!remove && (isNaN(price!) || price! <= 0)) {
      toast.error("Enter a valid price")
      return
    }
    if (currentUser?.id) {
      await authFetch(getAccessToken, "/api/wishlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, alertPrice: price }),
      })
    } else {
      setAlertPrice(productId, price)
    }
    toast.success(remove ? "Price alert removed" : `Alert set at ₦${price!.toLocaleString()}`)
    setAlertInputId(null)
    await refresh()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-7 w-7 text-red-500 fill-current" />
        <h1 className="text-3xl font-bold text-foreground">Wishlist</h1>
        <span className="ml-auto text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        <Link href="/orders">
          <button className="text-xs border border-[#118C4C]/40 text-[#118C4C] px-3 py-1.5 rounded-lg hover:bg-[#118C4C]/10 transition-colors">View Orders</button>
        </Link>
        <Link href="/listing/new">
          <button className="text-xs bg-[#118C4C] text-white px-3 py-1.5 rounded-lg hover:bg-[#0d6d3a] transition-colors">+ List Product</button>
        </Link>
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
              <CardContent className="p-4 flex gap-4 items-start">
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

                  {/* Alert display */}
                  {item.alertPrice !== null && alertInputId !== item.productId && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1">
                      <Bell className="h-3 w-3" />
                      Alert when price drops to ₦{item.alertPrice.toLocaleString()}
                    </p>
                  )}

                  {/* Inline alert input */}
                  {alertInputId === item.productId && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-muted-foreground">₦</span>
                      <input
                        type="number"
                        min="1"
                        autoFocus
                        value={alertInputValue}
                        onChange={(e) => setAlertInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveAlert(item.productId); if (e.key === "Escape") setAlertInputId(null); }}
                        placeholder="Alert price"
                        className="w-28 px-2 py-1 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                      />
                      <button onClick={() => saveAlert(item.productId)} className="p-1 rounded-lg bg-[#118C4C] text-white hover:bg-[#0d6d3a]">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setAlertInputId(null)} className="p-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {item.alertPrice !== null && (
                        <button onClick={() => saveAlert(item.productId, true)} className="text-xs text-red-500 hover:underline ml-1">
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openAlertInput(item)}
                    title={item.alertPrice !== null ? "Edit price alert" : "Set price alert"}
                    className={item.alertPrice !== null ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"}
                  >
                    {item.alertPrice !== null ? <Bell className="h-4 w-4 fill-current" /> : <BellOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-[#118C4C]"
                    title="Add to cart"
                    onClick={() => {
                      addToCart({ productId: item.productId, productName: item.productName, pricePerUnit: item.priceAtAdd, quantity: 1, image: item.image })
                      toast.success("Added to cart")
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500" title="Remove" onClick={() => handleRemove(item.productId)}>
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
