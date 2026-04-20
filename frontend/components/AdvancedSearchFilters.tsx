"use client"

import { useState } from "react"
import { SlidersHorizontal, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface SearchFilters {
  minPrice: number | null
  maxPrice: number | null
  location: string
  sortBy: "newest" | "price_asc" | "price_desc" | "name_asc"
}

const DEFAULT_FILTERS: SearchFilters = {
  minPrice: null,
  maxPrice: null,
  location: "",
  sortBy: "newest",
}

interface Props {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  locations: string[]
}

export function AdvancedSearchFilters({ filters, onChange, locations }: Props) {
  const [open, setOpen] = useState(false)

  const hasActiveFilters =
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.location !== "" ||
    filters.sortBy !== "newest"

  const reset = () => onChange(DEFAULT_FILTERS)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className={`gap-2 ${hasActiveFilters ? "border-[#118C4C] text-[#118C4C] bg-[#118C4C]/5" : "border-input"}`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="h-4 w-4 rounded-full bg-[#118C4C] text-white text-[10px] flex items-center justify-center font-bold">
            {[filters.minPrice, filters.maxPrice, filters.location, filters.sortBy !== "newest" ? "s" : null].filter(Boolean).length}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 bg-popover border border-border rounded-xl shadow-xl p-4 w-72 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Advanced Filters</span>
              {hasActiveFilters && (
                <button onClick={reset} className="text-xs text-[#118C4C] hover:underline flex items-center gap-1">
                  <X className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Price Range (₦)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ""}
                  onChange={(e) => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                  min={0}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                  min={0}
                />
              </div>
            </div>

            {/* Location */}
            {locations.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => onChange({ ...filters, location: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SearchFilters["sortBy"] })}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A–Z</option>
              </select>
            </div>

            <Button
              size="sm"
              className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
              onClick={() => setOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export { DEFAULT_FILTERS }
