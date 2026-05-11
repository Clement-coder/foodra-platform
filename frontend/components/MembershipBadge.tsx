"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion, useInView } from "framer-motion"
import { X, CheckCircle2, Lock, BadgeCheck, Star } from "lucide-react"
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
  Champion:  "from-[#118C4C] to-[#84cc16]", // more vibrant gradient for champion
}

const TIER_GLOW: Record<string, string> = {
  Seed:      "",
  Sprout:    "shadow-lime-400/40",
  Grower:    "shadow-emerald-400/40",
  Harvester: "shadow-green-400/40",
  Champion:  "shadow-[#118C4C]/60",
}

function TierLadder({ score, inView, isModal = false }: { score: MembershipScore, inView: boolean, isModal?: boolean }) {
  const currentTierIndex = TIERS.findIndex(t => t.tier === score.tier)
  
  return (
    <div className={`relative ${isModal ? "mb-5" : ""}`}>
      {/* Vertical track background */}
      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-muted" />
      
      {/* Animated fill line */}
      <motion.div
        className={`absolute left-[19px] top-6 w-0.5 bg-gradient-to-b ${TIER_GRADIENT[score.tier]} origin-top`}
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: Math.min(currentTierIndex / (TIERS.length - 1), 1) } : { scaleY: 0 }}
        transition={{ type: "spring", stiffness: 60, damping: 15, delay: isModal ? 0.1 : 0.3 }}
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
              transition={{ type: "spring", stiffness: 100, damping: 12, delay: (isModal ? 0.05 : 0.2) + i * 0.1 }}
              className={`relative flex items-start ${isModal ? "gap-3 pb-6" : "gap-4 pb-7"} last:pb-0`}
            >
              {/* Node */}
              <div className="relative z-10 flex-shrink-0 mt-1">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                    isCurrent
                      ? `bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} border-white shadow-lg ${isModal ? "" : `shadow-${TIER_GLOW[tier.tier]}`}`
                      : isReached
                      ? `bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} border-transparent opacity-90 shadow-sm`
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <span className={!isReached ? "opacity-30 grayscale" : ""}>{tier.emoji}</span>
                </motion.div>
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${TIER_GRADIENT[tier.tier]} opacity-30`}
                  />
                )}
              </div>

              {/* Content Card */}
              <div className={`flex-1 p-3.5 rounded-2xl border relative overflow-hidden transition-all ${
                isCurrent 
                  ? "bg-card border-[#118C4C]/30 shadow-md ring-1 ring-[#118C4C]/10" 
                  : isReached 
                  ? "bg-card border-border shadow-sm" 
                  : "bg-muted/20 border-dashed border-border"
              }`}>
                {isCurrent && (
                  <div className={`absolute inset-0 opacity-[0.08] bg-gradient-to-r ${TIER_GRADIENT[tier.tier]} pointer-events-none`} />
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isModal ? "text-sm" : "text-base"} ${isCurrent ? tier.color : isReached ? "text-foreground" : "text-muted-foreground"}`}>
                        {tier.tier}
                      </span>
                      {isCurrent && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${TIER_GRADIENT[tier.tier]} text-white shadow-sm`}>
                          Current
                        </span>
                      )}
                    </div>
                    {!isReached && <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />}
                  </div>
                  
                  <p className={`text-xs ${isCurrent ? "text-foreground font-medium" : isReached ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                    {tier.description}
                  </p>
                  
                  {/* Badges/Tags */}
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-md">
                      {tier.min}–{tier.max} pts
                    </span>
                    {tier.tier === "Champion" && isReached && (
                      <>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#118C4C]/10 text-[#118C4C] border border-[#118C4C]/20 flex items-center gap-1">
                          <BadgeCheck className="h-3 w-3" /> Auto-Verified
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 flex items-center gap-1">
                          <Star className="h-3 w-3" /> 5% Off Orders
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function Checklist({ score, inView, isModal = false }: { score: MembershipScore, inView: boolean, isModal?: boolean }) {
  return (
    <div className={isModal ? "border-t border-border pt-4" : "mt-6 pt-5 border-t border-border"}>
      <p className={`${isModal ? "text-[10px]" : "text-xs"} font-semibold text-muted-foreground uppercase tracking-wide mb-3`}>How to earn points</p>
      <div className={isModal ? "space-y-2" : "space-y-3"}>
        {STEPS.map((step, i) => {
          const earned = score.breakdown[step.key as keyof typeof score.breakdown] as number
          const done = earned > 0
          
          if (isModal) {
            return (
              <motion.div 
                key={step.key} 
                initial={{ opacity: 0, y: 5 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? "bg-[#118C4C]" : "bg-[#118C4C]/10"}`}>
                  {done ? (
                    <motion.svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <motion.path initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }} d="M20 6L9 17l-5-5" />
                    </motion.svg>
                  ) : (
                    <span className="text-[10px] font-bold text-[#118C4C]">+{step.points}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground">{step.detail}</p>
                </div>
              </motion.div>
            )
          }

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={inView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 + i * 0.08 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? "border-[#118C4C]/30 bg-[#118C4C]/5" : "border-border bg-muted/30"}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-[#118C4C]" : "bg-muted"}`}>
                {done ? (
                  <motion.svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }} transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }} d="M20 6L9 17l-5-5" />
                  </motion.svg>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">+{step.points}</span>
                )}
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
  )
}

export function MembershipBadge({ score, showProgress = false, prevTier }: MembershipBadgeProps) {
  const [open, setOpen] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const tierInfo = TIERS.find(t => t.tier === score.tier)!
  const nextTier = TIERS.find(t => t.min > score.total)
  const progressRef = useRef<HTMLDivElement>(null)
  const inView = useInView(progressRef, { once: true, amount: 0.2 })

  // Detect level-up
  useEffect(() => {
    if (prevTier && prevTier !== score.tier) {
      setLevelUp(true)
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ["#118C4C", "#84cc16", "#ffffff", "#fef08a"] })
      setTimeout(() => setLevelUp(false), 4000)
    }
  }, [score.tier, prevTier])

  const isChampion = score.tier === "Champion"

  return (
    <>
      {/* Level-up celebration overlay */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-sm"
          >
            {/* Floating emojis behind */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 100, x: (Math.random() - 0.5) * 200 }}
                  animate={{ opacity: [0, 1, 0], y: -200, x: (Math.random() - 0.5) * 300 }}
                  transition={{ duration: 2.5 + Math.random(), delay: i * 0.2, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2 text-4xl"
                >
                  {tierInfo.emoji}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, y: 50, rotateX: 45 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`relative bg-card border-2 ${isChampion ? 'border-amber-400' : 'border-[#118C4C]'} rounded-3xl px-10 py-8 shadow-2xl text-center overflow-hidden`}
            >
              {/* Premium glow effect behind card text */}
              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${TIER_GRADIENT[score.tier]}`} />
              
              <motion.div 
                animate={{ rotate: [0, -15, 15, -15, 0], scale: [1, 1.3, 1] }} 
                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                className="relative z-10"
              >
                <span className="text-6xl drop-shadow-xl">{tierInfo.emoji}</span>
              </motion.div>
              
              <div className="relative z-10 mt-4 space-y-1">
                <p className="text-2xl font-black text-foreground tracking-tight">Level Up!</p>
                <p className={`text-base font-bold ${tierInfo.color}`}>{score.tier} Member</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Badge pill */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md overflow-hidden ${TIER_GLOW[score.tier]} bg-gradient-to-r ${TIER_GRADIENT[score.tier]} text-white border border-white/20`}
      >
        {isChampion && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
          />
        )}
        <span className="relative z-10 drop-shadow-sm">{tierInfo.emoji}</span>
        <span className="relative z-10 drop-shadow-sm">{score.tier}</span>
        {score.isAutoVerified && (
          <motion.div 
            className="relative z-10"
            whileHover={{ rotate: 180 }} 
            transition={{ duration: 0.3 }}
          >
            <BadgeCheck className="h-4 w-4 drop-shadow-sm" />
          </motion.div>
        )}
      </motion.button>

      {/* Inline progress — roadmap style */}
      {showProgress && (
        <div ref={progressRef} className="mt-4 w-full">
          {/* Score bar */}
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground">{score.total} / 100 pts</span>
            {nextTier && <span>Next: <span className="font-medium">{nextTier.tier}</span> at {nextTier.min}pts</span>}
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden mb-6 shadow-inner relative">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${score.total}%` } : { width: 0 }}
              transition={{ type: "spring", stiffness: 40, damping: 12, delay: 0.1 }}
              className={`absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r ${TIER_GRADIENT[score.tier]}`}
            />
          </div>

          <TierLadder score={score} inView={inView} />
          <Checklist score={score} inView={inView} />
        </div>
      )}

      {/* Modal — for public profile click */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${TIER_GRADIENT[score.tier]}`} />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl drop-shadow-sm">{tierInfo.emoji}</span>
                  <div>
                    <h2 className="font-bold text-foreground text-sm tracking-tight">Foodra Membership</h2>
                    <p className={`text-xs font-bold ${tierInfo.color}`}>{score.tier} · {score.total}/100 pts</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 pb-5">
                <TierLadder score={score} inView={true} isModal />
                <Checklist score={score} inView={true} isModal />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
