"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { X, CheckCircle2, Lock, BadgeCheck, Sparkles, Star } from "lucide-react"
import { TIERS, STEPS, type MembershipScore } from "@/lib/membership"
import confetti from "canvas-confetti"

interface MembershipBadgeProps {
  score: MembershipScore
  showProgress?: boolean
  /** Previous score to detect level-up */
  prevTier?: string
}

const TIER_GRADIENT: Record<string, string> = {
  Seed:      "from-stone-400 to-stone-500",
  Sprout:    "from-lime-400 to-lime-600",
  Grower:    "from-emerald-400 to-emerald-600",
  Harvester: "from-green-400 to-green-600",
  Champion:  "from-[#118C4C] to-lime-400",
}

const TIER_GLOW: Record<string, string> = {
  Seed:      "",
  Sprout:    "shadow-lime-400/40",
  Grower:    "shadow-emerald-400/40",
  Harvester: "shadow-green-400/40",
  Champion:  "shadow-[#118C4C]/60",
}

export function MembershipBadge({ score, showProgress = false, prevTier }: MembershipBadgeProps) {
  const [open, setOpen] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const tierInfo = TIERS.find(t => t.tier === score.tier)!
  const nextTier = TIERS.find(t => t.min > score.total)
  const progressRef = useRef<HTMLDivElement>(null)
  const inView = useInView(progressRef, { once: true })

  // Detect level-up
  useEffect(() => {
    if (prevTier && prevTier !== score.tier) {
      setLevelUp(true)
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#118C4C", "#84cc16", "#ffffff"] })
      setTimeout(() => setLevelUp(false), 3000)
    }
  }, [score.tier, prevTier])

  const currentTierIndex = TIERS.findIndex(t => t.tier === score.tier)

  return (
    <>
      {/* Level-up celebration overlay */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-card border border-[#118C4C] rounded-3xl px-8 py-6 shadow-2xl text-center">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>
                <span className="text-5xl">{tierInfo.emoji}</span>
              </motion.div>
              <p className="text-lg font-bold text-foreground mt-2">Level Up!</p>
              <p className={`text-sm font-semibold ${tierInfo.color}`}>{score.tier} Member</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge pill */}
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-md ${TIER_GLOW[score.tier]} bg-gradient-to-r ${TIER_GRADIENT[score.tier]} text-white`}
      >
        <span>{tierInfo.emoji}</span>
        <span>{score.tier}</span>
        {score.isAutoVerified && <BadgeCheck className="h-3.5 w-3.5" />}
      </button>

      {/* Inline progress — roadmap style */}
      {showProgress && (
        <div ref={progressRef} className="mt-4 w-full">
          {/* Score bar */}
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground">{score.total} / 100 pts</span>
            {nextTier && <span>Next: <span className="font-medium">{nextTier.tier}</span> at {nextTier.min}pts</span>}
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${score.total}%` } : { width: 0 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className={`h-full rounded-full bg-gradient-to-r ${TIER_GRADIENT[score.tier]}`}
            />
          </div>

          {/* Roadmap */}
          <div className="relative">
            {/* Vertical track */}
            <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-muted" />
            {/* Animated fill line */}
            <motion.div
              className={`absolute left-[19px] top-6 w-0.5 bg-gradient-to-b ${TIER_GRADIENT[score.tier]} origin-top`}
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: Math.min(currentTierIndex / (TIERS.length - 1), 1) } : { scaleY: 0 }}
              transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
              style={{ height: "calc(100% - 48px)" }}
            />

            <div className="space-y-0">
              {TIERS.map((tier, i) => {
                const isReached = i <= currentTierIndex
                const isCurrent = tier.tier === score.tier
                return (
                  <motion.div
                    key={tier.tier}
                    initial={{ opacity: 0, x: -12 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
                    className="relative flex items-start gap-4 pb-6 last:pb-0"
                  >
                    {/* Node */}
                    <div className="relative z-10 flex-shrink-0">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                          isCurrent
                            ? `bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} border-white shadow-lg shadow-${TIER_GLOW[tier.tier]}`
                            : isReached
                            ? `bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} border-transparent opacity-80`
                            : "bg-muted border-border"
                        }`}
                      >
                        {isReached ? tier.emoji : <Lock className="h-4 w-4 text-muted-foreground" />}
                      </motion.div>
                      {isCurrent && (
                        <motion.div
                          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`absolute inset-0 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} opacity-30`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pt-1.5 ${!isReached ? "opacity-40" : ""}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isCurrent ? tier.color : isReached ? "text-foreground" : "text-muted-foreground"}`}>
                          {tier.tier}
                        </span>
                        {isCurrent && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier.tier]} text-white`}>
                            Current
                          </span>
                        )}
                        {tier.tier === "Champion" && isReached && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#118C4C]/10 text-[#118C4C] flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" /> Auto-Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{tier.min}–{tier.max} pts</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Step checklist */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">How to earn points</p>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const earned = score.breakdown[step.key as keyof typeof score.breakdown] as number
                const done = earned > 0
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? "border-[#118C4C]/30 bg-[#118C4C]/5" : "border-border bg-muted/30"}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-[#118C4C]" : "bg-muted"}`}>
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <span className="text-[10px] font-bold text-muted-foreground">+{step.points}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.detail}</p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${done ? "text-[#118C4C]" : "text-muted-foreground"}`}>
                      {earned}/{step.points}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal — for public profile click */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${TIER_GRADIENT[score.tier]}`} />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tierInfo.emoji}</span>
                  <div>
                    <h2 className="font-bold text-foreground text-sm">Foodra Membership</h2>
                    <p className={`text-xs font-semibold ${tierInfo.color}`}>{score.tier} · {score.total}/100 pts</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 pb-5">
                {/* Tier ladder */}
                <div className="relative mb-5">
                  <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-muted" />
                  <motion.div
                    className={`absolute left-[19px] top-6 w-0.5 bg-gradient-to-b ${TIER_GRADIENT[score.tier]} origin-top`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: Math.min(currentTierIndex / (TIERS.length - 1), 1) }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                    style={{ height: "calc(100% - 48px)" }}
                  />
                  <div className="space-y-0">
                    {TIERS.map((tier, i) => {
                      const isReached = i <= currentTierIndex
                      const isCurrent = tier.tier === score.tier
                      return (
                        <motion.div
                          key={tier.tier}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative flex items-start gap-3 pb-5 last:pb-0"
                        >
                          <div className="relative z-10 flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base border-2 ${
                              isCurrent ? `bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} border-white shadow-lg` :
                              isReached ? `bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} border-transparent opacity-80` :
                              "bg-muted border-border"
                            }`}>
                              {isReached ? tier.emoji : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                            {isCurrent && (
                              <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} opacity-30`} />
                            )}
                          </div>
                          <div className={`flex-1 pt-1.5 ${!isReached ? "opacity-40" : ""}`}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm font-bold ${isCurrent ? tier.color : "text-foreground"}`}>{tier.tier}</span>
                              {isCurrent && <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier.tier]} text-white font-bold`}>You</span>}
                              {tier.tier === "Champion" && <span className="text-[10px] text-[#118C4C] flex items-center gap-0.5"><BadgeCheck className="h-3 w-3" />Auto-Verified</span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{tier.description}</p>
                            <p className="text-[10px] text-muted-foreground">{tier.min}–{tier.max} pts</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Steps */}
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">How to earn points</p>
                  <div className="space-y-2">
                    {STEPS.map(step => (
                      <div key={step.key} className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-[#118C4C]">+{step.points}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{step.label}</p>
                          <p className="text-[10px] text-muted-foreground">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
