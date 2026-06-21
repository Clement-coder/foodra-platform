"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, PackageOpen, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { GridLayout } from "@/components/GridLayout";
import { ProductCardSkeleton } from "@/components/Skeleton";
import { FilterPanel, DEFAULT_FILTERS, type SearchFilters } from "@/components/AdvancedSearchFilters";
import { t } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { usePrivy } from "@privy-io/react-auth";
import { WeatherWidget } from "@/components/WeatherWidget";
import { useUser } from "@/lib/useUser";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "All", "Vegetables", "Fruits", "Grains", "Tubers",
  "Legumes", "Poultry", "Livestock", "Seafood", "Spices", "Others",
];

const PAGE_SIZE = 12;

function MarketplacePage() {
  const { authenticated } = usePrivy();
  const { currentUser } = useUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [filters]);

  const locations = useMemo(() => {
    const locs = new Set(products.map((p) => p.location).filter(Boolean));
    return [...locs].sort() as string[];
  }, [products]);

  const extraCategories = useMemo(() => {
    const fromProducts = new Set(products.map((p) => p.category));
    return [...fromProducts].filter((c) => !DEFAULT_CATEGORIES.includes(c));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = filters.search.toLowerCase();
      return (
        (filters.category === "All" || p.category === filters.category) &&
        (!q || p.productName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
        (filters.minPrice === null || p.pricePerUnit >= filters.minPrice) &&
        (filters.maxPrice === null || p.pricePerUnit <= filters.maxPrice) &&
        (filters.location === "" || p.location === filters.location) &&
        (filters.unit === "" || p.unit === filters.unit) &&
        (!filters.inStockOnly || p.quantity > 0) &&
        (!filters.verifiedOnly || p.farmerIsVerified === true)
      );
    });
    if (filters.sortBy === "price_asc") result = result.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    else if (filters.sortBy === "price_desc") result = result.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    else if (filters.sortBy === "name_asc") result = result.sort((a, b) => a.productName.localeCompare(b.productName));
    else if (filters.sortBy === "popular") result = result.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    return result;
  }, [products, filters]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 flex items-center gap-3">
              <div className="h-2 w-10 sm:w-12 bg-[#118C4C] rounded shrink-0"></div>
              {t("marketplace.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filters.search
                ? `${t("marketplace.searchResults")} "${filters.search}"`
                : t("marketplace.subtitle")}
            </p>
          </div>
          {/* Filter button — always visible top-right on mobile */}
          <div className="shrink-0 mt-1">
            <FilterPanel
              open={panelOpen}
              onOpenChange={setPanelOpen}
              filters={filters}
              onChange={setFilters}
              locations={locations}
              extraCategories={extraCategories}
            />
          </div>
        </div>

        {/* Secondary actions — wrap on small screens */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/wishlist" aria-label="Wishlist">
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </Button>
          </Link>
          {authenticated && (
            <Link href="/orders">
              <Button variant="outline" size="sm" className="gap-1.5 border-[#118C4C]/30 hover:bg-[#118C4C]/5">
                <PackageOpen className="h-4 w-4" />
                <span className="hidden xs:inline">My Orders</span>
                <span className="xs:hidden">Orders</span>
              </Button>
            </Link>
          )}
          {currentUser?.role === "admin" || currentUser?.role === "owner" ? (
            <Link href="/listing/new">
              <Button size="sm" className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5 shadow-md shadow-[#118C4C]/20">
                <Plus className="h-4 w-4" />
                <span>List Product</span>
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Weather Widget */}
      <details className="mb-6 group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 list-none select-none w-fit">
          <span className="group-open:hidden">▶</span>
          <span className="hidden group-open:inline">▼</span>
          Weather & Crop Advisory
        </summary>
        <div className="mt-3">
          <WeatherWidget userId={currentUser?.id} />
        </div>
      </details>

      {/* Active filter chips */}
      {(filters.category !== "All" || filters.search || filters.location || filters.unit || filters.minPrice || filters.maxPrice || filters.sortBy !== "newest" || filters.inStockOnly || filters.verifiedOnly) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.category !== "All" && (
            <Chip label={filters.category} onRemove={() => setFilters((f) => ({ ...f, category: "All" }))} />
          )}
          {filters.search && (
            <Chip label={`"${filters.search}"`} onRemove={() => setFilters((f) => ({ ...f, search: "" }))} />
          )}
          {filters.location && (
            <Chip label={filters.location} onRemove={() => setFilters((f) => ({ ...f, location: "" }))} />
          )}
          {filters.unit && (
            <Chip label={`Unit: ${filters.unit}`} onRemove={() => setFilters((f) => ({ ...f, unit: "" }))} />
          )}
          {(filters.minPrice !== null || filters.maxPrice !== null) && (
            <Chip
              label={`₦${filters.minPrice ?? 0} – ${filters.maxPrice ? `₦${filters.maxPrice}` : "∞"}`}
              onRemove={() => setFilters((f) => ({ ...f, minPrice: null, maxPrice: null }))}
            />
          )}
          {filters.sortBy !== "newest" && (
            <Chip
              label={{ price_asc: "Price ↑", price_desc: "Price ↓", name_asc: "A–Z", popular: "Most Viewed" }[filters.sortBy]!}
              onRemove={() => setFilters((f) => ({ ...f, sortBy: "newest" }))}
            />
          )}
          {filters.inStockOnly && (
            <Chip label="In Stock" onRemove={() => setFilters((f) => ({ ...f, inStockOnly: false }))} />
          )}
          {filters.verifiedOnly && (
            <Chip label="Verified Farmers" onRemove={() => setFilters((f) => ({ ...f, verifiedOnly: false }))} />
          )}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <GridLayout>
          {[...Array(PAGE_SIZE)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </GridLayout>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#118C4C]/10 mb-6">
            <svg viewBox="0 0 64 64" className="w-12 h-12 text-[#118C4C]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M32 8 C20 8 12 18 12 28 C12 42 32 56 32 56 C32 56 52 42 52 28 C52 18 44 8 32 8Z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 28 C24 24 27.6 20 32 20 C36.4 20 40 24 40 28" strokeLinecap="round"/>
              <path d="M20 36 Q32 44 44 36" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {filters.search ? `No results for "${filters.search}"` : "No products yet"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {filters.search
              ? "Try a different search term or clear your filters."
              : "Be the first to list a product and reach buyers across Africa."}
          </p>
          {currentUser?.role === "admin" && !filters.search && (
            <Link href="/listing/new">
              <Button size="lg" className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 shadow-lg shadow-[#118C4C]/20 px-8">
                <Plus className="h-5 w-5" />
                List Your First Product
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <GridLayout>
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </GridLayout>
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-[#118C4C]/30">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {(() => {
                const pages: (number | "...")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("...");
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                  if (page < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }
                return pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                  ) : (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p as number)} className={p === page ? "bg-[#118C4C] text-white" : "border-[#118C4C]/30"}>
                      {p}
                    </Button>
                  )
                );
              })()}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-[#118C4C]/30">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-3">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
          </p>
        </>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-[#0d6d3a]" aria-label="Remove filter">
        ×
      </button>
    </span>
  );
}

export default MarketplacePage;
