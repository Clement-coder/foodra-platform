"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { usePrivy } from "@privy-io/react-auth"
import type { CartItem, Order } from "./types"
import { useUser } from "./useUser"
import { useToast } from "./toast"
import { authFetch } from "./authFetch"

// Cart abandonment: send reminder after 1 hour, then every 3 hours while cart is non-empty
const REMIND_INITIAL_MS = 60 * 60 * 1000   // 1 hour
const REMIND_REPEAT_MS  = 3 * 60 * 60 * 1000 // 3 hours

type CartContextValue = {
  cart: CartItem[]
  cartCount: number
  addToCart: (item: CartItem | { id: string; productName: string; pricePerUnit: number; quantity: number; image: string }) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => void
  totalAmount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const { currentUser, isLoading: userLoading } = useUser()
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()
  const abandonTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const cartKey = currentUser ? `foodra_cart_${currentUser.id}` : null

  const sendAbandonmentReminder = async (cartItems: CartItem[]) => {
    if (!cartItems.length) return
    const items = cartItems.map(i => ({ name: i.productName, qty: i.quantity, price: i.pricePerUnit }))
    const total = cartItems.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0)
    authFetch(getAccessToken, "/api/cart/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, total }),
    }).catch(() => {})
  }

  // Start/reset abandonment timers whenever cart changes
  useEffect(() => {
    if (abandonTimer.current) clearTimeout(abandonTimer.current)
    if (repeatTimer.current) clearInterval(repeatTimer.current)

    if (!cart.length || !currentUser) return

    abandonTimer.current = setTimeout(() => {
      sendAbandonmentReminder(cart)
      repeatTimer.current = setInterval(() => sendAbandonmentReminder(cart), REMIND_REPEAT_MS)
    }, REMIND_INITIAL_MS)

    return () => {
      if (abandonTimer.current) clearTimeout(abandonTimer.current)
      if (repeatTimer.current) clearInterval(repeatTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, currentUser])

  // Load cart when user resolves — don't clear while auth is still loading
  useEffect(() => {
    if (userLoading) return
    if (cartKey) {
      const stored = localStorage.getItem(cartKey)
      setCart(stored ? JSON.parse(stored) : [])
    } else {
      setCart([])
    }
  }, [cartKey, userLoading])

  const persist = (updated: CartItem[]) => {
    if (cartKey) localStorage.setItem(cartKey, JSON.stringify(updated))
  }

  const addToCart: CartContextValue["addToCart"] = async (item) => {
    if (!cartKey) return
    const normalizedItem: CartItem = "productId" in item
      ? item
      : {
          productId: item.id,
          productName: item.productName,
          pricePerUnit: item.pricePerUnit,
          quantity: item.quantity || 1,
          image: item.image,
        }

    // Check live stock before adding
    try {
      const res = await fetch(`/api/products/${normalizedItem.productId}`)
      if (res.ok) {
        const product = await res.json()
        if (!product || product.quantity < 1) {
          toast.error(`"${normalizedItem.productName}" is out of stock.`)
          return
        }
        setCart((prev) => {
          const existing = prev.find((i) => i.productId === normalizedItem.productId)
          const currentQty = existing?.quantity || 0
          if (currentQty >= product.quantity) {
            toast.error(`Only ${product.quantity} unit(s) available.`)
            return prev
          }
          const updated = existing
            ? prev.map((i) => i.productId === normalizedItem.productId ? { ...i, quantity: i.quantity + 1 } : i)
            : [...prev, { ...normalizedItem, quantity: 1 }]
          persist(updated)
          window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: normalizedItem.productId, change: 1 } }))
          return updated
        })
        toast.success(`"${normalizedItem.productName}" added to cart`)
      }
    } catch {
      toast.error("Could not verify stock. Please try again.")
    }
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId)
      const updated = prev.filter((i) => i.productId !== productId)
      persist(updated)
      if (item) {
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId, change: -item.quantity } }))
        toast.info(`"${item.productName}" removed from cart`)
      }
      return updated
    })
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    // Check stock before incrementing
    const item = cart.find((i) => i.productId === productId)
    if (!item) return
    const oldQuantity = item.quantity
    if (quantity > oldQuantity) {
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (res.ok) {
          const product = await res.json()
          if (quantity > product.quantity) {
            toast.error(`Only ${product.quantity} ${product.unit || 'unit'}(s) available.`)
            return
          }
        }
      } catch { /* allow optimistically */ }
    }
    setCart((prev) => {
      const change = quantity - (prev.find((i) => i.productId === productId)?.quantity || 0)
      const updated = prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      persist(updated)
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId, change } }))
      return updated
    })
  }

  const clearCart = () => {
    setCart([])
    if (cartKey) localStorage.removeItem(cartKey)
    toast.info("Cart cleared.")
  }

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])
  const totalAmount = cart.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export function useOrders() {
  const { getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      fetchOrders()
    } else {
      setLoading(false)
    }
  }, [currentUser])

  const fetchOrders = async () => {
    if (!currentUser) return

    try {
      const res = await authFetch(getAccessToken, `/api/orders?userId=${currentUser.id}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (items: CartItem[], totalAmount: number) => {
    if (!currentUser) return null

    try {
      const res = await authFetch(getAccessToken, '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          totalAmount,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || body?.message || `Failed to create order (${res.status})`)
      }

      const order = await res.json()
      await fetchOrders()
      return order
    } catch (error) {
      console.error('Error creating order:', error)
      return null
    }
  }

  return {
    orders,
    loading,
    createOrder,
    refreshOrders: fetchOrders,
  }
}
