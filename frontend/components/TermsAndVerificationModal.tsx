"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, CheckCircle2, Loader2, ExternalLink } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"

export default function TermsAndVerificationModal() {
  const { getAccessToken } = usePrivy()
  const { currentUser, updateUser } = useUser()
  const [accepting, setAccepting] = useState(false)

  if (!currentUser || currentUser.termsAcceptedAt) return null

  const acceptTerms = async () => {
    setAccepting(true)
    try {
      const now = new Date().toISOString()
      await authFetch(getAccessToken, "/api/users/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms_accepted_at: now }),
      })
      await updateUser({ termsAcceptedAt: now } as any)
    } finally {
      setAccepting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-[#118C4C] to-lime-400" />
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-[#118C4C]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Before you continue</h2>
                <p className="text-xs text-muted-foreground">Please review and accept our terms</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              By clicking "Accept & Continue" you agree to Foodra's{" "}
              <a href="/terms" target="_blank" className="text-[#118C4C] underline font-medium inline-flex items-center gap-0.5">
                Terms of Service <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-[#118C4C] underline font-medium inline-flex items-center gap-0.5">
                Privacy Policy <ExternalLink className="h-3 w-3" />
              </a>.
            </p>

            <button
              onClick={acceptTerms}
              disabled={accepting}
              className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {accepting ? "Saving..." : "Accept & Continue"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
