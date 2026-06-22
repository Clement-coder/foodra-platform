"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, X, CreditCard, Banknote, ChevronRight } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000]

export function FundWalletModal({ isOpen, onClose }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0

  const handleSubmit = async () => {
    if (!numericAmount || numericAmount < 500) { toast.error("Minimum amount is ₦500"); return }
    setLoading(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ngn: numericAmount }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Failed to initialize payment"); return }
      window.location.href = data.authorization_url
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (val: string) => {
    // allow only digits
    const digits = val.replace(/\D/g, "")
    setAmount(digits)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet — slides up from bottom */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-w-lg mx-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-6 pt-2 pb-10 space-y-7">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Add Money</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Funds arrive instantly via Paystack</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Enter Amount
                </label>
                <div className="relative flex items-center border-b-2 border-[#118C4C] pb-2">
                  <span className="text-3xl font-bold text-muted-foreground mr-1">₦</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={amount ? Number(amount).toLocaleString() : ""}
                    onChange={(e) => handleInput(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-4xl font-black bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Min ₦500 &nbsp;·&nbsp; Max ₦1,000,000</p>
              </div>

              {/* Quick amounts */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Select
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${
                        numericAmount === amt
                          ? "border-[#118C4C] bg-[#118C4C]/10 text-[#118C4C]"
                          : "border-border bg-muted/40 hover:border-[#118C4C]/40"
                      }`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pay method info */}
              <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-[#118C4C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Card, Bank Transfer & USSD</p>
                  <p className="text-xs text-muted-foreground">Secured by Paystack</p>
                </div>
                <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={loading || numericAmount < 500}
                className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-colors"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {numericAmount >= 500
                      ? `Fund ₦${numericAmount.toLocaleString("en-NG")}`
                      : "Enter an amount"}
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
