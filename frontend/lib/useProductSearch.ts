"use client"

import { useState, useEffect, useRef } from "react"
import type { Product } from "@/lib/types"

/**
 * Debounced product search hook.
 * Fetches from /api/products and filters client-side.
 */
export function useProductSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const allProductsRef = useRef<Product[]>([])
  const loadedRef = useRef(false)

  // Load all products once
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { allProductsRef.current = Array.isArray(data) ? data : [] })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) { setResults([]); return }

    setLoading(true)
    const timer = setTimeout(() => {
      const filtered = allProductsRef.current.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.farmerName.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      )
      setResults(filtered.slice(0, 20))
      setLoading(false)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return { results, loading }
}
