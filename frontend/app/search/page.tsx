"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { SearchX, ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/ProductCard"
import { TrainingCard } from "@/components/TrainingCard"
import { FundingCard } from "@/components/FundingCard"
import { GridLayout } from "@/components/GridLayout"
import { Button } from "@/components/ui/button"
import { loadFromLocalStorage } from "@/lib/localStorage"
import type { Product, Training, FundingApplication } from "@/lib/types"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  const [products, setProducts] = useState<Product[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [fundings, setFundings] = useState<FundingApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedProducts = loadFromLocalStorage<Product[]>("foodra_products", [])
    const storedTrainings = loadFromLocalStorage<Training[]>("foodra_training", [])
    const storedFundings = loadFromLocalStorage<FundingApplication[]>("foodra_applications", [])
    setProducts(storedProducts)
    setTrainings(storedTrainings)
    setFundings(storedFundings)
    setLoading(false)
  }, [])

  const filteredProducts = useMemo(() => {
    if (!query) return []
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
    )
  }, [products, query])

  const filteredTrainings = useMemo(() => {
    if (!query) return []
    return trainings.filter(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.summary.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase())
    )
  }, [trainings, query])

  const filteredFundings = useMemo(() => {
    if (!query) return []
    return fundings.filter(
      (f) =>
        f.farmType.toLowerCase().includes(query.toLowerCase()) ||
        f.expectedOutcome.toLowerCase().includes(query.toLowerCase())
    )
  }, [fundings, query])

  const totalResults = filteredProducts.length + filteredTrainings.length + filteredFundings.length

  const handleResetSearch = () => {
    router.back()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
      {query && (
        <p className="text-muted-foreground mb-8">
          Showing {totalResults} results for "{query}"
        </p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-12">
          {totalResults > 0 ? (
            <>
              {/* Products */}
              {filteredProducts.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Products ({filteredProducts.length})</h2>
                  <GridLayout>
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </GridLayout>
                </section>
              )}

              {/* Trainings */}
              {filteredTrainings.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Training ({filteredTrainings.length})</h2>
                  <GridLayout>
                    {filteredTrainings.map((training) => (
                      <TrainingCard key={training.id} training={training} />
                    ))}
                  </GridLayout>
                </section>
              )}

              {/* Funding */}
              {filteredFundings.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Funding Applications ({filteredFundings.length})</h2>
                  <div className="space-y-4">
                    {filteredFundings.map((funding) => (
                      <FundingCard key={funding.id} application={funding} />
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block bg-accent p-6 rounded-full mb-4">
                <SearchX className="h-16 w-16 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                We couldn't find any results for "{query}". Please try a different search term.
              </p>
              <Button onClick={handleResetSearch}>Reset Search</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
