"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCcw, Search, LayoutGrid, List, TrendingUp, TrendingDown, Minus, ShoppingBag, MapPin, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { getPositions } from "@/lib/assetStore"
import { META, DEFAULT_META, PriceChart, getChange, CommodityDetailModal } from "./components"

// ─── Grid Card ────────────────────────────────────────────────────────────────
function CommodityCard({ item, history, index, onClick }: {
  item: CommodityPrice; history?: CommodityHistory; index: number; onClick: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const change = getChange(hist, item.price)
  const isUp = !change || change.value >= 0
  const held = getPositions().find(p => p.commodity === item.commodity)?.quantity

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      onClick={onClick}
      className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Chart area */}
      <div className="relative h-28" style={{ background: `linear-gradient(160deg, ${meta.bg}cc, ${meta.bg}44)` }}>
        <div className="absolute inset-x-0 bottom-0 h-20 px-1">
          <PriceChart history={hist} color={meta.color} unit={item.unit} />
        </div>
        {/* Top */}
        <div className="absolute top-2.5 inset-x-3 flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl drop-shadow-sm">{meta.emoji}</span>
            {held != null && (
              <span className="text-xs bg-[#118C4C] text-white rounded-full px-1.5 py-0.5 font-semibold shadow-sm">
                {held}{item.unit}
              </span>
            )}
          </div>
          {change ? (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 backdrop-blur-sm
              ${isUp ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-500/20 text-red-600 dark:text-red-400"}`}>
              {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {isUp ? "+" : ""}{change.value.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs bg-black/10 text-muted-foreground px-1.5 py-0.5 rounded-lg">—</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="font-bold text-sm leading-tight">{item.displayName}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{(META[item.commodity] ?? DEFAULT_META).desc}</p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-tight">₦{item.price.toLocaleString()}</p>
            {item.usdPrice > 0 && <p className="text-xs text-muted-foreground">≈ ${item.usdPrice.toFixed(2)}</p>}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            <span>{item.marketCount}</span>
          </div>
        </div>
        <button
          className="w-full rounded-xl py-1.5 text-xs font-bold text-white transition-opacity group-hover:opacity-90 flex items-center justify-center gap-1"
          style={{ background: meta.color }}
        >
          <ShoppingBag className="h-3 w-3" /> Buy Asset
        </button>
      </div>
    </motion.div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function CommodityRow({ item, history, index, onClick }: {
  item: CommodityPrice; history?: CommodityHistory; index: number; onClick: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const change = getChange(hist, item.price)
  const isUp = !change || change.value >= 0
  const held = getPositions().find(p => p.commodity === item.commodity)?.quantity

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 border-b border-border hover:bg-muted/40 cursor-pointer transition-colors"
    >
      <span className="text-2xl w-8 text-center shrink-0">{meta.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{item.displayName}</p>
          {held != null && (
            <span className="text-xs bg-[#118C4C]/15 text-[#118C4C] rounded-full px-1.5 font-medium shrink-0">
              {held} {item.unit}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{meta.desc.slice(0, 40)}…</p>
      </div>
      <div className="hidden sm:block w-16 h-8 shrink-0">
        <PriceChart history={hist.slice(-8)} color={meta.color} unit={item.unit} />
      </div>
      <div className="text-right shrink-0 min-w-[80px]">
        <p className="font-bold text-sm">₦{item.price.toLocaleString()}</p>
        {change ? (
          <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 mt-0.5
            ${isUp ? "text-green-600" : "text-red-500"}`}>
            {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isUp ? "+" : ""}{change.value.toFixed(1)}%
          </p>
        ) : (
          <p className="text-xs text-muted-foreground flex items-center justify-end gap-0.5 mt-0.5">
            <Minus className="h-2.5 w-2.5" /> —
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MarketPricesPage() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [histories, setHistories] = useState<Record<string, CommodityHistory>>({})
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [assetCount, setAssetCount] = useState(0)
  const [view, setView] = useState<"grid"|"list">("grid")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name"|"price"|"change">("name")
  const [selected, setSelected] = useState<CommodityPrice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, hRes] = await Promise.all([
        fetch("/api/commodity-prices"),
        fetch("/api/commodity-history"),
      ])
      if (pRes.ok) {
        setPrices(await pRes.json())
        const at = pRes.headers.get("X-Fetched-At")
        if (at) setFetchedAt(at)
      }
      if (hRes.ok) {
        const hData: CommodityHistory[] = await hRes.json()
        const map: Record<string, CommodityHistory> = {}
        hData.forEach(h => { map[h.commodity] = h })
        setHistories(map)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(); setAssetCount(getPositions().length) }, [load])

  const withChange = prices.map(p => ({
    ...p,
    change: getChange(histories[p.commodity]?.history, p.price),
  }))

  const filtered = withChange
    .filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price")  return b.price - a.price
      if (sortBy === "change") return ((b.change?.value ?? -999) - (a.change?.value ?? -999))
      return a.displayName.localeCompare(b.displayName)
    })

  const gainers = withChange.filter(p => (p.change?.value ?? 0) > 0).length
  const losers  = withChange.filter(p => (p.change?.value ?? 0) < 0).length

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Ticker */}
        {!loading && prices.length > 0 && (
          <div className="relative overflow-hidden border-b border-white/10 py-1.5 bg-black/20">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="flex gap-8 whitespace-nowrap text-xs font-mono px-4"
            >
              {[...withChange, ...withChange].map((p, i) => (
                <span key={i} className="flex items-center gap-1.5 opacity-90">
                  <span>{(META[p.commodity] ?? DEFAULT_META).emoji}</span>
                  <span className="font-semibold">{p.displayName}</span>
                  <span className="text-white/70">₦{p.price.toLocaleString()}</span>
                  {p.change && (
                    <span className={p.change.value >= 0 ? "text-green-300" : "text-red-300"}>
                      {p.change.value >= 0 ? "▲" : "▼"}{Math.abs(p.change.value).toFixed(1)}%
                    </span>
                  )}
                </span>
              ))}
            </motion.div>
          </div>
        )}

        <div className="relative container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🇳🇬</span>
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live · WFP Data
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nigeria Commodity Market</h1>
              <p className="text-white/70 mt-1 text-sm">Monthly avg retail prices · Abuja, Lagos, Kano & more</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
              {fetchedAt && (
                <p className="text-xs text-white/50">
                  Updated {new Date(fetchedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/20 transition-colors rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          {!loading && prices.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Commodities", value: prices.length, sub: "tracked", icon: "🌿" },
                { label: "Gainers", value: gainers, sub: "this period", icon: "📈" },
                { label: "Losers", value: losers, sub: "this period", icon: "📉" },
                { label: "Avg Markets", value: Math.round(prices.reduce((s,p) => s+p.marketCount,0)/prices.length), sub: "per commodity", icon: "🏪" },
              ].map(s => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-3">
                  <p className="text-lg">{s.icon}</p>
                  <p className="text-2xl font-extrabold">{s.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.sub}</p>
                  <p className="text-xs text-white/70 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Portfolio CTA ─────────────────────────────────────────────── */}
      {assetCount > 0 && (
        <div className="bg-[#118C4C]/10 border-b border-[#118C4C]/20">
          <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between">
            <p className="text-sm text-[#118C4C] font-semibold">
              📊 You hold {assetCount} commodity asset{assetCount > 1 ? "s" : ""}
            </p>
            <a href="/assets" className="text-xs font-bold text-[#118C4C] hover:underline flex items-center gap-1">
              View Portfolio <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search commodities…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]">
            <option value="name">A – Z</option>
            <option value="price">Highest Price</option>
            <option value="change">Biggest Movers</option>
          </select>
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button onClick={() => setView("grid")}
              className={`px-3 py-2 transition-colors ${view === "grid" ? "bg-[#118C4C] text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")}
              className={`px-3 py-2 transition-colors ${view === "list" ? "bg-[#118C4C] text-white" : "text-muted-foreground hover:bg-muted"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid / List ───────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-1"}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`bg-muted animate-pulse rounded-2xl ${view === "grid" ? "h-56" : "h-14"}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-medium">No commodities match your search</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <CommodityCard key={item.commodity} item={item} history={histories[item.commodity]}
                index={i} onClick={() => setSelected(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="px-4 py-2.5 border-b border-border bg-muted/40 grid grid-cols-[2rem_1fr_4rem_5rem] sm:grid-cols-[2rem_1fr_5rem_4rem_5rem] gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span />
              <span>Commodity</span>
              <span className="hidden sm:block" />
              <span className="text-center hidden sm:block">Chart</span>
              <span className="text-right">Price / Δ</span>
            </div>
            {filtered.map((item, i) => (
              <CommodityRow key={item.commodity} item={item} history={histories[item.commodity]}
                index={i} onClick={() => setSelected(item)} />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Data ·{" "}
          <a href="https://data.humdata.org/dataset/global-wfp-food-prices" target="_blank" rel="noopener noreferrer"
            className="text-[#118C4C] hover:underline">WFP Global Food Prices</a>{" "}
          · CC BY-IGO · Retail averages, may vary by market and season.
        </p>
      </div>

      {/* ── Detail / Buy modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <CommodityDetailModal
            key={selected.commodity}
            item={selected}
            history={histories[selected.commodity]}
            onClose={() => setSelected(null)}
            onBought={() => setAssetCount(getPositions().length)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
