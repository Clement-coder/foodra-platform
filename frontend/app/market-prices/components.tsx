"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ShoppingBag, TrendingUp, TrendingDown, Minus, BarChart3, MapPin, Calendar } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { buyAsset } from "@/lib/assetStore"
import { WalletSuccessScreen } from "@/components/WalletSuccessScreen"
import { Modal } from "@/components/Modal"

export const META: Record<string, { emoji: string; color: string; bg: string; desc: string }> = {
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
export const DEFAULT_META = { emoji: "🌱", color: "#118C4C", bg: "#d1fae5", desc: "Agricultural commodity" }

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getChange(hist: CommodityHistory["history"] | undefined, currentPrice: number) {
  if (!hist || hist.length < 2) return null
  const prev = hist[hist.length - 2].price
  return { value: ((currentPrice - prev) / prev) * 100, prev }
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: {value:number}[]; label?: string; unit: string }) {
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
  history: CommodityHistory["history"]
  color: string
  unit: string
  height?: string | number
}) {
  if (!history.length) return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground opacity-40">No data</div>
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

// ─── Detail + Buy modal (uses platform's bottom-sheet Modal) ─────────────────
export function CommodityDetailModal({
  item, history, onClose, onBought
}: {
  item: CommodityPrice
  history: CommodityHistory | undefined
  onClose: () => void
  onBought: () => void
}) {
  const meta = META[item.commodity] ?? DEFAULT_META
  const hist = history?.history ?? []
  const change = getChange(hist, item.price)
  const isUp = !change || change.value >= 0

  const [range, setRange] = useState<"3m"|"6m"|"1y"|"all">("all")
  const [qty, setQty] = useState("1")
  const [step, setStep] = useState<"detail"|"buy"|"success">("detail")

  const q = parseFloat(qty) || 0
  const total = q * item.price
  const min = hist.length ? Math.min(...hist.map(h => h.price)) : 0
  const max = hist.length ? Math.max(...hist.map(h => h.price)) : 0
  const rangeMap = { "3m": -3, "6m": -6, "1y": -12, "all": 0 }
  const sliced = rangeMap[range] ? hist.slice(rangeMap[range]) : hist

  const confirmBuy = () => {
    if (q <= 0) return
    buyAsset(item.commodity, item.displayName, meta.emoji, item.unit, q, item.price)
    setStep("success")
  }

  return (
    <Modal isOpen title={step === "buy" ? `Buy ${item.displayName}` : item.displayName} onClose={onClose}>
      <AnimatePresence mode="wait">
        {step === "success" ? (
          <WalletSuccessScreen
            key="success"
            title="Asset Purchased! 🎉"
            subtitle={`${q} ${item.unit} of ${item.displayName} added to your portfolio at ₦${item.price.toLocaleString()}/${item.unit}`}
            onDone={() => { onBought(); onClose() }}
            doneLabel="View Portfolio"
          />
        ) : step === "buy" ? (
          <motion.div key="buy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 pb-4">
            {/* Commodity summary */}
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: meta.bg }}>
              <span className="text-4xl">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{item.displayName}</p>
                <p className="text-xs mt-0.5" style={{ color: meta.color }}>{meta.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-extrabold text-lg">₦{item.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per {item.unit}</p>
              </div>
            </div>

            {/* Mini chart */}
            <div className="h-20 w-full">
              <PriceChart history={hist.slice(-6)} color={meta.color} unit={item.unit} />
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Quantity ({item.unit})
              </label>
              <input
                type="number" min="0.1" step="0.1" value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full mt-2 rounded-2xl border border-border bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
              />
              {/* Quick qty buttons */}
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

            {/* Cost breakdown */}
            <div className="rounded-2xl border border-border bg-muted/40 divide-y divide-border">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Unit price</span>
                <span className="font-semibold">₦{item.price.toLocaleString()} / {item.unit}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-semibold">{q} {item.unit}</span>
              </div>
              {item.usdPrice > 0 && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">USD equivalent</span>
                  <span className="font-semibold">${(item.usdPrice * q).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between px-4 py-3">
                <span className="font-bold">Total cost</span>
                <span className="font-extrabold text-[#118C4C] text-lg">₦{Math.round(total).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-2xl px-4 py-3 flex items-start gap-2">
              <span className="text-base shrink-0">🔒</span>
              <span>Prototype mode — assets stored locally in your browser. No real money moves.</span>
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep("detail")}
                className="flex-1 rounded-2xl border border-border py-3 font-semibold text-sm hover:bg-muted transition-colors">
                ← Back
              </button>
              <button onClick={confirmBuy} disabled={q <= 0}
                className="flex-1 rounded-2xl bg-[#118C4C] text-white py-3 font-bold text-sm disabled:opacity-40 hover:bg-[#0d7a42] transition-colors flex items-center justify-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Confirm Buy
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pb-4">
            {/* Price hero */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl">{meta.emoji}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                    /{item.unit}
                  </span>
                </div>
                <p className="text-4xl font-extrabold tracking-tight">₦{item.price.toLocaleString()}</p>
                {item.usdPrice > 0 && <p className="text-sm text-muted-foreground mt-0.5">≈ ${item.usdPrice.toFixed(2)} USD</p>}
              </div>
              {change && (
                <div className={`text-right px-3 py-2 rounded-2xl ${isUp ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  <p className={`text-xl font-extrabold ${isUp ? "text-green-600" : "text-red-500"}`}>
                    {isUp ? "▲" : "▼"} {Math.abs(change.value).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">vs last month</p>
                </div>
              )}
            </div>

            {/* Range selector + Chart */}
            <div>
              <div className="flex gap-1.5 mb-3">
                {(["3m","6m","1y","all"] as const).map(r => (
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

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "All-time High", value: `₦${max.toLocaleString()}`, icon: "📈" },
                { label: "All-time Low",  value: `₦${min.toLocaleString()}`, icon: "📉" },
                { label: "Months of data", value: `${hist.length}`, icon: "📅" },
                { label: "Markets tracked", value: `${item.marketCount}`, icon: "🏪" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 bg-muted/50 rounded-2xl p-3">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-bold text-sm">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="flex items-start gap-3 bg-muted/40 rounded-2xl p-4">
              <BarChart3 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: meta.color }} />
              <p className="text-sm text-muted-foreground leading-relaxed">{meta.desc}. Prices are monthly retail averages across {item.marketCount} WFP-monitored Nigerian markets.</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Latest data: {new Date(item.date).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</span>
              <span>·</span>
              <MapPin className="h-3 w-3" />
              <span>{item.marketCount} markets</span>
            </div>

            <button
              onClick={() => setStep("buy")}
              className="w-full rounded-2xl bg-[#118C4C] text-white py-4 font-bold text-base hover:bg-[#0d7a42] transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-5 w-5" />
              Buy {item.displayName} as Asset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
