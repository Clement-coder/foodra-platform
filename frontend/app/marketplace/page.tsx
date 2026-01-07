"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Filter, PackageOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { GridLayout } from "@/components/GridLayout";
import { Skeleton } from "@/components/Skeleton";
import type { Product } from "@/lib/types";
import withAuth from "../../components/withAuth";
import { loadFromLocalStorage } from "@/lib/localStorage";
import { usePrivy } from "@privy-io/react-auth";

function MarketplacePage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const { authenticated } = usePrivy();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    // Load products from localStorage
    const storedProducts = loadFromLocalStorage<Product[]>("foodra_products", []);
    setProducts(storedProducts);
    setLoading(false);
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(products.map((p) => p.category))];
    return cats;
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
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
              <Button variant="outline" className="gap-2 flex items-center ">
                <PackageOpen  />
                View My Orders
              </Button>
            </Link>
          )}
          {authenticated && (
            <Link href="/listing/new">
              <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
                <Plus className="h-4 w-4" />
                List Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filter by category:
          </span>
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
                  ? "bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
                  : "bg-transparent hover:bg-accent"
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
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </GridLayout>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No products found matching your search."
              : "No products available yet."}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <GridLayout>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </GridLayout>
        </motion.div>
      )}
    </div>
  );
}

export default withAuth(MarketplacePage);