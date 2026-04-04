"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { CartItem, Order } from "./types"
import { useUser } from "./useUser"
import { useToast } from "./toast"

type CartContextValue = {
  cart: CartItem[]
  cartCount: number
  addToCart: (item: CartItem | { id: string; productName: string; pricePerUnit: number; quantity: number; image: string }) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalAmount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const { currentUser, isLoading: userLoading } = useUser()
  const { toast } = useToast()

  const cartKey = currentUser ? `foodra_cart_${currentUser.id}` : null

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

  const addToCart: CartContextValue["addToCart"] = (item) => {
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

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === normalizedItem.productId)
      const updated = existing
        ? prev.map((i) =>
            i.productId === normalizedItem.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        : [...prev, { ...normalizedItem, quantity: 1 }]
      persist(updated)
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { productId: normalizedItem.productId, change: 1 } }))
      return updated
    })
    toast.success(`"${normalizedItem.productName}" added to cart`)
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

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId)
      const oldQuantity = item?.quantity || 0
      const change = quantity - oldQuantity
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
      const res = await fetch(`/api/orders?userId=${currentUser.id}`)
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (items: CartItem[], totalAmount: number) => {
    if (!currentUser) return null

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          items,
          totalAmount,
        }),
      })

      if (!res.ok) throw new Error('Failed to create order')

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
