"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, ShoppingBag } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { buyAsset } from "@/lib/assetStore"

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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">
        {label ? new Date(label).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : ""}
      </p>
      <p className="font-bold text-foreground text-sm">₦{payload[0].value.toLocaleString()}<span className="text-muted-foreground font-normal">/{unit}</span></p>
    </div>
  )
}

// ─── Price Chart ──────────────────────────────────────────────────────────────
export function PriceChart({ history, color, unit }: { history: CommodityHistory["history"]; color: string; unit: string }) {
  if (!history.length) return (
    <div className="h-full flex items-center justify-center text-xs text-muted-foreground opacity-50">No history</div>
  )
  const isUp = history.length > 1 && history[history.length - 1].price >= history[0].price
  const chartColor = isUp ? "#22c55e" : "#ef4444"
  const gradId = `grad-${color.replace("#", "")}`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={history} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        {history.length > 1 && (
          <ReferenceLine y={history[0].price} stroke={chartColor} strokeDasharray="3 3" strokeOpacity={0.4} />
        )}
        <Area
          type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2}
          fill={`url(#${gradId})`} dot={false} activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Buy Modal ────────────────────────────────────────────────────────────────
export function BuyModal({
  item, meta, history, onClose
}: {
  item: CommodityPrice
  meta: typeof DEFAULT_META
  history: CommodityHistory["history"]
  onClose: () => void
}) {
  const [qty, setQty] = useState("1")
  const [done, setDone] = useState(false)
  const q = parseFloat(qty) || 0
  const total = q * item.price

  // compute change vs last month
  const prev = history.length > 1 ? history[history.length - 2].price : null
  const change = prev ? ((item.price - prev) / prev) * 100 : null
  const isUp = change != null && change >= 0

  const confirm = () => {
    if (q <= 0) return
    buyAsset(item.commodity, item.displayName, meta.emoji, item.unit, q, item.price)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="p-6 text-center">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-bold text-xl">Asset Purchased!</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              {q} {item.unit} of {item.displayName} added to your portfolio.
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold">Close</button>
              <a href="/assets" className="flex-1 rounded-xl bg-[#118C4C] text-white py-2.5 text-sm font-semibold text-center">View Portfolio →</a>
            </div>
          </div>
        ) : (
          <>
            {/* Modal chart header */}
            <div className="relative h-32" style={{ background: `linear-gradient(135deg, ${meta.bg}, ${meta.bg}99)` }}>
              <div className="absolute inset-0 px-4 py-3">
                <PriceChart history={history} color={meta.color} unit={item.unit} />
              </div>
              <div className="absolute top-3 left-4 flex items-center gap-2">
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{item.displayName}</p>
                  {change != null && (
                    <p className={`text-xs font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}>
                      {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% vs last month
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="absolute top-3 right-3 bg-white/60 dark:bg-black/30 rounded-full p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground">Current price</p>
                  <p className="text-3xl font-extrabold">₦{item.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">per {item.unit}</p>
                </div>
                {item.usdPrice > 0 && (
                  <p className="text-sm text-muted-foreground">≈ ${item.usdPrice.toFixed(2)} USD</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Quantity ({item.unit})
                </label>
                <input
                  type="number" min="0.1" step="0.1" value={qty}
                  onChange={e => setQty(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                />
              </div>

              <div className="bg-muted/60 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">₦{item.price.toLocaleString()} × {q || 0} {item.unit}</span>
                  <span className="font-bold">₦{Math.round(total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>Avg of {item.marketCount} Nigerian markets</span>
                  <span>WFP data</span>
                </div>
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
                🔒 Prototype — assets stored locally. No real money moves.
              </p>

              <button
                onClick={confirm} disabled={q <= 0}
                className="w-full rounded-xl bg-[#118C4C] text-white py-3 font-bold text-base disabled:opacity-40 hover:bg-[#0d7a42] transition-colors"
              >
                <ShoppingBag className="inline h-4 w-4 mr-2 -mt-0.5" />
                Buy {q || 0} {item.unit} · ₦{Math.round(total).toLocaleString()}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
