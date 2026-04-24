"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"
import { useToast } from "@/lib/toast"

interface Props {
  productId: string
  productName: string
  image: string
  pricePerUnit: number
  className?: string
}

export function WishlistButton({ productId, productName, image, pricePerUnit, className = "" }: Props) {
  const { getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (currentUser?.id) {
        const res = await authFetch(getAccessToken, "/api/wishlist")
        if (mounted && res.ok) {
          const items = await res.json()
          setSaved(Array.isArray(items) && items.some((item: { productId: string }) => item.productId === productId))
          return
        }
      }
      if (mounted) setSaved(isInWishlist(productId))
    }
    load()
    const handler = () => setSaved(isInWishlist(productId))
    window.addEventListener("wishlistchange", handler)
    return () => {
      mounted = false
      window.removeEventListener("wishlistchange", handler)
    }
  }, [currentUser?.id, getAccessToken, productId])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !saved
    if (currentUser?.id) {
      if (saved) {
        await authFetch(getAccessToken, `/api/wishlist?productId=${productId}`, { method: "DELETE" })
      } else {
        await authFetch(getAccessToken, "/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
      }
    } else {
      if (saved) {
        removeFromWishlist(productId)
      } else {
        addToWishlist({ productId, productName, image, priceAtAdd: pricePerUnit, currentPrice: pricePerUnit, alertPrice: null })
      }
    }
    setSaved(next)
    toast[next ? "success" : "info"](next ? `${productName} added to wishlist` : `${productName} removed from wishlist`)
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-1.5 rounded-full transition-all ${saved ? "text-red-500 bg-red-50 dark:bg-red-950/30 scale-110" : "text-muted-foreground hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"} ${className}`}
    >
      <Heart className={`h-4 w-4 transition-transform ${saved ? "fill-current scale-110" : ""}`} />
    </button>
  )
}
