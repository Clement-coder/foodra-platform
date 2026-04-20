"use client"

import { CheckCircle, Package, Truck, Home, Clock } from "lucide-react"

const STEPS = [
  { key: "Pending", label: "Order Placed", icon: Clock },
  { key: "Processing", label: "Processing", icon: Package },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: Home },
]

interface Props {
  status: string
  shippedAt?: string | null
  deliveredAt?: string | null
  estimatedDelivery?: string | null
}

export function OrderTracker({ status, shippedAt, deliveredAt, estimatedDelivery }: Props) {
  if (status === "Cancelled") return null

  const currentIdx = STEPS.findIndex((s) => s.key === status)
  const activeIdx = currentIdx === -1 ? 0 : currentIdx

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted mx-8" />
        <div
          className="absolute left-8 top-5 h-0.5 bg-[#118C4C] transition-all duration-500"
          style={{ width: `${(activeIdx / (STEPS.length - 1)) * calc}%`.replace("calc", "") }}
          // inline style workaround
        />
        <div
          className="absolute top-5 h-0.5 bg-[#118C4C] transition-all duration-500"
          style={{
            left: "2rem",
            width: `calc(${(activeIdx / (STEPS.length - 1)) * 100}% - 4rem)`,
          }}
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon
          const done = i <= activeIdx
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? "bg-[#118C4C] border-[#118C4C] text-white"
                  : "bg-background border-muted text-muted-foreground"
              }`}>
                {done && i < activeIdx ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className={`text-xs font-medium text-center ${done ? "text-[#118C4C]" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {estimatedDelivery && status !== "Delivered" && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          Estimated delivery: <span className="font-medium text-foreground">{new Date(estimatedDelivery).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}</span>
        </p>
      )}
      {shippedAt && status === "Shipped" && (
        <p className="text-xs text-center text-muted-foreground mt-1">
          Shipped on {new Date(shippedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
      {deliveredAt && status === "Delivered" && (
        <p className="text-xs text-center text-green-600 mt-1 font-medium">
          ✓ Delivered on {new Date(deliveredAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
        </p>
      )}
    </div>
  )
}
