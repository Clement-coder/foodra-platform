"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag, TrendingUp, TrendingDown, BarChart3, MapPin, Calendar,
  ArrowUpRight, ArrowDownRight, ChevronLeft, Lock, BrainCircuit,
  LineChart, CandlestickChart, Building2, Flame, Snowflake,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { buyAsset, predictNextPrice } from "@/lib/assetStore"
import { WalletSuccessScreen } from "@/components/WalletSuccessScreen"
import { Modal } from "@/components/Modal"

export const META: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
  "Rice (local)":    { emoji: "🌾", color: "#b45309", bg: "#fef3c7", desc: "Locally grown white rice, a dietary staple across Nigeria" },
  "Rice (imported)": { emoji: "🍚", color: "#1d4ed8", bg: "#dbeafe", desc: "Imported parboiled rice from Thailand and India" },
  "Maize flour":     { emoji: "🌽", color: "#d97706", bg: "#fef9c3", desc: "Ground white maize flour, base for ogi and tuwo shinkafa" },
  "Beans (white)":   { emoji: "🫘", color: "#7c3aed", bg: "#ede9fe", desc: "White-eyed beans (oloyin), rich in protein and widely consumed" },
  "Beans (red)":     { emoji: "🫘", color: "#dc2626", bg: "#fee2e2", desc: "Red kidney beans, popular in stews and bean pottage" },
  "Cowpeas":         { emoji: "🟤", color: "#92400e", bg: "#fef3c7", desc: "Black-eyed peas, a vital affordable protein source in Nigeria" },
  "Tomatoes":        { emoji: "🍅", color: "#dc2626", bg: "#fee2e2", desc: "Fresh tomatoes, an essential base for Nigerian soups and stews" },
  "Yam":             { emoji: "🍠", color: "#b45309", bg: "#fef3c7", desc: "White yam, a culturally significant and widely traded staple crop" },
  "Onions":          { emoji: "🧅", color: "#d97706", bg: "#fef9c3", desc: "Red and yellow onions used in virtually every Nigerian dish" },
  "Groundnuts":      { emoji: "🥜", color: "#b45309", bg: "#fef3c7", desc: "Peanuts used for cooking oil, groundnut soup, and as a snack" },
  "Millet":          { emoji: "🌾", color: "#059669", bg: "#d1fae5", desc: "Pearl millet, a drought-resistant grain grown in northern Nigeria" },
  "Sorghum":         { emoji: "🌿", color: "#065f46", bg: "#d1fae5", desc: "Versatile cereal grain used for tuwo, pap, and local brewing" },
  "Oil (palm)":      { emoji: "🫙", color: "#dc2626", bg: "#fee2e2", desc: "Red palm oil extracted from oil palm fruit, cornerstone of Nigerian cuisine" },
  "Oil (vegetable)": { emoji: "🛢️", color: "#d97706", bg: "#fef9c3", desc: "Refined vegetable oil for frying and general cooking" },
  "Meat (beef)":     { emoji: "🥩", color: "#dc2626", bg: "#fee2e2", desc: "Fresh beef sourced from local cattle markets across Nigeria" },
  "Fish":            { emoji: "🐟", color: "#1d4ed8", bg: "#dbeafe", desc: "Fresh and dried fish, a key protein source in coastal and inland markets" },
}
export const DEFAULT_META = { emoji: "🌱", color: "#118C4C", bg: "#d1fae5", desc: "Agricultural commodity traded across Nigerian markets" }

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getChange(hist: CommodityHistory["history"] | undefined, currentPrice: number) {
  if (!hist || hist.length < 2) return null
  const prev = hist[hist.length - 2].price
  return { value: ((currentPrice - prev) / prev) * 100, prev }
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-0.5">
        {label ? new Date(label).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : ""}
      </p>
      <p className="font-bold text-sm">₦{payload[0].value.toLocaleString()}<span className="text-muted-foreground font-normal">/{unit}</span></p>
    </div>
  )
}

// ─── Reusable price chart ─────────────────────────────────────────────────────
export function PriceChart({ history, color, unit, height = "100%" }: {
  history: CommodityHistory["history"]; color: string; unit: string; height?: string | number
}) {
  if (!history.length) return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground opacity-40">No chart data</div>
  )
  const isUp = history.length > 1 && history[history.length - 1].price >= history[0].price
  const lineColor = isUp ? "#22c55e" : "#ef4444"
  const gradId = `g${color.replace(/[^a-z0-9]/gi, "")}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={history} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        {history.length > 1 && (
          <ReferenceLine y={history[0].price} stroke={lineColor} strokeDasharray="3 3" strokeOpacity={0.3} />
        )}
        <Area type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2}
          fill={`url(#${gradId})`} dot={false}
          activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
          isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Detail + Buy modal ───────────────────────────────────────────────────────
export function CommodityDetailModal({
  item, history, onClose, onBought
}: {
  item: CommodityPrice; history: CommodityHistory | undefined; onClose: () => void; onBought: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const change = getChange(hist, item.price)
  const isUp = !change || change.value >= 0

  const [range, setRange] = useState<"3m" | "6m" | "1y" | "all">("all")
  const [qty, setQty] = useState("1")
  const [step, setStep] = useState<"detail" | "buy" | "success">("detail")

  const q = parseFloat(qty) || 0
  const total = q * item.price
  const min = hist.length ? Math.min(...hist.map(h => h.price)) : 0
  const max = hist.length ? Math.max(...hist.map(h => h.price)) : 0
  const rangeMap = { "3m": -3, "6m": -6, "1y": -12, "all": 0 }
  const sliced = rangeMap[range] ? hist.slice(rangeMap[range]) : hist
  const prediction = predictNextPrice(hist.map(h => h.price))

  const confirmBuy = () => {
    if (q <= 0) return
    buyAsset(item.commodity, item.displayName, meta.emoji, item.unit, q, item.price)
    setStep("success")
  }

  return (
    <Modal isOpen title={step === "buy" ? `Buy ${item.displayName}` : item.displayName} onClose={onClose}>
      <AnimatePresence mode="wait">
        {/* ── Success ── */}
        {step === "success" ? (
          <WalletSuccessScreen
            key="success"
            title="Asset Purchased!"
            subtitle={`${q} ${item.unit} of ${item.displayName} added to your portfolio at ₦${item.price.toLocaleString()}/${item.unit}`}
            onDone={() => { onBought(); onClose() }}
            doneLabel="View Portfolio"
          />
        ) : step === "buy" ? (
          /* ── Buy step ── */
          <motion.div key="buy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 pb-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ background: meta.bg }}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">{item.displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meta.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-xl">₦{item.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per {item.unit}</p>
              </div>
            </div>

            <div className="h-16 w-full">
              <PriceChart history={hist.slice(-6)} color={meta.color} unit={item.unit} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity ({item.unit})</label>
              <input type="number" min="0.1" step="0.1" value={qty} onChange={e => setQty(e.target.value)}
                className="w-full mt-2 rounded-2xl border border-border bg-background px-4 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#118C4C]" />
              <div className="flex gap-2 mt-2">
                {[1, 5, 10, 25, 50].map(n => (
                  <button key={n} onClick={() => setQty(String(n))}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors
                      ${qty === String(n) ? "bg-[#118C4C] text-white border-[#118C4C]" : "border-border text-muted-foreground hover:bg-muted"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 divide-y divide-border">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" />Unit price</span>
                <span className="font-semibold">₦{item.price.toLocaleString()} / {item.unit}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><LineChart className="h-3.5 w-3.5" />Quantity</span>
                <span className="font-semibold">{q} {item.unit}</span>
              </div>
              {item.usdPrice > 0 && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Building2 className="h-3.5 w-3.5" />USD equivalent</span>
                  <span className="font-semibold">${(item.usdPrice * q).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3">
                <span className="font-bold text-sm">Total cost</span>
                <span className="font-extrabold text-[#118C4C] text-xl">₦{Math.round(total).toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3">
              <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">Prototype — assets stored locally. No real money moves.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("detail")}
                className="flex items-center gap-1.5 rounded-2xl border border-border px-4 py-3 font-semibold text-sm hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={confirmBuy} disabled={q <= 0}
                className="flex-1 rounded-2xl bg-[#118C4C] text-white py-3 font-bold text-sm disabled:opacity-40 hover:bg-[#0d7a42] transition-colors flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Confirm Purchase
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── Detail step ── */
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pb-4">
            {/* Price hero */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-2xl" style={{ background: meta.bg }}>
                    {meta.emoji}
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ borderColor: meta.color + "40", background: meta.bg, color: meta.color }}>
                    /{item.unit}
                  </span>
                </div>
                <p className="text-4xl font-extrabold tracking-tight">₦{item.price.toLocaleString()}</p>
                {item.usdPrice > 0 && <p className="text-sm text-muted-foreground mt-0.5">≈ ${item.usdPrice.toFixed(2)} USD</p>}
              </div>
              {change && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${isUp ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  {isUp ? <ArrowUpRight className="h-5 w-5 text-green-600" /> : <ArrowDownRight className="h-5 w-5 text-red-500" />}
                  <div>
                    <p className={`text-xl font-extrabold leading-none ${isUp ? "text-green-600" : "text-red-500"}`}>
                      {isUp ? "+" : ""}{change.value.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">vs last month</p>
                  </div>
                </div>
              )}
            </div>

            {/* Range + Chart */}
            <div>
              <div className="flex gap-1.5 mb-3">
                {(["3m", "6m", "1y", "all"] as const).map(r => (
                  <button key={r} onClick={() => setRange(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${range === r ? "bg-[#118C4C] text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="h-44 w-full">
                <PriceChart history={sliced} color={meta.color} unit={item.unit} />
              </div>
            </div>

            {/* Stats grid — Lucide icons only */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "All-time High",   value: `₦${max.toLocaleString()}`,  Icon: Flame,        color: "text-orange-500" },
                { label: "All-time Low",    value: `₦${min.toLocaleString()}`,  Icon: Snowflake,    color: "text-blue-500" },
                { label: "Months of data",  value: `${hist.length}`,            Icon: Calendar,     color: "text-purple-500" },
                { label: "Markets tracked", value: `${item.marketCount}`,       Icon: MapPin,       color: "text-[#118C4C]" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 bg-muted/50 rounded-2xl p-3">
                  <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm">
                    <s.Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-bold text-sm">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Trend Estimate */}
            {prediction !== null && (
              <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl px-4 py-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    AI Trend Estimate <LineChart className="h-3 w-3" />
                  </p>
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200 mt-0.5">
                    ₦{prediction.toLocaleString()} <span className="text-xs font-normal text-indigo-500">/ {item.unit} next period</span>
                  </p>
                  <p className="text-xs text-indigo-400 mt-0.5">Linear regression · indicative only</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="flex items-start gap-3 bg-muted/40 rounded-2xl p-4">
              <BarChart3 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: meta.color }} />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {meta.desc}. Prices shown are monthly retail averages across {item.marketCount} WFP-monitored Nigerian markets.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Latest: {new Date(item.date).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</span>
              <span>·</span>
              <MapPin className="h-3.5 w-3.5" />
              <span>{item.marketCount} markets</span>
            </div>

            <button onClick={() => setStep("buy")}
              className="w-full rounded-2xl bg-[#118C4C] text-white py-4 font-bold text-base hover:bg-[#0d7a42] transition-colors flex items-center justify-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Buy {item.displayName} as Asset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
