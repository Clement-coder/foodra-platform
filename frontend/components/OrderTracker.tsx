"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"
import { CheckCircle, Package, Truck, Home, Clock } from "lucide-react"

const STEPS = [
  { key: "Pending",    label: "Order Placed", icon: Clock,    color: "from-amber-400 to-amber-500" },
  { key: "Processing", label: "Processing",   icon: Package,  color: "from-blue-400 to-blue-500" },
  { key: "Shipped",    label: "Shipped",      icon: Truck,    color: "from-purple-400 to-purple-500" },
  { key: "Delivered",  label: "Delivered",    icon: Home,     color: "from-[#118C4C] to-[#1aaf61]" },
]

interface Props {
  status: string
  shippedAt?: string | null
  deliveredAt?: string | null
  estimatedDelivery?: string | null
}

export function OrderTracker({ status, shippedAt, deliveredAt, estimatedDelivery }: Props) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-red-500">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold">Order Cancelled</span>
      </div>
    )
  }

  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  const currentIdx = STEPS.findIndex((s) => s.key === status)
  const activeIdx = currentIdx === -1 ? 0 : currentIdx
  const progressPct = activeIdx / (STEPS.length - 1)

  // Spring-animated progress width
  const rawProgress = useMotionValue(0)
  const springProgress = useSpring(rawProgress, { stiffness: 40, damping: 14 })
  const widthPct = useTransform(springProgress, (v) => `${v * 100}%`)

  useEffect(() => {
    if (inView) rawProgress.set(progressPct)
  }, [inView, progressPct])

  return (
    <div ref={ref} className="py-5 px-1">
      {/* Track */}
      <div className="relative flex items-start justify-between">
        {/* Background rail */}
        <div className="absolute left-5 right-5 top-5 h-1 bg-muted rounded-full" />

        {/* Animated fill */}
        <motion.div
          className="absolute left-5 top-5 h-1 rounded-full bg-gradient-to-r from-amber-400 via-blue-400 via-purple-400 to-[#118C4C] origin-left"
          style={{ width: widthPct }}
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon
          const done = i <= activeIdx
          const isCurrent = i === activeIdx
          const delay = i * 0.12

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 z-10 flex-1">
              {/* Node */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay }}
                className="relative"
              >
                {/* Pulse ring on current step */}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-40`}
                  />
                )}

                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md transition-all ${
                  done
                    ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-md`
                    : "bg-background border-muted text-muted-foreground"
                }`}>
                  {done && !isCurrent ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={inView ? { scale: 1, rotate: 0 } : {}}
                      transition={{ type: "spring", stiffness: 300, delay: delay + 0.1 }}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
              </motion.div>

              {/* Label */}
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: delay + 0.1 }}
                className={`text-[10px] sm:text-xs font-semibold text-center leading-tight ${
                  done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
                {isCurrent && (
                  <span className="block">
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-[9px] text-[#118C4C] font-bold"
                    >
                      ● now
                    </motion.span>
                  </span>
                )}
              </motion.span>
            </div>
          )
        })}
      </div>

      {/* Meta info */}
      <div className="mt-4 text-center space-y-1">
        {estimatedDelivery && status !== "Delivered" && (
          <motion.p
            initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6 }}
            className="text-xs text-muted-foreground"
          >
            Estimated delivery:{" "}
            <span className="font-semibold text-foreground">
              {new Date(estimatedDelivery).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </motion.p>
        )}
        {shippedAt && status === "Shipped" && (
          <p className="text-xs text-muted-foreground">
            Shipped{" "}
            <span className="font-medium text-foreground">
              {new Date(shippedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        )}
        {deliveredAt && status === "Delivered" && (
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
            className="text-xs text-[#118C4C] font-bold"
          >
            ✓ Delivered on {new Date(deliveredAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
          </motion.p>
        )}
      </div>
    </div>
  )
}
