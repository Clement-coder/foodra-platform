"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { CartItem, Order } from "./types"
import { useUser } from "./useUser"

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

  useEffect(() => {
    const stored = localStorage.getItem("foodra_cart")
    if (stored) {
      setCart(JSON.parse(stored))
    }
  }, [])

  const addToCart: CartContextValue["addToCart"] = (item) => {
    const normalizedItem: CartItem = "productId" in item
      ? item
      : {
          productId: item.id,
          productName: item.productName,
          pricePerUnit: item.pricePerUnit,
          quantity: item.quantity,
          image: item.image,
        }

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === normalizedItem.productId)
      const updated = existing
        ? prev.map((i) =>
            i.productId === normalizedItem.productId
              ? { ...i, quantity: i.quantity + normalizedItem.quantity }
              : i
          )
        : [...prev, normalizedItem]
      localStorage.setItem("foodra_cart", JSON.stringify(updated))
      return updated
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.productId !== productId)
      localStorage.setItem("foodra_cart", JSON.stringify(updated))
      return updated
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const updated = prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      localStorage.setItem("foodra_cart", JSON.stringify(updated))
      return updated
    })
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem("foodra_cart")
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
