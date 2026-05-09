"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, FileText, CheckCircle2, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"

declare global {
  interface Window {
    MetaMapWebSdk?: {
      init: (opts: {
        clientId: string
        flowId: string
        metadata: Record<string, string>
        onFinish?: (data: any) => void
        onError?: (err: any) => void
      }) => void
      show: () => void
    }
  }
}

export default function TermsAndVerificationModal() {
  const { getAccessToken } = usePrivy()
  const { currentUser, updateUser } = useUser()
  const [step, setStep] = useState<"terms" | "kyc" | "pending" | "done">("terms")
  const [accepting, setAccepting] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Don't show if already accepted terms + verified
  const needsTerms = currentUser && !currentUser.termsAcceptedAt
  const needsKyc = currentUser && currentUser.termsAcceptedAt && !currentUser.isVerified
  const visible = needsTerms || needsKyc

  useEffect(() => {
    if (!visible) return
    if (needsTerms) setStep("terms")
    else if (needsKyc) setStep("kyc")
  }, [visible, needsTerms, needsKyc])

  // Load MetaMap SDK script
  useEffect(() => {
    if (step !== "kyc" || sdkReady) return
    if (document.getElementById("metamap-sdk")) { setSdkReady(true); return }
    const script = document.createElement("script")
    script.id = "metamap-sdk"
    script.src = "https://web-button.getmati.com/button.js"
    script.async = true
    script.onload = () => setSdkReady(true)
    document.body.appendChild(script)
    scriptRef.current = script
  }, [step, sdkReady])

  // Launch MetaMap once SDK is ready
  useEffect(() => {
    if (step !== "kyc" || !sdkReady || !currentUser) return
    const clientId = process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID
    const flowId = process.env.NEXT_PUBLIC_METAMAP_FLOW_ID
    if (!clientId || !flowId) return

    // Small delay to ensure SDK is fully initialised
    const t = setTimeout(() => {
      window.MetaMapWebSdk?.init({
        clientId,
        flowId,
        metadata: { userId: currentUser.id },
        onFinish: () => setStep("pending"),
        onError: () => setStep("pending"),
      })
    }, 300)
    return () => clearTimeout(t)
  }, [step, sdkReady, currentUser])

  const acceptTerms = async () => {
    if (!currentUser) return
    setAccepting(true)
    try {
      const now = new Date().toISOString()
      await authFetch(getAccessToken, "/api/users/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms_accepted_at: now }),
      })
      // Reflect locally without full reload
      await updateUser({ termsAcceptedAt: now } as any)
      setStep("kyc")
    } finally {
      setAccepting(false)
    }
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
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
          {/* Top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#118C4C] to-lime-400" />

          <div className="p-6">
            {/* Step: Terms */}
            {step === "terms" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-[#118C4C]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Before you continue</h2>
                    <p className="text-xs text-muted-foreground">One-time setup — takes about 2 minutes</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Here's what happens next:</p>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-xs font-bold flex items-center justify-center shrink-0">1</span>
                    <p>Accept our Terms of Service and Privacy Policy</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-xs font-bold flex items-center justify-center shrink-0">2</span>
                    <p>Complete a quick identity verification (KYC) — required to list products and access funding</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-xs font-bold flex items-center justify-center shrink-0">3</span>
                    <p>Get your verified badge and start using Foodra fully</p>
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
            )}

            {/* Step: KYC */}
            {step === "kyc" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-[#118C4C]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Verify your identity</h2>
                    <p className="text-xs text-muted-foreground">Powered by MetaMap — secure & encrypted</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
                  <p>You'll need:</p>
                  <ul className="space-y-1.5">
                    {["A valid government-issued ID (NIN, passport, or driver's licence)", "A device with a camera for a quick selfie", "Good lighting — takes less than 2 minutes"].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#118C4C] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {!sdkReady ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-[#118C4C]" />
                    Loading verification...
                  </div>
                ) : (
                  <button
                    onClick={() => window.MetaMapWebSdk?.show()}
                    className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Start Verification
                  </button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Your data is encrypted and used only for identity verification.
                </p>
              </div>
            )}

            {/* Step: Pending */}
            {step === "pending" && (
              <div className="space-y-5 text-center py-2">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-2">Verification submitted</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your identity verification is being reviewed. This usually takes a few minutes. You'll be able to list products once approved.
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  Check Status
                </button>
              </div>
            )}

            {/* Step: Done */}
            {step === "done" && (
              <div className="space-y-5 text-center py-2">
                <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-[#118C4C]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-2">You're verified!</h2>
                  <p className="text-sm text-muted-foreground">Your account is now verified. You can list products and apply for funding.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
