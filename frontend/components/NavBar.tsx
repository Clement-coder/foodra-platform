"use client";

import { usePrivy } from "@privy-io/react-auth";
import type React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, Search, Wallet, Users } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import SignupButton from "./SignupButton";
import { useCart } from "@/lib/useCart";
import { useUser } from "@/lib/useUser";

export function NavBar() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { currentUser, isLoading } = useUser();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full p-3 bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <span className="flex items-center gap-4">
            
            <a
              href="/"
              className="flex items-center space-x-2 text-2xl font-bold text-[#118C4C] hover:opacity-80  mb-3 transition-opacity"
            >

              <img
                src="/foodra_logo.jpeg"
                alt="Foodra Logo"
                className="h-16 rounded-bl-2xl rounded-tr-3xl"
              />
            </a>

            <span className="font-bold lg:flex hidden text-green-800 text-2xl">
              FOODRA
            </span>
          </span>

          {/* Search bar - hidden on mobile */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="search"
                placeholder="Search anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
                aria-label="Search anything"
              />
            </div>
          </form>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart indicator */}
            <a
              href="/shop"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors md:flex items-center space-x-2"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-6 w-6 text-foreground" />
              <span className="hidden md:inline text-sm font-medium">
                Shop
              </span>
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
                <Wallet className="h-6 w-6" />
                <span className="hidden md:inline text-sm font-medium">
                  Wallet
                </span>
              </a>
            )}

            {/* Users Link */}
            <a
              href="/users"
              className="p-2 hover:bg-accent rounded-lg transition-colors md:flex items-center space-x-2"
              aria-label="Explore users"
            >
              <Users className="h-6 w-6 text-foreground" />
              <span className="hidden md:inline text-sm font-medium">
                Users
              </span>
            </a>

            {/* Auth buttons */}
            {authenticated && currentUser && !isLoading ? (
              <ProfileDropdown user={currentUser} />
            ) : (
              <SignupButton />
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="search"
              placeholder="Search anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
              aria-label="Search anything"
            />
          </div>
        </form>
      </div>
    </nav>
  );
}