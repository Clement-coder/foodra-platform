"use client"

import { usePrivy } from "@privy-io/react-auth"
import type React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ShoppingCart, Search, Wallet } from "lucide-react"
import ProfileDropdown from "./ProfileDropdown"
import SignupButton from "./SignupButton"
import { loadFromLocalStorage } from "@/lib/localStorage" // Assuming loadFromLocalStorage is still used for cart

// Type definition for CartItem (if not already defined and used elsewhere consistently)
interface CartItem {
  productId: string;
  productName: string;
  pricePerUnit: number;
  quantity: number;
  image: string;
}

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { authenticated, user, login } = usePrivy()
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Determine the correct cart key based on authentication status
    const cartKey = authenticated && user ? `foodra_cart_${user.id}` : "foodra_cart_guest";

    // Load cart count
    const currentCart = loadFromLocalStorage<CartItem[]>(cartKey, []);
    setCartCount(currentCart.length);

    // Listen for cart updates
    const handleStorage = () => {
      const updatedCart = loadFromLocalStorage<CartItem[]>(cartKey, []);
      setCartCount(updatedCart.length);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cartUpdated", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cartUpdated", handleStorage);
    };
  }, [pathname, authenticated, user]); // Depend on authenticated and user to update cart based on login state

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center space-x-2 text-2xl font-bold text-[#118C4C] hover:opacity-80 transition-opacity"
          >
            <span>🍽️</span>
            <span>Foodra</span>
          </a>

          {/* Search bar - hidden on mobile */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-8 relative"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
              aria-label="Search anything"
            />
          </form>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart indicator */}
            <a
              href="/shop"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors md:flex items-center space-x-2"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart
                className="h-6 w-6 text-foreground"
              />
              <span className="hidden md:inline text-sm font-medium">Shop</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#118C4C] text-white text-xs flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
            </a>

            {/* Wallet Link */}
            {authenticated && (
              <a
                href="/wallet"
                className="p-2 hover:bg-accent rounded-lg transition-colors md:flex items-center space-x-2"
              >
                <Wallet
                  className="h-6 w-6"
                />
                <span className="hidden md:inline text-sm font-medium">Wallet</span>
              </a>
            )}

            {/* Auth buttons */}
            {authenticated && user ? (
              <ProfileDropdown user={user} />
            ) : (
              <SignupButton />
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <form
          onSubmit={handleSearch}
          className="md:hidden pb-4 relative"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
            aria-label="Search anything"
          />
        </form>
      </div>
    </nav>
  )
}