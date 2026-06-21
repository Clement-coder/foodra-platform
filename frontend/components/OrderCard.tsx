"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Calendar, Package, MapPin, Phone, CheckCircle, AlertTriangle,
  Trash2, ChevronRight, Hash, Clock, Truck, XCircle, RotateCcw, User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Order } from "@/lib/types"

export const ORDER_STATUS: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
  Pending:    { icon: <Clock className="h-3.5 w-3.5" />,     bg: "bg-amber-50 dark:bg-amber-950/40",     text: "text-amber-700 dark:text-amber-300",    border: "border-amber-300/70 dark:border-amber-700/50",    dot: "bg-amber-400" },
  Processing: { icon: <RotateCcw className="h-3.5 w-3.5" />, bg: "bg-sky-50 dark:bg-sky-950/40",         text: "text-sky-700 dark:text-sky-300",         border: "border-sky-300/70 dark:border-sky-700/50",        dot: "bg-sky-400" },
  Shipped:    { icon: <Truck className="h-3.5 w-3.5" />,     bg: "bg-violet-50 dark:bg-violet-950/40",   text: "text-violet-700 dark:text-violet-300",   border: "border-violet-300/70 dark:border-violet-700/50",  dot: "bg-violet-400" },
  Delivered:  { icon: <Package className="h-3.5 w-3.5" />,   bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300/70 dark:border-emerald-700/50", dot: "bg-emerald-400" },
  Cancelled:  { icon: <XCircle className="h-3.5 w-3.5" />,   bg: "bg-red-50 dark:bg-red-950/40",         text: "text-red-600 dark:text-red-400",         border: "border-red-300/70 dark:border-red-700/50",        dot: "bg-red-400" },
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
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${done ? `${s.bg} ${s.border}` : "bg-muted border-border"}`}>
                <span className={`${done ? s.text : "text-muted-foreground"}`} style={{ transform: "scale(0.8)" }}>{s.icon}</span>
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
  onConfirmDelivery?: (orderId: string) => void
  onRaiseDispute?: (order: Order) => void
  onDelete?: (orderId: string) => void
  isProcessing?: boolean
  compact?: boolean
}

export function OrderCard({ order, onConfirmDelivery, onRaiseDispute, onDelete, isProcessing, compact }: OrderCardProps) {
  const router = useRouter()
  const canConfirm = order.status === "Shipped"
  const canDispute = order.status !== "Cancelled" && order.status !== "Delivered"
  const isCancelled = order.status === "Cancelled"
  const previewItems = compact ? order.items?.slice(0, 1) : order.items

  return (
    <Card className="overflow-hidden border border-border hover:border-[#118C4C]/40 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border cursor-pointer"
        onClick={() => router.push(`/orders/${order.id}`)}>
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-bold text-sm tracking-widest truncate">{order.id.slice(-6).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill status={order.status} />
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {!isCancelled && !compact && <JourneyBar status={order.status} />}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="font-black text-[#118C4C] text-base">₦{Number(order.totalAmount).toLocaleString()}</span>
        </div>

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
                <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × ₦{Number(item.pricePerUnit).toLocaleString()}</p>
              </div>
              <p className="font-bold text-sm text-[#118C4C] flex-shrink-0">₦{(item.quantity * item.pricePerUnit).toLocaleString()}</p>
            </div>
          ))}
          {compact && (order.items?.length ?? 0) > 1 && (
            <p className="text-xs text-muted-foreground text-center py-1">+{(order.items?.length ?? 0) - 1} more item{(order.items?.length ?? 0) > 2 ? "s" : ""}</p>
          )}
        </div>

        {!compact && order.farmers && order.farmers.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Sold by{" "}
              {order.farmers.map((f, i) => (
                <span key={f.id}>
                  <button className="font-semibold text-foreground hover:text-[#118C4C] transition-colors"
                    onClick={(e) => { e.stopPropagation(); router.push(`/users/${f.id}`) }}>{f.name || "Seller"}</button>
                  {i < order.farmers!.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          </div>
        )}

        {!compact && order.deliveryAddress && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/50 text-xs">
            <MapPin className="h-3.5 w-3.5 text-sky-500 flex-shrink-0 mt-px" />
            <div className="text-muted-foreground min-w-0">
              <span className="font-semibold text-foreground">{order.deliveryFullName}</span>
              {" — "}{order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ""}{order.deliveryState ? `, ${order.deliveryState}` : ""}
              {order.deliveryPhone && (
                <span className="flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{order.deliveryPhone}</span>
              )}
            </div>
          </div>
        )}

        {(onDelete || onConfirmDelivery || onRaiseDispute) && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            {canConfirm && onConfirmDelivery && (
              <Button onClick={() => onConfirmDelivery(order.id)} disabled={isProcessing} size="sm"
                className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5">
                <CheckCircle className="h-4 w-4" />
                {isProcessing ? "Processing…" : "Confirm Delivery"}
              </Button>
            )}
            {canDispute && onRaiseDispute && (
              <Button onClick={() => onRaiseDispute(order)} disabled={isProcessing} variant="outline" size="sm"
                className="flex-1 gap-1.5 border-red-400/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                <AlertTriangle className="h-4 w-4" /> Raise Dispute
              </Button>
            )}
            {onDelete && order.status === "Pending" && (
              <Button onClick={() => onDelete(order.id)} variant="outline" size="sm"
                className="gap-1.5 text-xs text-red-600 border-red-400/40 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${order.id}`)}
              className="gap-1.5 text-xs text-muted-foreground sm:ml-auto">
              View Details <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
