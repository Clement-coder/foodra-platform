"use client"

import { motion } from "framer-motion"
import { Clock, Bell, Sprout } from "lucide-react"
import withAuth from "../../components/withAuth"

function FundingPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="max-w-md w-full text-center space-y-6"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-[#118C4C]/10 animate-ping opacity-30" />
            <div className="relative w-24 h-24 rounded-full bg-[#118C4C]/10 flex items-center justify-center">
              <Sprout className="h-10 w-10 text-[#118C4C]" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Clock className="h-3.5 w-3.5" />
            Coming Soon
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Funding is on its way</h1>
          <p className="text-muted-foreground leading-relaxed">
            We&apos;re working on bringing agricultural loans and grants directly to Foodra buyers.
            This feature is not available yet — check back soon!
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-border bg-card p-5 text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What&apos;s coming</p>
          {[
            "Agricultural loans & grants",
            "AI-powered credit scoring",
            "Fast application & tracking",
            "Admin review with transparent decisions",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-foreground">
              <div className="w-5 h-5 rounded-full bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#118C4C]" />
              </div>
              {item}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span>You&apos;ll be notified when funding launches</span>
        </div>
      </motion.div>
    </div>
  )
}

export default withAuth(FundingPage)
