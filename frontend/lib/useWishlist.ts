"use client"

import { useState, useEffect } from "react"
import { getWishlist, type WishlistItem } from "@/lib/wishlist"

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    setItems(getWishlist())
    const handler = () => setItems(getWishlist())
    window.addEventListener("wishlistchange", handler)
    return () => window.removeEventListener("wishlistchange", handler)
  }, [])

  return { items, count: items.length }
}
