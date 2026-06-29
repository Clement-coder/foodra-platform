"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, BellOff, Package, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Modal } from "@/components/Modal"
import { WalletSuccessScreen } from "@/components/WalletSuccessScreen"
import { PriceChart, META, DEFAULT_META } from "@/app/market-prices/components"
import {
  sellAsset, deliverAsset, setPriceAlert, getPriceHistory,
  predictNextPrice, type AssetPosition,
} from "@/lib/assetStore"
import type { CommodityHistory } from "@/app/api/commodity-history/route"

// ─── Sell Modal ───────────────────────────────────────────────────────────────
export function SellModal({ pos, livePrice, onClose, onDone }: {
  pos: AssetPosition; livePrice: number; onClose: () => void; onDone: () => void
}) {
  const [qty, setQty] = useState("1")
  const [step, setStep] = useState<"form"|"success">("form")
  const q = parseFloat(qty) || 0
  const proceeds = q * livePrice
  const pnl = q * (livePrice - pos.avgBuyPrice)
  const isUp = pnl >= 0
  const meta = META[pos.commodity] ?? DEFAULT_META

  const confirm = () => {
    if (q <= 0 || q > pos.quantity) return
    sellAsset(pos.commodity, q, livePrice)
    setStep("success")
  }

  return (
    <Modal isOpen title="Sell Asset" onClose={onClose}>
      <AnimatePresence mode="wait">
        {step === "success" ? (
          <WalletSuccessScreen
            key="ok"
            title="Asset Sold! 💹"
            subtitle={`You sold ${q} ${pos.unit} of ${pos.displayName} for ₦${Math.round(proceeds).toLocaleString()}`}
            onDone={() => { onDone(); onClose() }}
            doneLabel="Done"
          />
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: meta.bg }}>
              <span className="text-4xl">{meta.emoji}</span>
              <div>
                <p className="font-bold">{pos.displayName}</p>
                <p className="text-xs text-muted-foreground">You hold {pos.quantity} {pos.unit}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Quantity to sell ({pos.unit})
              </label>
              <input type="number" min="0.1" step="0.1" max={pos.quantity} value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full mt-2 rounded-2xl border border-border bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#118C4C]" />
              <div className="flex gap-2 mt-2">
                {[0.25, 0.5, 0.75, 1].map(f => (
                  <button key={f} onClick={() => setQty(String(parseFloat((pos.quantity * f).toFixed(2))))}
                    className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                    {f === 1 ? "Max" : `${f * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 divide-y divide-border">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Live price</span>
                <span className="font-semibold">₦{livePrice.toLocaleString()}/{pos.unit}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Your avg cost</span>
                <span className="font-semibold">₦{pos.avgBuyPrice.toLocaleString()}/{pos.unit}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-semibold">{q} {pos.unit}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Proceeds</span>
                <span className="font-bold">₦{Math.round(proceeds).toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="font-bold">Profit / Loss</span>
                <span className={`font-extrabold text-lg ${isUp ? "text-green-600" : "text-red-500"}`}>
                  {isUp ? "+" : ""}₦{Math.round(pnl).toLocaleString()}
                </span>
              </div>
            </div>

            <button onClick={confirm} disabled={q <= 0 || q > pos.quantity}
              className="w-full rounded-2xl bg-[#118C4C] text-white py-4 font-bold text-base disabled:opacity-40 hover:bg-[#0d7a42] transition-colors flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sell {q || 0} {pos.unit} · ₦{Math.round(proceeds).toLocaleString()}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

// ─── Deliver Modal ────────────────────────────────────────────────────────────
export function DeliverModal({ pos, livePrice, onClose, onDone }: {
  pos: AssetPosition; livePrice: number; onClose: () => void; onDone: () => void
}) {
  const [qty, setQty] = useState("1")
  const [step, setStep] = useState<"form"|"success">("form")
  const q = parseFloat(qty) || 0
  const meta = META[pos.commodity] ?? DEFAULT_META

  const confirm = () => {
    if (q <= 0 || q > pos.quantity) return
    deliverAsset(pos.commodity, q, livePrice)
    setStep("success")
  }

  return (
    <Modal isOpen title="Deliver to Me" onClose={onClose}>
      <AnimatePresence mode="wait">
        {step === "success" ? (
          <WalletSuccessScreen
            key="ok"
            title="Delivery Requested! 📦"
            subtitle={`${q} ${pos.unit} of ${pos.displayName} will be delivered to your registered address.`}
            onDone={() => { onDone(); onClose() }}
            doneLabel="View Orders"
          />
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: meta.bg }}>
              <span className="text-4xl">{meta.emoji}</span>
              <div>
                <p className="font-bold">{pos.displayName}</p>
                <p className="text-xs text-muted-foreground">You hold {pos.quantity} {pos.unit}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
              <Package className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                Converting your asset to a physical order. Foodra will ship to your registered delivery address. You will be notified once confirmed.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Quantity ({pos.unit})
              </label>
              <input type="number" min="0.1" step="0.1" max={pos.quantity} value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full mt-2 rounded-2xl border border-border bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#118C4C]" />
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 divide-y divide-border">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Delivery quantity</span>
                <span className="font-semibold">{q} {pos.unit}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Market value</span>
                <span className="font-bold">₦{Math.round(q * livePrice).toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Remaining after</span>
                <span className="font-semibold">{Math.max(0, parseFloat((pos.quantity - q).toFixed(3)))} {pos.unit}</span>
              </div>
            </div>

            <button onClick={confirm} disabled={q <= 0 || q > pos.quantity}
              className="w-full rounded-2xl bg-amber-600 text-white py-4 font-bold text-base disabled:opacity-40 hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
              <Package className="h-5 w-5" />
              Request Delivery · {q || 0} {pos.unit}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

// ─── Alert Modal ──────────────────────────────────────────────────────────────
export function AlertModal({ pos, onClose, onDone }: {
  pos: AssetPosition; onClose: () => void; onDone: () => void
}) {
  const [price, setPrice] = useState(pos.priceAlert?.toString() ?? "")

  return (
    <Modal isOpen title="Price Alert" onClose={onClose}>
      <div className="space-y-5 pb-4">
        <p className="text-sm text-muted-foreground">
          Get notified when <strong>{pos.displayName}</strong> reaches your target price.
        </p>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Alert at price (₦ per {pos.unit})
          </label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="e.g. 1500"
            className="w-full mt-2 rounded-2xl border border-border bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#118C4C]" />
        </div>
        <button
          onClick={() => { setPriceAlert(pos.commodity, parseFloat(price)); onDone(); onClose() }}
          disabled={!price || isNaN(parseFloat(price))}
          className="w-full rounded-2xl bg-[#118C4C] text-white py-4 font-bold disabled:opacity-40 hover:bg-[#0d7a42] transition-colors flex items-center justify-center gap-2">
          <Bell className="h-5 w-5" />
          Set Alert at ₦{parseFloat(price) ? parseFloat(price).toLocaleString() : "—"}
        </button>
      </div>
    </Modal>
  )
}

// ─── Position Card ────────────────────────────────────────────────────────────
export function PositionCard({ pos, livePrice, history, onRefresh }: {
  pos: AssetPosition; livePrice: number | undefined; history?: CommodityHistory; onRefresh: () => void
}) {
  const [modal, setModal] = useState<"sell"|"deliver"|"alert"|null>(null)
  const meta = META[pos.commodity] ?? DEFAULT_META
  const current = livePrice ?? pos.avgBuyPrice
  const value   = current * pos.quantity
  const pnl     = (current - pos.avgBuyPrice) * pos.quantity
  const pnlPct  = ((current - pos.avgBuyPrice) / pos.avgBuyPrice) * 100
  const isUp    = pnl >= 0

  const localHistory = getPriceHistory(pos.commodity)
  const prediction   = predictNextPrice([...localHistory, current])
  const hist         = history?.history ?? []

  const close = () => { setModal(null); onRefresh() }

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Top accent */}
        <div className={`h-1 w-full ${isUp ? "bg-green-500" : "bg-red-500"}`} />

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: meta.bg }}>
                {meta.emoji}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{pos.displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pos.quantity} {pos.unit} held</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-xl ${
              isUp ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                   : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {isUp ? "+" : ""}{pnlPct.toFixed(1)}%
            </div>
          </div>

          {/* Chart */}
          {hist.length > 1 && (
            <div className="h-16 w-full -mx-1">
              <PriceChart history={hist.slice(-12)} color={meta.color} unit={pos.unit} />
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Live Price", value: `₦${current.toLocaleString()}` },
              { label: "Avg Cost",   value: `₦${pos.avgBuyPrice.toLocaleString()}` },
              { label: "Position Value", value: `₦${Math.round(value).toLocaleString()}` },
              {
                label: "Profit / Loss",
                value: `${isUp ? "+" : ""}₦${Math.round(pnl).toLocaleString()}`,
                highlight: isUp ? "text-green-600 dark:text-green-400" : "text-red-500",
              },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-2.5">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`font-bold text-sm mt-0.5 ${s.highlight ?? ""}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* AI prediction */}
          {prediction !== null && (
            <div className="flex items-center gap-2.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl px-3 py-2.5 text-xs">
              <span className="text-base">🤖</span>
              <div>
                <p className="font-semibold text-indigo-700 dark:text-indigo-300">AI Trend Estimate</p>
                <p className="text-indigo-600 dark:text-indigo-400 mt-0.5">Next period: <strong>₦{prediction.toLocaleString()}</strong> <span className="opacity-60">· Linear projection</span></p>
              </div>
            </div>
          )}

          {/* Alert badge */}
          {pos.priceAlert && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
              <Bell className="h-3.5 w-3.5 shrink-0" />
              Alert set at ₦{pos.priceAlert.toLocaleString()}/{pos.unit}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setModal("sell")}
              className="flex flex-col items-center gap-1 rounded-xl bg-[#118C4C] text-white py-2.5 text-xs font-bold hover:bg-[#0d7a42] transition-colors">
              <TrendingUp className="h-4 w-4" />
              Sell
            </button>
            <button onClick={() => setModal("deliver")}
              className="flex flex-col items-center gap-1 rounded-xl bg-amber-600 text-white py-2.5 text-xs font-bold hover:bg-amber-700 transition-colors">
              <Package className="h-4 w-4" />
              Deliver
            </button>
            <button onClick={() => setModal("alert")}
              className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background text-foreground py-2.5 text-xs font-bold hover:bg-muted transition-colors">
              {pos.priceAlert ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              Alert
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {modal === "sell"    && <SellModal    key="sell"    pos={pos} livePrice={current} onClose={() => setModal(null)} onDone={close} />}
        {modal === "deliver" && <DeliverModal key="deliver" pos={pos} livePrice={current} onClose={() => setModal(null)} onDone={close} />}
        {modal === "alert"   && <AlertModal   key="alert"   pos={pos}                    onClose={() => setModal(null)} onDone={close} />}
      </AnimatePresence>
    </>
  )
}
