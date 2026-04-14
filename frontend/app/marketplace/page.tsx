"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Filter, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { GridLayout } from "@/components/GridLayout";
import { Skeleton } from "@/components/Skeleton";
import type { Product } from "@/lib/types";
import { usePrivy } from "@privy-io/react-auth";
import { WeatherWidget } from "@/components/WeatherWidget";
import { useUser } from "@/lib/useUser";

const DEFAULT_CATEGORIES = [
  "All", "Vegetables", "Fruits", "Grains", "Tubers",
  "Legumes", "Poultry", "Livestock", "Seafood", "Spices", "Others",
];

const PAGE_SIZE = 12;

function MarketplacePage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const { authenticated } = usePrivy();
  const { currentUser } = useUser();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [selectedCategory, searchQuery]);

  const categories = useMemo(() => {
    const fromProducts = new Set(products.map((p) => p.category));
    return DEFAULT_CATEGORIES.filter((c) => c === "All" || fromProducts.has(c)).concat(
      [...fromProducts].filter((c) => !DEFAULT_CATEGORIES.includes(c))
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="h-2 w-12 bg-[#118C4C] rounded"></div>
            Marketplace
          </h1>
          <p className="text-muted-foreground">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : "Browse fresh products from local farmers"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {authenticated && (
            <Link href="/orders">
              <Button variant="outline" className="gap-2 flex items-center border-[#118C4C]/30 hover:bg-[#118C4C]/5">
                <PackageOpen />
                View My Orders
              </Button>
            </Link>
          )}
          {authenticated && (
            <Link href="/listing/new">
              <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 shadow-lg shadow-[#118C4C]/20">
                <Plus className="h-4 w-4" />
                List Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Weather Widget */}
      <WeatherWidget userId={currentUser?.id} />

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-[#118C4C]" />
          <span className="text-sm font-medium text-muted-foreground">Filter by category:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-md shadow-[#118C4C]/20"
                  : "bg-transparent hover:bg-[#118C4C]/10 border-[#118C4C]/30"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <GridLayout>
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </GridLayout>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No products found matching your search." : "No products available yet."}
          </p>
          {authenticated && (
            <Link href="/listing/new">
              <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-[#118C4C]/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={p === page ? "bg-[#118C4C] text-white" : "border-[#118C4C]/30"}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-[#118C4C]/30"
              >
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

export default MarketplacePage;
