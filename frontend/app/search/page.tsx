"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchX, ArrowLeft } from "lucide-react"
import { ProductCard } from "@/components/ProductCard"
import { TrainingCard } from "@/components/TrainingCard"
import { UserCard } from "@/components/UserCard"
import { GridLayout } from "@/components/GridLayout"
import { ProductCardSkeleton } from "@/components/Skeleton"
import { Button } from "@/components/ui/button"
import type { Product, Training, User } from "@/lib/types"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  const [products, setProducts] = useState<Product[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, trainingsRes, usersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/trainings"),
          fetch("/api/users"),
        ])

        const productsData = productsRes.ok ? await productsRes.json() : []
        const trainingsData = trainingsRes.ok ? await trainingsRes.json() : []
        const usersData = usersRes.ok ? await usersRes.json() : []

        setProducts(Array.isArray(productsData) ? productsData : [])
        setTrainings(Array.isArray(trainingsData) ? trainingsData : [])
        setUsers(Array.isArray(usersData) ? usersData : [])
      } catch (error) {
        console.error("Error fetching search data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return []
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(normalizedQuery) ||
        p.description.toLowerCase().includes(normalizedQuery) ||
        p.category.toLowerCase().includes(normalizedQuery) ||
        p.farmerName.toLowerCase().includes(normalizedQuery)
    )
  }, [products, normalizedQuery])

  const filteredTrainings = useMemo(() => {
    if (!normalizedQuery) return []
    return trainings.filter(
      (t) =>
        t.title.toLowerCase().includes(normalizedQuery) ||
        t.summary.toLowerCase().includes(normalizedQuery) ||
        t.description.toLowerCase().includes(normalizedQuery)
    )
  }, [trainings, normalizedQuery])

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return []
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(normalizedQuery) ||
        (u.email || "").toLowerCase().includes(normalizedQuery) ||
        (u.location || "").toLowerCase().includes(normalizedQuery)
    )
  }, [users, normalizedQuery])

  const totalResults = filteredProducts.length + filteredTrainings.length + filteredUsers.length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
      {query && <p className="text-muted-foreground mb-8">Showing {totalResults} results for "{query}"</p>}

      {loading ? (
        <div className="space-y-12">
          <section>
            <div className="h-7 w-32 bg-muted rounded animate-pulse mb-4" />
            <GridLayout>
              {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </GridLayout>
          </section>
        </div>
      ) : (
        <div className="space-y-12">
          {totalResults > 0 ? (
            <>
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

              {filteredUsers.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Users ({filteredUsers.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                      <UserCard key={user.id} user={user} />
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
              <Button onClick={() => router.back()}>Reset Search</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
