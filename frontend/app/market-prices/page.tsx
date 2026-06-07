"use client"

import { useEffect, useState } from "react"
import { TrendingUp, RefreshCcw, MapPin, Calendar, BarChart3, Wheat } from "lucide-react"
import { motion } from "framer-motion"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"

// Emoji + color + description for each commodity
const META: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
  "Rice (local)":    { emoji: "🌾", color: "#b45309", bg: "#fef3c7", desc: "Locally grown rice, staple across Nigeria" },
  "Rice (imported)": { emoji: "🍚", color: "#1d4ed8", bg: "#dbeafe", desc: "Imported parboiled rice (Thailand/India)" },
  "Maize flour":     { emoji: "🌽", color: "#d97706", bg: "#fef9c3", desc: "Ground white maize, base for ogi & tuwo" },
  "Beans (white)":   { emoji: "🫘", color: "#7c3aed", bg: "#ede9fe", desc: "White/black-eyed beans (oloyin)" },
  "Beans (red)":     { emoji: "🫘", color: "#dc2626", bg: "#fee2e2", desc: "Red kidney beans, popular in stews" },
  "Cowpeas":         { emoji: "🟤", color: "#92400e", bg: "#fef3c7", desc: "Black-eyed peas, vital protein source" },
  "Tomatoes":        { emoji: "🍅", color: "#dc2626", bg: "#fee2e2", desc: "Fresh tomatoes, essential for Nigerian cooking" },
  "Yam":             { emoji: "🍠", color: "#b45309", bg: "#fef3c7", desc: "White yam, culturally important crop" },
  "Onions":          { emoji: "🧅", color: "#d97706", bg: "#fef9c3", desc: "Red & yellow onions for soups and stews" },
  "Groundnuts":      { emoji: "🥜", color: "#b45309", bg: "#fef3c7", desc: "Roasted or raw peanuts, oil & snack crop" },
  "Millet":          { emoji: "🌾", color: "#059669", bg: "#d1fae5", desc: "Pearl millet, drought-resistant grain" },
  "Sorghum":         { emoji: "🌿", color: "#065f46", bg: "#d1fae5", desc: "Versatile grain for pap & brewing" },
  "Oil (palm)":      { emoji: "🫙", color: "#dc2626", bg: "#fee2e2", desc: "Red palm oil, cornerstone of Nigerian cuisine" },
  "Oil (vegetable)": { emoji: "🛢️", color: "#d97706", bg: "#fef9c3", desc: "Refined vegetable oil for frying" },
  "Meat (beef)":     { emoji: "🥩", color: "#dc2626", bg: "#fee2e2", desc: "Fresh beef from local cattle markets" },
  "Fish":            { emoji: "🐟", color: "#1d4ed8", bg: "#dbeafe", desc: "Fresh/dried fish, key protein source" },
}

const DEFAULT_META = { emoji: "🌱", color: "#118C4C", bg: "#d1fae5", desc: "Agricultural commodity" }

function CommodityCard({ item, index }: { item: CommodityPrice; index: number }) {
  const meta = META[item.commodity] ?? DEFAULT_META

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-default"
    >
      {/* Colored top strip + emoji */}
      <div className="relative h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${meta.bg}, ${meta.bg}cc)` }}>
        <span className="text-5xl drop-shadow-sm select-none">{meta.emoji}</span>
        <div className="absolute top-2 right-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: meta.color + "22", color: meta.color }}>
            /{item.unit}
          </span>
        </div>
        {/* Market count badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/70 dark:bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">
          <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{item.marketCount} markets</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-foreground text-base leading-tight">{item.displayName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{meta.desc}</p>
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">
              ₦{item.price.toLocaleString()}
            </p>
            {item.usdPrice > 0 && (
              <p className="text-xs text-muted-foreground font-medium">≈ ${item.usdPrice.toFixed(2)} <span className="text-muted-foreground/60">USD</span></p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(item.date).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</span>
            </div>
            <div className="h-6 w-16 flex items-end gap-0.5">
              {/* Mini sparkline bars — decorative, shows relative market activity */}
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm opacity-30 group-hover:opacity-60 transition-opacity"
                  style={{ height: `${h * 100}%`, background: meta.color }} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tag */}
        <div className="pt-2 border-t border-border flex items-center gap-1.5">
          <BarChart3 className="h-3 w-3" style={{ color: meta.color }} />
          <span className="text-xs text-muted-foreground">Avg across {item.marketCount} Nigerian markets</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function MarketPricesPage() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/commodity-prices")
      if (res.ok) {
        setPrices(await res.json())
        const at = res.headers.get("X-Fetched-At")
        if (at) setFetchedAt(at)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative container mx-auto px-4 py-10 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🇳🇬</span>
                <span className="text-sm font-medium bg-white/20 px-3 py-0.5 rounded-full">Live Market Data</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nigeria Food Prices</h1>
              <p className="text-white/70 mt-1 text-sm max-w-md">
                Monthly average retail prices from WFP-monitored markets across Abuja, Lagos, Kano & more.
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              {fetchedAt && (
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/80 text-xs">
                    Updated {new Date(fetchedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats row */}
          {!loading && prices.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Commodities", value: prices.length, icon: "🌿" },
                { label: "Avg markets/item", value: Math.round(prices.reduce((s, p) => s + p.marketCount, 0) / prices.length), icon: "🏪" },
                { label: "Data source", value: "WFP", icon: "🌍" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 rounded-xl px-3 py-2 text-center">
                  <p className="text-lg">{stat.icon}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-64" />
            ))}
          </div>
        ) : prices.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wheat className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Could not load market prices</p>
            <button onClick={load} className="mt-4 text-[#118C4C] underline text-sm">Try again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {prices.map((item, i) => (
              <CommodityCard key={item.commodity} item={item} index={i} />
            ))}
          </div>
        )}

        <p className="mt-10 text-xs text-muted-foreground text-center leading-relaxed">
          Data sourced from the{" "}
          <a href="https://data.humdata.org/dataset/global-wfp-food-prices" target="_blank" rel="noopener noreferrer" className="text-[#118C4C] hover:underline">
            WFP Global Food Prices Database
          </a>{" "}
          · Licensed under{" "}
          <a href="https://creativecommons.org/licenses/by-igo/3.0/" target="_blank" rel="noopener noreferrer" className="text-[#118C4C] hover:underline">
            CC BY-IGO
          </a>{" "}
          by the World Food Programme. Prices are retail averages and may vary by market and season.
        </p>
      </div>
    </div>
  )
}
