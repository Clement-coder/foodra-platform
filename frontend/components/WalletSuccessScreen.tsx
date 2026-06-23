"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  title: string
  subtitle: string
  onDone: () => void
  doneLabel?: string
}

const PARTICLES = [
  { x: -60, y: -55, emoji: "✨", delay: 0 },
  { x: 55,  y: -60, emoji: "🎉", delay: 0.05 },
  { x: -70, y: 20,  emoji: "🌿", delay: 0.1 },
  { x: 68,  y: 25,  emoji: "💚", delay: 0.08 },
  { x: -30, y: 72,  emoji: "⭐", delay: 0.15 },
  { x: 35,  y: 70,  emoji: "✅", delay: 0.12 },
  { x: 0,   y: -75, emoji: "🎊", delay: 0.03 },
  { x: -55, y: -15, emoji: "💫", delay: 0.18 },
  { x: 60,  y: -20, emoji: "🌟", delay: 0.07 },
]

export function WalletSuccessScreen({ title, subtitle, onDone, doneLabel = "Done" }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-5">
      {/* Icon with burst */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Ripple rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-[#118C4C]/40"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.8 + i * 0.6, opacity: 0 }}
            transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity, ease: "easeOut" }}
          />
        ))}

        {/* Particle burst */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute text-lg pointer-events-none select-none"
            style={{ left: "50%", top: "50%" }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: p.x, y: p.y, scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
          >
            {p.emoji}
          </motion.span>
        ))}

        {/* Circle background */}
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-[#118C4C] to-[#1aaf61] flex items-center justify-center shadow-xl shadow-[#118C4C]/30"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 280, delay: 0.1 }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
          >
            <CheckCircle2 className="h-11 w-11 text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="space-y-1.5"
      >
        <h3 className="text-xl font-black text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-[220px] mx-auto leading-snug">{subtitle}</p>
      </motion.div>

      {/* Progress bar auto-close */}
      <motion.div className="w-full max-w-[200px] h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#118C4C] rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4.5, ease: "linear" }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Button onClick={onDone} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white px-8 rounded-full font-semibold">
          {doneLabel}
        </Button>
      </motion.div>
    </div>
  )
}
