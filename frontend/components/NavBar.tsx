"use client";

import { usePrivy } from "@privy-io/react-auth";
import type React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingCart, Search, Wallet, Users, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ProfileDropdown from "./ProfileDropdown";
import SignupButton from "./SignupButton";
import ThemeToggle from "./ThemeToggle";
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
      {/* Fixed navbar — covers status bar area on PWA */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/60"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center justify-between px-3 md:px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/foodra_logo.jpeg" alt="Foodra" className="h-8 w-8 rounded-lg rounded-bl-xl rounded-tr-2xl object-cover" />
            <span className="font-bold text-[#118C4C] text-base tracking-tight hidden sm:block">FOODRA</span>
          </a>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Mobile search icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-foreground" />
            </button>

            {/* Cart */}
            <a href="/shop" className="relative p-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5" aria-label="Shop">
              <ShoppingCart className="h-5 w-5 text-foreground" />
              <span className="hidden md:inline text-sm font-medium">Shop</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#118C4C] text-white text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </a>

            {/* Wallet */}
            {authenticated && (
              <a href="/wallet" className="p-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
                <Wallet className="h-5 w-5" />
                <span className="hidden md:inline text-sm font-medium">Wallet</span>
              </a>
            )}

            {/* Notifications */}
            {authenticated && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Avatar / Auth */}
            {authenticated && currentUser && !isLoading ? (
              <>
                <a href="/profile" className="md:hidden flex-shrink-0 ml-1">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#118C4C]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#118C4C] flex items-center justify-center text-white text-xs font-bold border-2 border-[#118C4C]">
                      {(currentUser.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                </a>
                <div className="hidden md:block ml-1">
                  <ProfileDropdown user={currentUser} />
                </div>
              </>
            ) : (
              <SignupButton />
            )}
          </div>
        </div>
      </nav>

      {/* Search modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm p-4 flex items-start justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="mt-16 w-full max-w-2xl rounded-2xl border border-border/50 bg-card/95 shadow-2xl"
            >
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="navbar-modal-search" type="search" autoFocus
                    placeholder="Search products, users, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 rounded-xl border border-input bg-background pl-11 pr-20 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] transition-shadow"
                  />
                  <button type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-[#118C4C] text-white text-xs font-medium hover:bg-[#0d6d3a] transition-colors">
                    Search
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Press <kbd className="rounded border border-border px-1 py-0.5">Esc</kbd> to close
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {(["all", "products", "users"] as SearchFilter[]).map((filter) => (
                    <button key={filter} type="button" onClick={() => setSearchFilter(filter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                        searchFilter === filter ? "bg-[#118C4C] text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}>
                      {filter}
                    </button>
                  ))}
                </div>

                {searchQuery.trim().length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Results</p>
                    {isSuggestionsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                      </div>
                    ) : filteredSuggestions.length > 0 ? (
                      <div className="space-y-1.5">
                        {filteredSuggestions.map((s) => (
                          <button key={s.id} type="button" onClick={() => handleSuggestionClick(s)}
                            className="w-full rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-left hover:bg-accent/60 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s.type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{s.subtitle}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No matches found.</p>
                    )}
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent</p>
                      <button type="button" onClick={clearRecentSearches} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button key={term} type="button" onClick={() => handleRecentSearchClick(term)}
                          className="px-3 py-1 rounded-full bg-muted text-foreground text-xs hover:bg-[#118C4C]/15 transition-colors">
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

      <NotificationSidebar open={notifOpen} onClose={() => setNotifOpen(false)} notifications={notifications} onMarkRead={markRead} />
    </>
  );
}
