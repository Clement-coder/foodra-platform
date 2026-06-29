"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, ArrowDownRight, History, TrendingUp, Package, ShoppingBag } from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis,
} from "recharts"
import { getPositions, getTrades, calcPortfolio, type AssetPosition, type AssetTrade } from "@/lib/assetStore"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { META, DEFAULT_META } from "@/app/market-prices/components"
import { PositionCard } from "./position-card"

const TRADE_ICONS: Record<string, string> = { buy: "💰", sell: "💹", deliver: "📦" }
const TRADE_COLORS: Record<string, string> = {
  buy:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  sell:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  deliver: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

// ─── Portfolio donut ──────────────────────────────────────────────────────────
function PortfolioPie({ positions, livePrices }: { positions: AssetPosition[]; livePrices: Record<string, number> }) {
  const data = positions.map(p => ({
    name: p.displayName,
    value: Math.round((livePrices[p.commodity] ?? p.avgBuyPrice) * p.quantity),
    color: (META[p.commodity] ?? DEFAULT_META).color,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
          dataKey="value" strokeWidth={2} stroke="var(--background)">
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip
          formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
          contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid var(--border)", background: "var(--background)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── P&L sparkline ────────────────────────────────────────────────────────────
function PnlSparkline({ trades }: { trades: AssetTrade[] }) {
  // cumulative P&L over time from trades
  const points = trades
    .slice().reverse()
    .filter(t => t.type !== "buy")
    .map((t, i) => ({
      i,
      pnl: t.type === "sell" ? t.total : 0,
      label: new Date(t.timestamp).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    }))

  if (!points.length) return null
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide />
        <Area type="monotone" dataKey="pnl" stroke="#22c55e" strokeWidth={2}
          fill="url(#pnlGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AssetsPage() {
  const [positions, setPositions] = useState<AssetPosition[]>([])
  const [trades, setTrades]       = useState<AssetTrade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [histories, setHistories]   = useState<Record<string, CommodityHistory>>({})
  const [tab, setTab] = useState<"portfolio"|"history">("portfolio")

  const refresh = useCallback(() => {
    setPositions(getPositions())
    setTrades(getTrades())
  }, [])

  useEffect(() => {
    refresh()
    Promise.all([
      fetch("/api/commodity-prices").then(r => r.ok ? r.json() : []),
      fetch("/api/commodity-history").then(r => r.ok ? r.json() : []),
    ]).then(([pData, hData]: [CommodityPrice[], CommodityHistory[]]) => {
      const pm: Record<string, number> = {}
      pData.forEach(d => { pm[d.commodity] = d.price })
      setLivePrices(pm)
      const hm: Record<string, CommodityHistory> = {}
      hData.forEach(h => { hm[h.commodity] = h })
      setHistories(hm)
    })
  }, [refresh])

  const { totalCost, totalValue, pnl, pnlPct } = calcPortfolio(positions, livePrices)
  const isUp = pnl >= 0

  const totalBought   = trades.filter(t => t.type === "buy").reduce((s, t) => s + t.total, 0)
  const totalSold     = trades.filter(t => t.type === "sell").reduce((s, t) => s + t.total, 0)
  const totalDelivered = trades.filter(t => t.type === "deliver").reduce((s, t) => s + t.total, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] text-white">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📊</span>
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full">Commodity Portfolio</span>
              </div>
              <h1 className="text-3xl font-extrabold">My Assets</h1>
              <p className="text-white/60 text-sm mt-0.5">Farm commodities you own — hold, sell, or deliver.</p>
            </div>

            {positions.length > 0 && (
              <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-right">
                <p className="text-xs text-white/50 mb-0.5">Portfolio Value</p>
                <p className="text-3xl font-extrabold">₦{Math.round(totalValue).toLocaleString()}</p>
                <div className={`flex items-center justify-end gap-1 text-sm font-bold mt-0.5 ${isUp ? "text-green-300" : "text-red-300"}`}>
                  {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {isUp ? "+" : ""}₦{Math.round(pnl).toLocaleString()} ({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)
                </div>
                <p className="text-xs text-white/30 mt-0.5">Cost basis: ₦{Math.round(totalCost).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Fund breakdown row */}
          {positions.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Total Bought",    value: `₦${Math.round(totalBought).toLocaleString()}`,    icon: <ShoppingBag className="h-4 w-4" />, color: "bg-blue-500/20 text-blue-200" },
                { label: "Total Sold",      value: `₦${Math.round(totalSold).toLocaleString()}`,      icon: <TrendingUp className="h-4 w-4" />,  color: "bg-green-500/20 text-green-200" },
                { label: "Total Delivered", value: `₦${Math.round(totalDelivered).toLocaleString()}`, icon: <Package className="h-4 w-4" />,     color: "bg-amber-500/20 text-amber-200" },
              ].map(s => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
                  <p className="text-base font-extrabold">{s.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 max-w-3xl flex gap-1 pt-2">
          {(["portfolio", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold transition-colors capitalize
                ${tab === t ? "border-b-2 border-[#118C4C] text-[#118C4C]" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "portfolio" ? `📊 Holdings (${positions.length})` : `📋 History (${trades.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <AnimatePresence mode="wait">
          {tab === "portfolio" ? (
            <motion.div key="port" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {positions.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">🌱</p>
                  <p className="text-lg font-bold">No assets yet</p>
                  <p className="text-muted-foreground text-sm mt-1">Buy your first commodity on the market prices page.</p>
                  <a href="/market-prices"
                    className="inline-flex items-center gap-2 mt-5 bg-[#118C4C] text-white rounded-2xl px-5 py-3 text-sm font-bold hover:bg-[#0d7a42] transition-colors">
                    <ShoppingBag className="h-4 w-4" />
                    Browse Market Prices
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Allocation chart */}
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-bold text-sm mb-3">Portfolio Allocation</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <PortfolioPie positions={positions} livePrices={livePrices} />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        {positions.map(p => {
                          const val = Math.round((livePrices[p.commodity] ?? p.avgBuyPrice) * p.quantity)
                          const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : "0"
                          const meta = META[p.commodity] ?? DEFAULT_META
                          return (
                            <div key={p.commodity} className="flex items-center gap-2">
                              <span className="text-base shrink-0">{meta.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className="truncate">{p.displayName}</span>
                                  <span className="shrink-0 ml-1">{pct}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* P&L sparkline */}
                  {trades.some(t => t.type === "sell") && (
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="font-bold text-sm mb-1">Realised Gains Over Time</p>
                      <PnlSparkline trades={trades} />
                    </div>
                  )}

                  {/* Position cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {positions.map(pos => (
                        <PositionCard
                          key={pos.commodity}
                          pos={pos}
                          livePrice={livePrices[pos.commodity]}
                          history={histories[pos.commodity]}
                          onRefresh={refresh}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {trades.length === 0 ? (
                <div className="text-center py-20">
                  <History className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                  <p className="text-muted-foreground">No trade history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Buys",      count: trades.filter(t=>t.type==="buy").length,     total: totalBought,    icon: "💰", cls: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900" },
                      { label: "Sells",     count: trades.filter(t=>t.type==="sell").length,    total: totalSold,      icon: "💹", cls: "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900" },
                      { label: "Deliveries",count: trades.filter(t=>t.type==="deliver").length, total: totalDelivered, icon: "📦", cls: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900" },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl border p-3 ${s.cls}`}>
                        <p className="text-xl">{s.icon}</p>
                        <p className="font-extrabold text-lg mt-1">{s.count}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-xs font-semibold mt-0.5">₦{Math.round(s.total).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Trade list */}
                  <div className="rounded-2xl border border-border overflow-hidden bg-card">
                    {trades.map((t, i) => {
                      const meta = META[t.commodity] ?? DEFAULT_META
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`flex items-center gap-3 px-4 py-3.5 ${i < trades.length - 1 ? "border-b border-border" : ""}`}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: meta.bg }}>
                            {meta.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{t.displayName}</p>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg capitalize shrink-0 ${TRADE_COLORS[t.type]}`}>
                                {TRADE_ICONS[t.type]} {t.type}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t.quantity} {t.type === "deliver" ? "delivered" : "units"} · ₦{t.price.toLocaleString()}/{t.quantity === 1 ? "unit" : "unit"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.timestamp).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm">₦{Math.round(t.total).toLocaleString()}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
