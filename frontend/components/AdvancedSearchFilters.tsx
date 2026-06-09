"use client"

import { useRef, useEffect } from "react"
import { SlidersHorizontal, X, Search, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export interface SearchFilters {
  search: string
  category: string
  minPrice: number | null
  maxPrice: number | null
  location: string
  sortBy: "newest" | "price_asc" | "price_desc" | "name_asc" | "popular"
  unit: string
  inStockOnly: boolean
  verifiedOnly: boolean
}

export const DEFAULT_FILTERS: SearchFilters = {
  search: "",
  category: "All",
  minPrice: null,
  maxPrice: null,
  location: "",
  sortBy: "newest",
  unit: "",
  inStockOnly: false,
  verifiedOnly: false,
}

const CATEGORIES = [
  "All", "Vegetables", "Fruits", "Grains", "Tubers",
  "Legumes", "Poultry", "Livestock", "Seafood", "Spices", "Others",
]

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "popular",   label: "Most Viewed" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc",   label: "Name: A–Z" },
]

const PRICE_PRESETS = [
  { label: "Under ₦5k",   min: null, max: 5000 },
  { label: "₦5k–₦20k",   min: 5000, max: 20000 },
  { label: "₦20k–₦100k", min: 20000, max: 100000 },
  { label: "Above ₦100k", min: 100000, max: null },
]

const UNITS = ["kg", "bag", "crate", "bunch", "litre", "unit", "tonne", "piece"]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  locations: string[]
  extraCategories?: string[]
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">{title}</p>
      {children}
    </div>
  )
}

export function FilterPanel({ open, onOpenChange, filters, onChange, locations, extraCategories = [] }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  const allCategories = [...CATEGORIES, ...extraCategories.filter((c) => !CATEGORIES.includes(c))]

  const activeCount = [
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.location,
    filters.unit,
    filters.sortBy !== "newest" ? "s" : null,
    filters.category !== "All" ? "c" : null,
    filters.inStockOnly ? "stock" : null,
    filters.verifiedOnly ? "v" : null,
  ].filter(Boolean).length

  const reset = () => onChange(DEFAULT_FILTERS)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onOpenChange(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onOpenChange])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onOpenChange])

  const isPricePreset = (min: number | null, max: number | null) =>
    filters.minPrice === min && filters.maxPrice === max

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onOpenChange(!open)}
        className={`gap-2 ${activeCount > 0 ? "border-[#118C4C] text-[#118C4C] bg-[#118C4C]/5" : ""}`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="h-4 w-4 rounded-full bg-[#118C4C] text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full z-50 w-[320px] max-w-[92vw] bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#118C4C]" />
                <span className="font-semibold text-foreground">Filter Products</span>
              </div>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button onClick={reset} className="text-xs text-[#118C4C] hover:underline flex items-center gap-1">
                    <X className="h-3 w-3" /> Reset all
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* Search */}
              <Section title="Search">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                    className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                  />
                  {filters.search && (
                    <button onClick={() => onChange({ ...filters, search: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </Section>

              {/* Quick toggles */}
              <Section title="Quick Filters">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-foreground group-hover:text-[#118C4C] transition-colors flex items-center gap-2">
                      <span className="text-base">📦</span> In Stock Only
                    </span>
                    <div
                      onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
                      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${filters.inStockOnly ? "bg-[#118C4C]" : "bg-muted-foreground/30"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${filters.inStockOnly ? "translate-x-4" : ""}`} />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-foreground group-hover:text-[#118C4C] transition-colors flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-blue-500" /> Verified Farmers Only
                    </span>
                    <div
                      onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
                      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${filters.verifiedOnly ? "bg-[#118C4C]" : "bg-muted-foreground/30"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${filters.verifiedOnly ? "translate-x-4" : ""}`} />
                    </div>
                  </label>
                </div>
              </Section>

              {/* Category */}
              <Section title="Category">
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => onChange({ ...filters, category: cat })}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filters.category === cat
                          ? "bg-[#118C4C] text-white border-[#118C4C]"
                          : "bg-transparent border-border text-foreground hover:border-[#118C4C]/50 hover:text-[#118C4C]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Price presets */}
              <Section title="Price Range (₦)">
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {PRICE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onChange({ ...filters, minPrice: p.min, maxPrice: p.max })}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isPricePreset(p.min, p.max)
                          ? "bg-[#118C4C] text-white border-[#118C4C]"
                          : "border-border hover:border-[#118C4C]/50 hover:text-[#118C4C]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Min" min={0}
                    value={filters.minPrice ?? ""}
                    onChange={(e) => onChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                  />
                  <input
                    type="number" placeholder="Max" min={0}
                    value={filters.maxPrice ?? ""}
                    onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                  />
                </div>
              </Section>

              {/* Unit */}
              <Section title="Unit Type">
                <div className="flex flex-wrap gap-1.5">
                  {["", ...UNITS].map((u) => (
                    <button
                      key={u || "all"}
                      onClick={() => onChange({ ...filters, unit: u })}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        filters.unit === u
                          ? "bg-[#118C4C] text-white border-[#118C4C]"
                          : "border-border text-foreground hover:border-[#118C4C]/50 hover:text-[#118C4C]"
                      }`}
                    >
                      {u || "Any"}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Location */}
              {locations.length > 0 && (
                <Section title="Location">
                  <select
                    value={filters.location}
                    onChange={(e) => onChange({ ...filters, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </Section>
              )}

              {/* Sort */}
              <Section title="Sort By">
                <div className="space-y-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onChange({ ...filters, sortBy: opt.value as SearchFilters["sortBy"] })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.sortBy === opt.value
                          ? "bg-[#118C4C]/10 text-[#118C4C] font-medium"
                          : "hover:bg-accent text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <Button className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => onOpenChange(false)}>
                Show Results
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export { DEFAULT_FILTERS as default }
