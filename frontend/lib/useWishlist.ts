"use client"

import { useState, useEffect } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { getWishlist, type WishlistItem } from "@/lib/wishlist"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"

export function useWishlist() {
  const { getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const [items, setItems] = useState<WishlistItem[]>([])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (currentUser?.id) {
        const res = await authFetch(getAccessToken, "/api/wishlist")
        if (mounted && res.ok) {
          setItems(await res.json())
          return
        }
      }
      if (mounted) setItems(getWishlist())
    }

    load()
    const handler = () => setItems(getWishlist())
    window.addEventListener("wishlistchange", handler)
    return () => {
      mounted = false
      window.removeEventListener("wishlistchange", handler)
    }
  }, [currentUser?.id, getAccessToken])

  return { items, count: items.length }
}
