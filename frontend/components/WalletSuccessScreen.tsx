"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Sparkles, Zap, Star, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  title: string
  subtitle: string
  onDone: () => void
  doneLabel?: string
}

// Particle burst items — fire once, no looping rings
const BURST_ITEMS = [
  { x: -60, y: -55, delay: 0,    icon: Sparkles, color: "#118C4C" },
  { x:  55, y: -60, delay: 0.06, icon: Star,     color: "#f59e0b" },
  { x: -72, y:  15, delay: 0.1,  icon: Zap,      color: "#1d4ed8" },
  { x:  68, y:  20, delay: 0.08, icon: Sparkles, color: "#118C4C" },
  { x: -30, y:  70, delay: 0.15, icon: Leaf,     color: "#059669" },
  { x:  34, y:  68, delay: 0.12, icon: Star,     color: "#1d4ed8" },
  { x:   0, y: -75, delay: 0.03, icon: Sparkles, color: "#f59e0b" },
  { x: -55, y: -18, delay: 0.18, icon: Star,     color: "#118C4C" },
  { x:  60, y: -20, delay: 0.07, icon: Zap,      color: "#059669" },
]

export function WalletSuccessScreen({ title, subtitle, onDone, doneLabel = "Done" }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-8">
      {/* Icon with one-shot particle burst — no looping rings */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {BURST_ITEMS.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{ left: "50%", top: "50%", marginLeft: -8, marginTop: -8 }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.75, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon style={{ color: p.color }} className="h-4 w-4" strokeWidth={2.5} />
            </motion.div>
          )
        })}

        {/* Soft glow halo — single fade-in, no pulse loop */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(17,140,76,0.18) 0%, transparent 70%)" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1.3 }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
        />

        {/* Main check circle — clean spring pop, no looping */}
        <motion.div
          className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#118C4C] via-[#16a85e] to-[#1aaf61] flex items-center justify-center shadow-xl shadow-[#118C4C]/20"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 280, delay: 0.08 }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.28, type: "spring", stiffness: 380, damping: 22 }}
          >
            <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2} />
          </motion.div>
        </motion.div>
      </div>

      {/* Text block */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.32 }}
        className="space-y-2"
      >
        <h3 className="text-2xl font-black text-foreground tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">{subtitle}</p>
      </motion.div>

      {/* Slim auto-dismiss progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-[180px]"
      >
        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #118C4C, #1aaf61)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Auto-closing…</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}>
        <Button
          onClick={onDone}
          className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white px-8 py-2.5 rounded-2xl font-semibold text-sm h-auto"
        >
          {doneLabel}
        </Button>
      </motion.div>
    </div>
  )
}
