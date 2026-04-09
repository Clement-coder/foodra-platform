"use client";

import { usePrivy } from "@privy-io/react-auth";
import type React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingCart, Search, Wallet, Users, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ProfileDropdown from "./ProfileDropdown";
import SignupButton from "./SignupButton";
import { useCart } from "@/lib/useCart";
import { useUser } from "@/lib/useUser";
import { useNotifications } from "@/lib/useNotifications";
import { NotificationSidebar } from "./NotificationSidebar";
import type { Product, User } from "@/lib/types";

type SearchFilter = "all" | "products" | "users";

type SearchSuggestion = {
  id: string;
  type: "product" | "user";
  title: string;
  subtitle: string;
  href: string;
};

export function NavBar() {
  const RECENT_SEARCHES_KEY = "foodra_recent_searches";
  const MAX_RECENT_SEARCHES = 6;
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { currentUser, isLoading } = useUser();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markRead } = useNotifications(currentUser?.id);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [hasLoadedSuggestions, setHasLoadedSuggestions] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsed = stored ? (JSON.parse(stored) as string[]) : [];
      if (Array.isArray(parsed)) setRecentSearches(parsed.filter(Boolean));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const persistRecentSearches = (next: string[]) => {
    setRecentSearches(next);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors in private mode/quota limits
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (term) {
      const deduped = [term, ...recentSearches.filter((item) => item.toLowerCase() !== term.toLowerCase())]
        .slice(0, MAX_RECENT_SEARCHES);
      persistRecentSearches(deduped);
      router.push(`/search?q=${encodeURIComponent(term)}`);
      setIsSearchOpen(false);
    }
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setIsSearchOpen(false);
  };

  const clearRecentSearches = () => {
    persistRecentSearches([]);
  };

  useEffect(() => {
    if (!isSearchOpen || hasLoadedSuggestions) return;

    const fetchSuggestionsData = async () => {
      setIsSuggestionsLoading(true);
      try {
        const [productsRes, usersRes] = await Promise.all([fetch("/api/products"), fetch("/api/users")]);
        const productsData = productsRes.ok ? await productsRes.json() : [];
        const usersData = usersRes.ok ? await usersRes.json() : [];
        setProducts(Array.isArray(productsData) ? productsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error("Failed to load search suggestions:", error);
      } finally {
        setIsSuggestionsLoading(false);
        setHasLoadedSuggestions(true);
      }
    };

    fetchSuggestionsData();
  }, [isSearchOpen, hasLoadedSuggestions]);

  const filteredSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [] as SearchSuggestion[];

    const productMatches: SearchSuggestion[] = products
      .filter(
        (product) =>
          product.productName.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.farmerName.toLowerCase().includes(query)
      )
      .map((product) => ({
        id: `product-${product.id}`,
        type: "product",
        title: product.productName,
        subtitle: `${product.category} • ${product.location || "Unknown location"}`,
        href: `/marketplace/${product.id}`,
      }));

    const userMatches: SearchSuggestion[] = users
      .filter(
        (user) =>
          (user.name || "").toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query) ||
          (user.location || "").toLowerCase().includes(query)
      )
      .map((user) => ({
        id: `user-${user.id}`,
        type: "user",
        title: user.name || "Unknown user",
        subtitle: user.email || user.location || "View profile",
        href: `/users/${user.id}`,
      }));

    const combined =
      searchFilter === "products"
        ? productMatches
        : searchFilter === "users"
          ? userMatches
          : [...productMatches, ...userMatches];

    return combined.slice(0, 8);
  }, [searchQuery, products, users, searchFilter]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const term = searchQuery.trim();
    if (term) {
      const deduped = [term, ...recentSearches.filter((item) => item.toLowerCase() !== term.toLowerCase())]
        .slice(0, MAX_RECENT_SEARCHES);
      persistRecentSearches(deduped);
    }
    router.push(suggestion.href);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full p-3 bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <span className="flex items-center gap-2">
            <a
              href="/"
              className="flex items-center space-x-2 text-2xl font-bold text-[#118C4C] hover:opacity-80 transition-opacity"
            >
              <img
                src="/foodra_logo.jpeg"
                alt="Foodra Logo"
                className="h-10 rounded-bl-xl rounded-tr-2xl"
              />
            </a>
            <span className="font-bold lg:flex hidden text-green-800 text-xl">
              FOODRA
            </span>
          </span>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="search"
                placeholder="Search anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
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

            {/* Notifications bell */}
            {authenticated && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth buttons */}
            {authenticated && currentUser && !isLoading ? (
              <>
                {/* Mobile: avatar link to profile */}
                <a href="/profile" className="md:hidden flex-shrink-0">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border-2 border-[#118C4C]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#118C4C] flex items-center justify-center text-white text-sm font-bold border-2 border-[#118C4C]">
                      {(currentUser.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                </a>
                {/* Desktop: full dropdown */}
                <div className="hidden md:block">
                  <ProfileDropdown user={currentUser} />
                </div>
              </>
            ) : (
              <SignupButton />
            )}
          </div>
        </div>

          <form
            onSubmit={handleSearch}
            className="md:hidden pb-2 pt-1"
          >
            <div>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="search"
                  placeholder="Search anything"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
                  aria-label="Search anything"
                />
              </div>
            </div>
          </form>
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="mt-16 w-full max-w-2xl rounded-2xl border border-border/50 bg-card/95 shadow-2xl"
            >
              <form onSubmit={handleSearch} className="p-4 sm:p-5">
                <label htmlFor="navbar-modal-search" className="sr-only">
                  Search anything
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="navbar-modal-search"
                    type="search"
                    autoFocus
                    placeholder="Search products, users, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 rounded-xl border border-input bg-background pl-12 pr-24 text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
                    aria-label="Search anything"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-lg bg-[#118C4C] text-white text-sm font-medium hover:bg-[#0d6d3a] transition-colors"
                  >
                    Search
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Press <kbd className="rounded border border-border px-1.5 py-0.5">Esc</kbd> to close
                </p>

                <div className="mt-4 flex items-center gap-2">
                  {(["all", "products", "users"] as SearchFilter[]).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSearchFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                        searchFilter === filter
                          ? "bg-[#118C4C] text-white"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {searchQuery.trim().length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                      Matching Results
                    </p>

                    {isSuggestionsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : filteredSuggestions.length > 0 ? (
                      <div className="space-y-2">
                        {filteredSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-left hover:bg-accent/60 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground truncate">{suggestion.title}</p>
                              <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                {suggestion.type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">{suggestion.subtitle}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No matches found. Try a different keyword.</p>
                    )}
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recent Searches
                      </p>
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleRecentSearchClick(term)}
                          className="px-3 py-1.5 rounded-full bg-muted text-foreground text-sm hover:bg-[#118C4C]/15 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NotificationSidebar
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
      />
    </>
  );
}
