"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCcw, TrendingUp, TrendingDown, Minus, Search, LayoutGrid, List, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { getPositions } from "@/lib/assetStore"
import { META, DEFAULT_META, PriceChart, BuyModal } from "./components"

// ─── Commodity row (list view) ────────────────────────────────────────────────
function CommodityRow({
  item, history, index, onBuy
}: {
  item: CommodityPrice
  history: CommodityHistory | undefined
  index: number
  onBuy: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const prev = hist.length > 1 ? hist[hist.length - 2].price : null
  const change = prev ? ((item.price - prev) / prev) * 100 : null
  const isUp = change != null && change > 0
  const isFlat = change != null && change === 0
  const held = getPositions().find(p => p.commodity === item.commodity)?.quantity

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors cursor-pointer group"
      onClick={onBuy}
    >
      <span className="text-2xl w-8 text-center shrink-0">{meta.emoji}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{item.displayName}</p>
          {held != null && (
            <span className="text-xs bg-[#118C4C]/10 text-[#118C4C] rounded-full px-1.5 py-0.5 font-medium shrink-0">
              {held} {item.unit}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{item.marketCount} markets · {item.unit}</p>
      </div>

      {/* Mini sparkline */}
      <div className="hidden sm:block w-20 h-8 shrink-0">
        <PriceChart history={hist.slice(-8)} color={meta.color} unit={item.unit} />
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-sm">₦{item.price.toLocaleString()}</p>
        {change != null ? (
          <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${isFlat ? "text-muted-foreground" : isUp ? "text-green-600" : "text-red-500"}`}>
            {isFlat ? <Minus className="h-2.5 w-2.5" /> : isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isUp ? "+" : ""}{change.toFixed(1)}%
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Commodity card (grid view) ───────────────────────────────────────────────
function CommodityCard({
  item, history, index, onBuy
}: {
  item: CommodityPrice
  history: CommodityHistory | undefined
  index: number
  onBuy: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const prev = hist.length > 1 ? hist[hist.length - 2].price : null
  const change = prev ? ((item.price - prev) / prev) * 100 : null
  const isUp = change != null && change >= 0
  const held = getPositions().find(p => p.commodity === item.commodity)?.quantity

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={onBuy}
    >
      {/* Chart area */}
      <div className="relative h-28" style={{ background: `linear-gradient(160deg, ${meta.bg}bb, ${meta.bg}44)` }}>
        <div className="absolute inset-0 px-2 pt-8 pb-1">
          <PriceChart history={hist} color={meta.color} unit={item.unit} />
        </div>
        {/* Top row */}
        <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{meta.emoji}</span>
            {held != null && (
              <span className="text-xs bg-[#118C4C]/90 text-white rounded-full px-1.5 py-0.5 font-semibold">
                {held}{item.unit}
              </span>
            )}
          </div>
          {change != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5
              ${isUp ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-500/20 text-red-600 dark:text-red-400"}`}>
              {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2">
        <div>
          <p className="font-bold text-sm leading-tight">{item.displayName}</p>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{(META[item.commodity] ?? DEFAULT_META).desc}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-extrabold tracking-tight">₦{item.price.toLocaleString()}</p>
            {item.usdPrice > 0 && <p className="text-xs text-muted-foreground">≈ ${item.usdPrice.toFixed(2)}</p>}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{item.marketCount} markets</p>
            <p>/{item.unit}</p>
          </div>
        </div>

        <button
          className="w-full rounded-lg py-1.5 text-xs font-bold text-white transition-opacity group-hover:opacity-90"
          style={{ background: meta.color }}
        >
          Buy Asset
        </button>
      </div>
    </motion.div>
  )
}

// ─── Detail modal (click card → full chart) ───────────────────────────────────
function DetailModal({
  item, history, onClose, onBuy
}: {
  item: CommodityPrice
  history: CommodityHistory | undefined
  onClose: () => void
  onBuy: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const prev = hist.length > 1 ? hist[hist.length - 2].price : null
  const change = prev ? ((item.price - prev) / prev) * 100 : null
  const isUp = change != null && change >= 0
  const min = hist.length ? Math.min(...hist.map(h => h.price)) : 0
  const max = hist.length ? Math.max(...hist.map(h => h.price)) : 0
  const [range, setRange] = useState<"3m" | "6m" | "1y" | "all">("all")

  const rangeSlice = { "3m": -3, "6m": -6, "1y": -12, "all": 0 }
  const sliced = rangeSlice[range] ? hist.slice(rangeSlice[range]) : hist

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: meta.bg }}>
                {meta.emoji}
              </div>
              <div>
                <p className="font-bold text-base">{item.displayName}</p>
                <p className="text-xs text-muted-foreground">₦ per {item.unit} · {item.marketCount} markets</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full w-7 h-7 flex items-center justify-center bg-muted hover:bg-muted/80">
              <span className="text-sm font-bold">✕</span>
            </button>
          </div>

          <div className="flex items-end gap-3 mt-3">
            <p className="text-4xl font-extrabold tracking-tight">₦{item.price.toLocaleString()}</p>
            {change != null && (
              <p className={`text-sm font-bold mb-1 ${isUp ? "text-green-600" : "text-red-500"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% vs last month
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Chart */}
          <div>
            <div className="flex gap-1 mb-3">
              {(["3m", "6m", "1y", "all"] as const).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${range === r ? "bg-[#118C4C] text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="h-48 w-full">
              <PriceChart history={sliced} color={meta.color} unit={item.unit} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "All-time High", value: `₦${max.toLocaleString()}` },
              { label: "All-time Low", value: `₦${min.toLocaleString()}` },
              { label: "Data points", value: `${hist.length} months` },
              { label: "USD equiv.", value: item.usdPrice > 0 ? `$${item.usdPrice.toFixed(2)}` : "N/A" },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold text-sm mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{(META[item.commodity] ?? DEFAULT_META).desc}</p>

          <button
            onClick={onBuy}
            className="w-full rounded-xl py-3 font-bold text-white text-base transition-opacity hover:opacity-90"
            style={{ background: meta.color }}
          >
            Buy {item.displayName} as Asset
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MarketPricesPage() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [histories, setHistories] = useState<Record<string, CommodityHistory>>({})
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [assetCount, setAssetCount] = useState(0)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "price" | "change">("name")
  const [selected, setSelected] = useState<CommodityPrice | null>(null)
  const [buying, setBuying] = useState<CommodityPrice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [priceRes, histRes] = await Promise.all([
        fetch("/api/commodity-prices"),
        fetch("/api/commodity-history"),
      ])
      if (priceRes.ok) {
        const data: CommodityPrice[] = await priceRes.json()
        setPrices(data)
        const at = priceRes.headers.get("X-Fetched-At")
        if (at) setFetchedAt(at)
      }
      if (histRes.ok) {
        const histData: CommodityHistory[] = await histRes.json()
        const map: Record<string, CommodityHistory> = {}
        histData.forEach(h => { map[h.commodity] = h })
        setHistories(map)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    setAssetCount(getPositions().length)
  }, [load])

  // Derived: compute change for sorting
  const withChange = prices.map(p => {
    const hist = histories[p.commodity]?.history ?? []
    const prev = hist.length > 1 ? hist[hist.length - 2].price : null
    const change = prev ? ((p.price - prev) / prev) * 100 : null
    return { ...p, change }
  })

  const filtered = withChange
    .filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price") return b.price - a.price
      if (sortBy === "change") return (b.change ?? -999) - (a.change ?? -999)
      return a.displayName.localeCompare(b.displayName)
    })

  // Market summary stats
  const gainers = withChange.filter(p => (p.change ?? 0) > 0).length
  const losers  = withChange.filter(p => (p.change ?? 0) < 0).length

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#0d1f14] to-[#0a1a0f] text-white">
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 60%, #118C4C22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #1d4ed822 0%, transparent 60%)" }} />
        {/* Ticker tape */}
        {!loading && prices.length > 0 && (
          <div className="relative overflow-hidden border-b border-white/10 py-1.5 bg-white/5">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-6 whitespace-nowrap text-xs font-mono px-4"
            >
              {[...withChange, ...withChange].map((p, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="opacity-60">{(META[p.commodity] ?? DEFAULT_META).emoji}</span>
                  <span className="font-semibold">{p.displayName}</span>
                  <span className="text-white/70">₦{p.price.toLocaleString()}</span>
                  {p.change != null && (
                    <span className={p.change >= 0 ? "text-green-400" : "text-red-400"}>
                      {p.change >= 0 ? "▲" : "▼"}{Math.abs(p.change).toFixed(1)}%
                    </span>
                  )}
                </span>
              ))}
            </motion.div>
          </div>
        )}

        <div className="relative container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🇳🇬</span>
                <span className="text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live · WFP Data
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nigeria Commodity Market</h1>
              <p className="text-white/50 mt-1 text-sm">Monthly avg retail prices · Abuja, Lagos, Kano & more</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              {fetchedAt && (
                <p className="text-xs text-white/40">
                  Updated {new Date(fetchedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 transition-colors rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Market summary */}
          {!loading && prices.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Commodities", value: prices.length, sub: "tracked", color: "text-white" },
                { label: "Gainers", value: gainers, sub: "this period", color: "text-green-400" },
                { label: "Losers", value: losers, sub: "this period", color: "text-red-400" },
                { label: "Markets", value: Math.round(prices.reduce((s, p) => s + p.marketCount, 0) / prices.length), sub: "avg per item", color: "text-blue-400" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3">
                  <p className="text-xs text-white/40">{s.label}</p>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30">{s.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Portfolio CTA ─────────────────────────────────────── */}
      {assetCount > 0 && (
        <div className="bg-[#118C4C]/10 border-b border-[#118C4C]/20">
          <div className="container mx-auto px-4 py-2.5 max-w-6xl flex items-center justify-between">
            <p className="text-sm text-[#118C4C] font-medium">
              📊 You hold {assetCount} asset{assetCount > 1 ? "s" : ""}
            </p>
            <a href="/assets" className="text-xs font-bold text-[#118C4C] hover:underline flex items-center gap-1">
              View Portfolio <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 max-w-6xl flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search commodities…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
            />
          </div>
          {/* Sort */}
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
          >
            <option value="name">A–Z</option>
            <option value="price">Highest Price</option>
            <option value="change">Biggest Movers</option>
          </select>
          {/* View toggle */}
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

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {loading ? (
          view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse h-60" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 border-b border-border bg-muted animate-pulse" />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-medium">No commodities match your search</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <CommodityCard
                key={item.commodity} item={item} history={histories[item.commodity]} index={i}
                onBuy={() => setSelected(item)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="px-4 py-2 border-b border-border grid grid-cols-[2rem_1fr_5rem_5rem] gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span />
              <span>Commodity</span>
              <span className="hidden sm:block text-right">Chart</span>
              <span className="text-right">Price</span>
            </div>
            {filtered.map((item, i) => (
              <CommodityRow
                key={item.commodity} item={item} history={histories[item.commodity]} index={i}
                onBuy={() => setSelected(item)}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Data ·{" "}
          <a href="https://data.humdata.org/dataset/global-wfp-food-prices" target="_blank" rel="noopener noreferrer" className="text-[#118C4C] hover:underline">
            WFP Global Food Prices Database
          </a>{" "}
          · CC BY-IGO · Retail averages, may vary by market and season.
        </p>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && !buying && (
          <DetailModal
            key="detail"
            item={selected}
            history={histories[selected.commodity]}
            onClose={() => setSelected(null)}
            onBuy={() => { setBuying(selected); setSelected(null) }}
          />
        )}
        {buying && (
          <BuyModal
            key="buy"
            item={buying}
            meta={META[buying.commodity] ?? DEFAULT_META}
            history={histories[buying.commodity]?.history ?? []}
            onClose={() => {
              setBuying(null)
              setAssetCount(getPositions().length)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
