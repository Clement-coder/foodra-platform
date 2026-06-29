"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, Package, ShoppingCart, Bell, BellOff,
  ArrowUpRight, ArrowDownRight, Minus, History, Trash2, X
} from "lucide-react"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import {
  getPositions, getTrades, sellAsset, deliverAsset, setPriceAlert,
  calcPortfolio, getPriceHistory, predictNextPrice,
  type AssetPosition, type AssetTrade
} from "@/lib/assetStore"

// ─── Emoji map (same as market-prices page) ───────────────────────────────────
const EMOJI: Record<string, string> = {
  "Rice (local)": "🌾", "Rice (imported)": "🍚", "Maize flour": "🌽",
  "Beans (white)": "🫘", "Beans (red)": "🫘", "Cowpeas": "🟤",
  "Tomatoes": "🍅", "Yam": "🍠", "Onions": "🧅", "Groundnuts": "🥜",
  "Millet": "🌾", "Sorghum": "🌿", "Oil (palm)": "🫙", "Oil (vegetable)": "🛢️",
  "Meat (beef)": "🥩", "Fish": "🐟",
}

// ─── Sell / Deliver modal ─────────────────────────────────────────────────────
function ActionModal({
  pos, livePrice, mode, onClose, onDone
}: {
  pos: AssetPosition
  livePrice: number
  mode: "sell" | "deliver"
  onClose: () => void
  onDone: () => void
}) {
  const [qty, setQty] = useState<string>("1")
  const q = parseFloat(qty) || 0
  const total = q * livePrice
  const profit = q * (livePrice - pos.avgBuyPrice)

  const submit = () => {
    if (q <= 0 || q > pos.quantity) return
    if (mode === "sell") sellAsset(pos.commodity, q, livePrice)
    else deliverAsset(pos.commodity, q, livePrice)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {mode === "sell" ? "💹 Sell Asset" : "📦 Deliver to Me"}
          </h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="bg-muted rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-3xl">{EMOJI[pos.commodity] ?? "🌱"}</span>
          <div>
            <p className="font-semibold">{pos.displayName}</p>
            <p className="text-xs text-muted-foreground">Available: {pos.quantity} {pos.unit}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Quantity ({pos.unit})</label>
            <input
              type="number" min="0.1" step="0.1" max={pos.quantity}
              value={qty} onChange={e => setQty(e.target.value)}
              className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
            />
          </div>

          <div className="text-sm space-y-1 bg-muted/50 rounded-xl p-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Live price</span>
              <span className="font-medium">₦{livePrice.toLocaleString()}/{pos.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your avg cost</span>
              <span className="font-medium">₦{pos.avgBuyPrice.toLocaleString()}/{pos.unit}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground">{mode === "sell" ? "Proceeds" : "Delivery value"}</span>
              <span className="font-bold">₦{total.toLocaleString()}</span>
            </div>
            {mode === "sell" && (
              <div className={`flex justify-between font-semibold ${profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                <span>P&L</span>
                <span>{profit >= 0 ? "+" : ""}₦{Math.round(profit).toLocaleString()}</span>
              </div>
            )}
          </div>

          {mode === "deliver" && (
            <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-2">
              📦 This will convert your asset to a physical order. A delivery will be arranged to your registered address.
            </p>
          )}
        </div>

        <button
          onClick={submit}
          disabled={q <= 0 || q > pos.quantity}
          className="w-full mt-4 rounded-xl py-2.5 font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: mode === "sell" ? "#118C4C" : "#b45309" }}
        >
          {mode === "sell"
            ? `Sell ${q || 0} ${pos.unit} → ₦${Math.round(total).toLocaleString()}`
            : `Request Delivery (${q || 0} ${pos.unit})`}
        </button>
      </motion.div>
    </div>
  )
}

// ─── Alert modal ──────────────────────────────────────────────────────────────
function AlertModal({ pos, onClose, onDone }: { pos: AssetPosition; onClose: () => void; onDone: () => void }) {
  const [price, setPrice] = useState<string>(pos.priceAlert?.toString() ?? "")

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">🔔 Price Alert</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Get notified when <strong>{pos.displayName}</strong> reaches your target price.
        </p>
        <label className="text-sm font-medium text-muted-foreground">Alert price (₦ per {pos.unit})</label>
        <input
          type="number" value={price} onChange={e => setPrice(e.target.value)}
          className="w-full mt-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
          placeholder="e.g. 1500"
        />
        <button
          onClick={() => { setPriceAlert(pos.commodity, parseFloat(price)); onDone() }}
          disabled={!price || isNaN(parseFloat(price))}
          className="w-full mt-4 rounded-xl py-2.5 bg-[#118C4C] text-white font-semibold disabled:opacity-40"
        >
          Set Alert
        </button>
      </motion.div>
    </div>
  )
}

// ─── Position card ────────────────────────────────────────────────────────────
function PositionCard({
  pos, livePrice, onRefresh
}: {
  pos: AssetPosition
  livePrice: number | undefined
  onRefresh: () => void
}) {
  const [modal, setModal] = useState<"sell" | "deliver" | "alert" | null>(null)
  const current = livePrice ?? pos.avgBuyPrice
  const value = current * pos.quantity
  const pnl = (current - pos.avgBuyPrice) * pos.quantity
  const pnlPct = ((current - pos.avgBuyPrice) / pos.avgBuyPrice) * 100
  const history = getPriceHistory(pos.commodity)
  const prediction = predictNextPrice([...history, current])

  const isUp = pnl >= 0

  const close = () => { setModal(null); onRefresh() }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        {/* Header strip */}
        <div className={`h-1.5 w-full ${isUp ? "bg-green-500" : "bg-red-500"}`} />

        <div className="p-4 space-y-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{EMOJI[pos.commodity] ?? "🌱"}</span>
              <div>
                <p className="font-bold text-sm leading-tight">{pos.displayName}</p>
                <p className="text-xs text-muted-foreground">{pos.quantity} {pos.unit} held</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isUp ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {isUp ? "+" : ""}{pnlPct.toFixed(1)}%
            </div>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground">Live price</p>
              <p className="font-bold">₦{current.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground">Avg cost</p>
              <p className="font-bold">₦{pos.avgBuyPrice.toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground">Value</p>
              <p className="font-bold">₦{Math.round(value).toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-2 ${isUp ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
              <p className="text-xs text-muted-foreground">P&L</p>
              <p className={`font-bold ${isUp ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
                {isUp ? "+" : ""}₦{Math.round(pnl).toLocaleString()}
              </p>
            </div>
          </div>

          {/* AI Prediction */}
          {prediction !== null && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl px-3 py-2 text-xs">
              <span>🤖</span>
              <span className="text-indigo-700 dark:text-indigo-300">
                AI trend estimate: <strong>₦{prediction.toLocaleString()}</strong> next period
              </span>
              <span className="ml-auto text-indigo-400">~estimate</span>
            </div>
          )}

          {/* Alert badge */}
          {pos.priceAlert && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Bell className="h-3 w-3" />
              Alert set at ₦{pos.priceAlert.toLocaleString()}/{pos.unit}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setModal("sell")}
              className="flex flex-col items-center gap-0.5 rounded-xl bg-[#118C4C] text-white py-2 text-xs font-semibold hover:bg-[#0d7a42] transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Sell
            </button>
            <button
              onClick={() => setModal("deliver")}
              className="flex flex-col items-center gap-0.5 rounded-xl bg-amber-600 text-white py-2 text-xs font-semibold hover:bg-amber-700 transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              Deliver
            </button>
            <button
              onClick={() => setModal("alert")}
              className="flex flex-col items-center gap-0.5 rounded-xl border border-border bg-background text-foreground py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              {pos.priceAlert ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              Alert
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {modal === "sell" && <ActionModal pos={pos} livePrice={current} mode="sell" onClose={() => setModal(null)} onDone={close} />}
        {modal === "deliver" && <ActionModal pos={pos} livePrice={current} mode="deliver" onClose={() => setModal(null)} onDone={close} />}
        {modal === "alert" && <AlertModal pos={pos} onClose={() => setModal(null)} onDone={close} />}
      </AnimatePresence>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const [positions, setPositions] = useState<AssetPosition[]>([])
  const [trades, setTrades] = useState<AssetTrade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<"portfolio" | "history">("portfolio")

  const refresh = useCallback(() => {
    setPositions(getPositions())
    setTrades(getTrades())
  }, [])

  useEffect(() => {
    refresh()
    fetch("/api/commodity-prices")
      .then(r => r.json())
      .then((data: CommodityPrice[]) => {
        const map: Record<string, number> = {}
        data.forEach(d => { map[d.commodity] = d.price })
        setLivePrices(map)
      })
      .catch(() => {/* use stored prices */})
  }, [refresh])

  const { totalCost, totalValue, pnl, pnlPct } = calcPortfolio(positions, livePrices)
  const isUp = pnl >= 0

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] text-white">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">📊</span>
                <span className="text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full">Commodity Portfolio</span>
              </div>
              <h1 className="text-3xl font-extrabold">My Assets</h1>
              <p className="text-white/70 text-sm mt-1">Farm commodities you own — hold, sell, or deliver.</p>
            </div>

            {positions.length > 0 && (
              <div className="bg-white/10 rounded-2xl px-4 py-3 text-right">
                <p className="text-xs text-white/60 mb-0.5">Total Portfolio</p>
                <p className="text-2xl font-extrabold">₦{Math.round(totalValue).toLocaleString()}</p>
                <div className={`flex items-center justify-end gap-1 text-sm font-semibold mt-0.5 ${isUp ? "text-green-300" : "text-red-300"}`}>
                  {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {isUp ? "+" : ""}₦{Math.round(pnl).toLocaleString()} ({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)
                </div>
                <p className="text-xs text-white/40 mt-0.5">Cost basis: ₦{Math.round(totalCost).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 max-w-5xl flex gap-1 pt-2">
          {(["portfolio", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors capitalize ${tab === t ? "border-b-2 border-[#118C4C] text-[#118C4C]" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "portfolio" ? `📊 Holdings (${positions.length})` : `📋 History (${trades.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {tab === "portfolio" ? (
          positions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🌱</p>
              <p className="text-lg font-semibold text-foreground">No assets yet</p>
              <p className="text-muted-foreground text-sm mt-1">Go to Market Prices and buy your first commodity asset.</p>
              <a
                href="/market-prices"
                className="inline-block mt-4 bg-[#118C4C] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#0d7a42] transition-colors"
              >
                Browse Market Prices →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {positions.map(pos => (
                  <PositionCard
                    key={pos.commodity}
                    pos={pos}
                    livePrice={livePrices[pos.commodity]}
                    onRefresh={refresh}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : (
          trades.length === 0 ? (
            <div className="text-center py-20">
              <History className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-muted-foreground">No trades yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <span className="text-xl">{EMOJI[t.commodity] ?? "🌱"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.timestamp).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${t.type === "buy" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : t.type === "sell" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {t.type === "deliver" ? "📦 Deliver" : t.type === "buy" ? "💰 Buy" : "💹 Sell"}
                    </span>
                    <p className="text-sm font-bold mt-0.5">₦{Math.round(t.total).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.quantity} {t.type === "deliver" ? "delivered" : "units"} @ ₦{t.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
