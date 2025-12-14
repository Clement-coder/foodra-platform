"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingCart, Search, User, Wallet } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"
import type { User as UserType, CartItem } from "@/lib/types"
import { demoUser } from "@/lib/sampleData"

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserType | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

useEffect(() => {
  // Load user from localStorage
  const storedUser = loadFromLocalStorage<UserType | null>("foodra_user", null)
  setUser(storedUser)

  // Load cart count
  const cart = loadFromLocalStorage<CartItem[]>("foodra_cart", [])
  setCartCount(cart?.length || 0)

  // Listen for cart updates
  const handleStorage = () => {
    const updatedCart = loadFromLocalStorage<CartItem[]>("foodra_cart", [])
    setCartCount(updatedCart?.length || 0)
  }

  window.addEventListener("storage", handleStorage)
  // Custom event for same-page cart updates
  window.addEventListener("cartUpdated", handleStorage)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener("cartUpdated", handleStorage)
  }
}, [pathname])


  const handleSignIn = () => {
    // Simulate Privy login by saving demo user to localStorage
    saveToLocalStorage("foodra_user", demoUser)
    setUser(demoUser)
    router.push("/profile")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 bg-card border-b border-border shadow-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-[#118C4C]">Foodra</h1>
          </Link>

          {/* Search bar - hidden on mobile */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                aria-label="Search products"
              />
            </div>
          </form>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Cart indicator */}
            <Link
              href="/shop"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#118C4C] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Wallet Link */}
            <Link
              href="/wallet"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Wallet"
            >
              <Wallet className="h-5 w-5 text-foreground" />
            </Link>

            {/* Auth buttons */}
            {user ? (
              <Link href="/profile">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </Link>
            ) : (
              <Button onClick={handleSignIn} size="sm" className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
                <span className="hidden sm:inline">Sign in with Privy</span>
                <span className="sm:hidden">Sign in</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
              aria-label="Search products"
            />
          </div>
        </form>
      </div>
    </motion.nav>
  )
}
