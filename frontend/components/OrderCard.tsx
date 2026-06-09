"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Calendar, Package, MapPin, Phone, ExternalLink, CheckCircle, AlertTriangle,
  Trash2, ChevronRight, Hash, Clock, Truck, XCircle, RotateCcw,
  ShieldCheck, ShieldAlert, ShieldOff, Banknote, User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Order } from "@/lib/types"

// ── Shared status / escrow config ─────────────────────────────────────────────
export const ORDER_STATUS: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
  Pending:    { icon: <Clock className="h-3.5 w-3.5" />,     bg: "bg-amber-50 dark:bg-amber-950/40",    text: "text-amber-700 dark:text-amber-300",    border: "border-amber-300/70 dark:border-amber-700/50",    dot: "bg-amber-400" },
  Processing: { icon: <RotateCcw className="h-3.5 w-3.5" />, bg: "bg-sky-50 dark:bg-sky-950/40",        text: "text-sky-700 dark:text-sky-300",         border: "border-sky-300/70 dark:border-sky-700/50",        dot: "bg-sky-400" },
  Shipped:    { icon: <Truck className="h-3.5 w-3.5" />,     bg: "bg-violet-50 dark:bg-violet-950/40",  text: "text-violet-700 dark:text-violet-300",   border: "border-violet-300/70 dark:border-violet-700/50",  dot: "bg-violet-400" },
  Delivered:  { icon: <Package className="h-3.5 w-3.5" />,   bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300/70 dark:border-emerald-700/50", dot: "bg-emerald-400" },
  Cancelled:  { icon: <XCircle className="h-3.5 w-3.5" />,   bg: "bg-red-50 dark:bg-red-950/40",        text: "text-red-600 dark:text-red-400",         border: "border-red-300/70 dark:border-red-700/50",        dot: "bg-red-400" },
}

export const ESCROW_STATUS: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  locked:   { icon: <ShieldCheck className="h-3.5 w-3.5" />,  label: "Escrow Locked",    bg: "bg-blue-50 dark:bg-blue-950/40",      text: "text-blue-600 dark:text-blue-400" },
  released: { icon: <Banknote className="h-3.5 w-3.5" />,     label: "Payment Released", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  disputed: { icon: <ShieldAlert className="h-3.5 w-3.5" />,  label: "In Dispute",       bg: "bg-red-50 dark:bg-red-950/40",        text: "text-red-600 dark:text-red-400" },
  refunded: { icon: <ShieldOff className="h-3.5 w-3.5" />,    label: "Refunded",         bg: "bg-gray-100 dark:bg-gray-800/40",     text: "text-gray-600 dark:text-gray-400" },
}

const JOURNEY = ["Pending", "Processing", "Shipped", "Delivered"] as const

export function StatusPill({ status }: { status: string }) {
  const s = ORDER_STATUS[status] || ORDER_STATUS.Pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {status}
    </span>
  )
}

export function JourneyBar({ status }: { status: string }) {
  const idx = JOURNEY.indexOf(status as typeof JOURNEY[number])
  if (idx === -1) return null
  return (
    <div className="flex items-center gap-0 mb-1">
      {JOURNEY.map((step, i) => {
        const done = i <= idx
        const active = i === idx
        const s = ORDER_STATUS[step]
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-0.5 transition-transform ${active ? "scale-110" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? `${s.bg} ${s.border}` : "bg-muted border-border"}`}>
                <span className={`${done ? s.text : "text-muted-foreground"}`} style={{ transform: "scale(0.8)" }}>
                  {s.icon}
                </span>
              </div>
              <span className={`text-[9px] font-medium hidden sm:block ${done ? s.text : "text-muted-foreground"}`}>{step}</span>
            </div>
            {i < JOURNEY.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${i < idx ? "bg-[#118C4C]" : "bg-border"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onConfirmDelivery?: (orderId: string, escrowOrderId: string) => void
  onRaiseDispute?: (order: Order) => void
  onDelete?: (orderId: string) => void
  isProcessing?: boolean
  compact?: boolean // used in profile tab
}

export function OrderCard({ order, onConfirmDelivery, onRaiseDispute, onDelete, isProcessing, compact }: OrderCardProps) {
  const router = useRouter()
  const escrowOrderId = (order.items || []).find((i) => i.escrowOrderId)?.escrowOrderId
  const escrowStatus = order.escrowStatus
  const canAct = (escrowStatus === "locked" || (!!order.escrowTxHash && escrowStatus === "none")) && !!escrowOrderId
  const escrowMeta = escrowStatus ? ESCROW_STATUS[escrowStatus] : undefined
  const isCancelled = order.status === "Cancelled"
  const itemCount = order.items?.length ?? 0
  const previewItems = compact ? order.items?.slice(0, 1) : order.items

  return (
    <Card className="overflow-hidden border border-border hover:border-[#118C4C]/40 hover:shadow-md transition-all group">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border cursor-pointer"
        onClick={() => router.push(`/orders/${order.id}`)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-bold text-sm tracking-widest truncate">{order.id.slice(-6).toUpperCase()}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill status={order.status} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Journey bar */}
        {!isCancelled && !compact && <JourneyBar status={order.status} />}

        {/* Date + amount */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <div className="text-right">
            <span className="font-black text-[#118C4C] text-base">₦{Number(order.totalAmount).toLocaleString()}</span>
            {order.usdcAmount ? (
              <span className="block text-[10px] text-muted-foreground">{Number(order.usdcAmount).toFixed(4)} USDC</span>
            ) : null}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {previewItems?.map((item) => (
            <div key={item.productId} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/60">
              {item.image ? (
                <Image src={item.image} alt={item.productName} width={44} height={44}
                  className="rounded-lg object-cover flex-shrink-0 border border-border" unoptimized />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-muted flex-shrink-0 border border-border flex items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity} unit{item.quantity > 1 ? "s" : ""} · ₦{Number(item.pricePerUnit).toLocaleString()} each
                </p>
              </div>
              <p className="font-bold text-sm text-[#118C4C] flex-shrink-0">
                ₦{(item.quantity * item.pricePerUnit).toLocaleString()}
              </p>
            </div>
          ))}
          {compact && itemCount > 1 && (
            <p className="text-xs text-muted-foreground text-center py-1">+{itemCount - 1} more item{itemCount - 1 > 1 ? "s" : ""}</p>
          )}
        </div>

        {/* Farmer */}
        {!compact && order.farmers && order.farmers.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Sold by{" "}
              {order.farmers.map((f: any, i: number) => (
                <span key={f.id}>
                  <button
                    className="font-semibold text-foreground hover:text-[#118C4C] transition-colors"
                    onClick={(e) => { e.stopPropagation(); router.push(`/users/${f.id}`) }}
                  >{f.name || "Farmer"}</button>
                  {i < order.farmers!.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* Delivery */}
        {!compact && order.deliveryAddress && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 text-xs">
            <MapPin className="h-3.5 w-3.5 text-sky-500 flex-shrink-0 mt-px" />
            <div className="text-muted-foreground leading-relaxed min-w-0">
              <span className="font-semibold text-foreground">{order.deliveryFullName}</span>
              {" — "}{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}{order.deliveryState ? `, ${order.deliveryState}` : ""}
              {order.deliveryPhone && (
                <span className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{order.deliveryPhone}</span>
              )}
            </div>
          </div>
        )}

        {/* Escrow + tx */}
        {(escrowMeta || order.escrowTxHash) && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            {escrowMeta && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${escrowMeta.bg} ${escrowMeta.text}`}>
                {escrowMeta.icon} {escrowMeta.label}
              </span>
            )}
            {order.escrowTxHash && (
              <a
                href={`https://${process.env.NEXT_PUBLIC_CHAIN_ID === "8453" ? "" : "sepolia."}basescan.org/tx/${order.escrowTxHash}`}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] text-[#118C4C] hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {order.escrowTxHash.slice(0, 10)}…{order.escrowTxHash.slice(-6)}
              </a>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        {(onDelete || canAct || onConfirmDelivery) && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            {canAct && onConfirmDelivery && (
              <Button
                onClick={() => onConfirmDelivery(order.id, escrowOrderId!)}
                disabled={isProcessing}
                size="sm"
                className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5 w-full sm:w-auto"
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                {isProcessing ? "Processing…" : "Confirm Delivery"}
              </Button>
            )}
            {canAct && onRaiseDispute && (
              <Button
                onClick={() => onRaiseDispute(order)}
                disabled={isProcessing}
                variant="outline" size="sm"
                className="flex-1 gap-1.5 border-red-400/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 w-full sm:w-auto"
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" /> Raise Dispute
              </Button>
            )}
            {(!escrowStatus || escrowStatus === "none") && onDelete && (
              <Button onClick={() => onDelete(order.id)} variant="outline" size="sm"
                className="gap-1.5 text-xs text-red-600 border-red-400/40 hover:bg-red-50 dark:hover:bg-red-950/20 w-full sm:w-auto">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
            <Button
              variant="ghost" size="sm"
              onClick={() => router.push(`/orders/${order.id}`)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:ml-auto w-full sm:w-auto justify-center"
            >
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
