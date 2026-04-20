"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { addToWishlist, removeFromWishlist, isInWishlist } from "@/lib/wishlist"

interface Props {
  productId: string
  productName: string
  image: string
  pricePerUnit: number
  className?: string
}

export function WishlistButton({ productId, productName, image, pricePerUnit, className = "" }: Props) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(isInWishlist(productId))
    const handler = () => setSaved(isInWishlist(productId))
    window.addEventListener("wishlistchange", handler)
    return () => window.removeEventListener("wishlistchange", handler)
  }, [productId])

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (saved) {
      removeFromWishlist(productId)
    } else {
      addToWishlist({ productId, productName, image, priceAtAdd: pricePerUnit, alertPrice: null })
    }
    setSaved(!saved)
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className={`p-1.5 rounded-full transition-colors ${saved ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-muted-foreground hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"} ${className}`}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  )
}
