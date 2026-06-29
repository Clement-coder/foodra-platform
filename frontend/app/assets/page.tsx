"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowUpRight, ArrowDownRight, History, TrendingUp, Package, ShoppingBag,
  BarChart3, Wallet, PieChart as PieIcon, Clock, Coins, ExternalLink,
  BrainCircuit, LineChart as LineChartIcon,
} from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis,
} from "recharts"
import { getPositions, getTrades, calcPortfolio, type AssetPosition, type AssetTrade } from "@/lib/assetStore"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { META, DEFAULT_META } from "@/app/market-prices/components"
import { CommodityIcon } from "@/app/market-prices/page"
import { PositionCard } from "./position-card"
import { AssetsPageSkeleton } from "@/components/Skeleton"

const TRADE_COLORS: Record<string, string> = {
  buy:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  sell:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  deliver: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}
const TRADE_LABEL: Record<string, string> = { buy: "Buy", sell: "Sell", deliver: "Deliver" }

// ─── Donut chart ──────────────────────────────────────────────────────────────
function PortfolioPie({ positions, livePrices }: { positions: AssetPosition[]; livePrices: Record<string, number> }) {
  const data = positions.map(p => ({
    name: p.displayName,
    value: Math.round((livePrices[p.commodity] ?? p.avgBuyPrice) * p.quantity),
    color: (META[p.commodity] ?? DEFAULT_META).color,
  }))
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
          dataKey="value" strokeWidth={2} stroke="var(--background)">
          {data.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <RTooltip
          formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
          contentStyle={{ borderRadius: "12px", fontSize: "12px", border: "1px solid var(--border)", background: "var(--background)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── P&L area chart ───────────────────────────────────────────────────────────
function PnlChart({ trades }: { trades: AssetTrade[] }) {
  const points = trades.slice().reverse()
    .filter(t => t.type !== "buy")
    .map((t, i) => ({
      i, pnl: t.type === "sell" ? t.total : 0,
      label: new Date(t.timestamp).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    }))
  if (!points.length) return null
  return (
    <ResponsiveContainer width="100%" height={64}>
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
  const [positions, setPositions]   = useState<AssetPosition[]>([])
  const [trades, setTrades]         = useState<AssetTrade[]>([])
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [histories, setHistories]   = useState<Record<string, CommodityHistory>>({})
  const [tab, setTab]     = useState<"portfolio" | "history">("portfolio")
  const [loading, setLoading] = useState(true)

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
    }).finally(() => setLoading(false))
  }, [refresh])

  const { totalCost, totalValue, pnl, pnlPct } = calcPortfolio(positions, livePrices)
  const isUp = pnl >= 0

  const totalBought    = trades.filter(t => t.type === "buy").reduce((s, t) => s + t.total, 0)
  const totalSold      = trades.filter(t => t.type === "sell").reduce((s, t) => s + t.total, 0)
  const totalDelivered = trades.filter(t => t.type === "deliver").reduce((s, t) => s + t.total, 0)

  const TABS = [
    { id: "portfolio", label: "Holdings", icon: BarChart3, count: positions.length },
    { id: "history",   label: "History",  icon: History,   count: trades.length },
  ] as const

  if (loading) return <AssetsPageSkeleton />

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] text-white">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                  <Coins className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full">Commodity Portfolio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Assets</h1>
              <p className="text-white/60 text-sm mt-1">Farm commodities you own — hold, sell, or deliver</p>
            </div>

            {positions.length > 0 && (
              <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 text-right shrink-0">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Wallet className="h-4 w-4 text-white/50" />
                  <p className="text-xs text-white/50">Portfolio Value</p>
                </div>
                <p className="text-3xl font-extrabold">₦{Math.round(totalValue).toLocaleString()}</p>
                <div className={`flex items-center justify-end gap-1 text-sm font-bold mt-1 ${isUp ? "text-green-300" : "text-red-300"}`}>
                  {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {isUp ? "+" : ""}₦{Math.round(pnl).toLocaleString()}
                  <span className="font-normal text-xs opacity-70">({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)</span>
                </div>
                <p className="text-xs text-white/30 mt-1">Cost basis: ₦{Math.round(totalCost).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Stats row */}
          {positions.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Total Invested",  value: totalBought,    Icon: ShoppingBag, color: "from-blue-500/30 to-blue-600/10",    border: "border-blue-400/20",   text: "text-blue-200" },
                { label: "Total Sold",      value: totalSold,      Icon: TrendingUp,  color: "from-green-500/30 to-green-600/10",  border: "border-green-400/20",  text: "text-green-200" },
                { label: "Total Delivered", value: totalDelivered, Icon: Package,     color: "from-amber-500/30 to-amber-600/10",  border: "border-amber-400/20",  text: "text-amber-200" },
              ].map(s => (
                <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl px-3 py-3`}>
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center mb-2">
                    <s.Icon className={`h-3.5 w-3.5 ${s.text}`} />
                  </div>
                  <p className="text-lg font-extrabold">₦{Math.round(s.value).toLocaleString()}</p>
                  <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Market Prices CTA ──────────────────────────────────────────── */}
      <div className="bg-[#118C4C]/8 border-b border-[#118C4C]/15">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between">
          <p className="text-sm text-[#118C4C] font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {positions.length > 0
              ? `Tracking ${positions.length} commodity position${positions.length > 1 ? "s" : ""}`
              : "Build your commodity portfolio"}
          </p>
          <a href="/market-prices" className="text-xs font-bold text-[#118C4C] hover:underline flex items-center gap-1">
            Browse Markets <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 max-w-5xl flex gap-1 pt-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors
                ${tab === t.id ? "border-b-2 border-[#118C4C] text-[#118C4C]" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? "bg-[#118C4C]/15 text-[#118C4C]" : "bg-muted text-muted-foreground"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <AnimatePresence mode="wait">
          {/* ── Portfolio tab ─────────────────────────────────────────── */}
          {tab === "portfolio" ? (
            <motion.div key="port" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {positions.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Coins className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <p className="text-lg font-bold">No assets yet</p>
                  <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                    Buy your first commodity on the market prices page and build your portfolio.
                  </p>
                  <a href="/market-prices"
                    className="inline-flex items-center gap-2 mt-5 bg-[#118C4C] text-white rounded-2xl px-5 py-3 text-sm font-bold hover:bg-[#0d7a42] transition-colors">
                    <BarChart3 className="h-4 w-4" />
                    Browse Market Prices
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Allocation card */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <PieIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-bold text-sm">Portfolio Allocation</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 w-40">
                        <PortfolioPie positions={positions} livePrices={livePrices} />
                      </div>
                      <div className="flex-1 space-y-2.5 min-w-0">
                        {positions.map(p => {
                          const val = Math.round((livePrices[p.commodity] ?? p.avgBuyPrice) * p.quantity)
                          const pct = totalValue > 0 ? (val / totalValue) * 100 : 0
                          const meta = META[p.commodity] ?? DEFAULT_META
                          return (
                            <div key={p.commodity}>
                              <div className="flex justify-between text-xs font-medium mb-1">
                                <span className="truncate flex items-center gap-1.5">
                                  <CommodityIcon commodity={p.commodity} className="h-3 w-3 shrink-0" style={{ color: meta.color }} />
                                  {p.displayName}
                                </span>
                                <span className="shrink-0 ml-2 text-muted-foreground">{pct.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: meta.color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Realised gains chart */}
                  {trades.some(t => t.type === "sell") && (
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="font-bold text-sm">Realised Gains Over Time</p>
                      </div>
                      <PnlChart trades={trades} />
                    </div>
                  )}

                  {/* Position cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            /* ── History tab ──────────────────────────────────────────── */
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {trades.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <p className="text-lg font-bold">No trade history yet</p>
                  <p className="text-muted-foreground text-sm mt-1">Your buy, sell, and delivery records appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Buys",       count: trades.filter(t => t.type === "buy").length,     total: totalBought,    Icon: ShoppingBag, cls: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900",  iconCls: "text-blue-600" },
                      { label: "Sells",      count: trades.filter(t => t.type === "sell").length,    total: totalSold,      Icon: TrendingUp,  cls: "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900", iconCls: "text-green-600" },
                      { label: "Deliveries", count: trades.filter(t => t.type === "deliver").length, total: totalDelivered, Icon: Package,     cls: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900", iconCls: "text-amber-600" },
                    ].map(s => (
                      <div key={s.label} className={`rounded-2xl border p-3 ${s.cls}`}>
                        <s.Icon className={`h-4 w-4 mb-1.5 ${s.iconCls}`} />
                        <p className="font-extrabold text-xl">{s.count}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-xs font-semibold mt-0.5">₦{Math.round(s.total).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Trade list */}
                  <div className="rounded-2xl border border-border overflow-hidden bg-card">
                    {trades.map((t, i) => {
                      const meta = META[t.commodity] ?? DEFAULT_META
                      const TradeIcon = t.type === "buy" ? ShoppingBag : t.type === "sell" ? TrendingUp : Package
                      return (
                        <motion.div key={t.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`flex items-center gap-3 px-4 py-4 ${i < trades.length - 1 ? "border-b border-border" : ""}`}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: meta.bg }}>
                            <CommodityIcon commodity={t.commodity} className="h-5 w-5" style={{ color: meta.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm truncate">{t.displayName}</p>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 ${TRADE_COLORS[t.type]}`}>
                                <TradeIcon className="h-3 w-3" />
                                {TRADE_LABEL[t.type]}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t.quantity} units · ₦{t.price.toLocaleString()} per unit
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(t.timestamp).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold">₦{Math.round(t.total).toLocaleString()}</p>
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
