"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, ShieldCheck, X, CheckCircle2 } from "lucide-react"
import { useScrollLock } from "@/lib/useScrollLock"

interface Props {
  isOpen: boolean
  onClose: () => void
  hasPin: boolean
}

export function WalletPinModal({ isOpen, onClose, hasPin }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()

  useScrollLock(isOpen)
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const reset = () => { setCurrentPin(""); setNewPin(""); setConfirmPin(""); setDone(false) }
  const handleClose = () => { onClose(); reset() }

  const handleSubmit = async () => {
    if (!/^\d{4}$/.test(newPin)) { toast.error("PIN must be exactly 4 digits"); return }
    if (newPin !== confirmPin) { toast.error("PINs do not match"); return }
    if (hasPin && !currentPin) { toast.error("Enter your current PIN"); return }

    setLoading(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin, ...(hasPin ? { currentPin } : {}) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Failed to set PIN"); return }
      setDone(true)
      setTimeout(handleClose, 2500)
    } catch { toast.error("Something went wrong") }
    finally { setLoading(false) }
  }

  const pinInput = "flex-1 text-4xl font-black bg-transparent border-none outline-none text-center tracking-[0.6em] placeholder:text-muted-foreground/30"

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-w-lg mx-auto flex flex-col" style={{ maxHeight: "min(74vh, 680px)" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-6 pt-2 pb-10 overflow-y-auto flex-1">
              {done ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 14, stiffness: 280 }}
                    className="w-20 h-20 rounded-full bg-[#118C4C] flex items-center justify-center shadow-xl shadow-[#118C4C]/30"
                  >
                    <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-black">{hasPin ? "PIN Changed!" : "PIN Set!"} 🔐</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your wallet is now protected.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{hasPin ? "Change Wallet PIN" : "Set Wallet PIN"}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {hasPin ? "Enter your current PIN then set a new one" : "Protect every transaction with a 4-digit PIN"}
                      </p>
                    </div>
                    <button onClick={handleClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-[#118C4C]/8 border border-[#118C4C]/20 rounded-2xl px-4 py-3">
                    <ShieldCheck className="h-6 w-6 text-[#118C4C] shrink-0" />
                    <p className="text-sm text-[#118C4C] font-medium">
                      {hasPin ? "Your PIN secures all wallet transactions." : "Required to send, withdraw and pay for orders."}
                    </p>
                  </div>

                  {hasPin && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current PIN</label>
                      <div className="flex items-center border-b-2 border-border focus-within:border-[#118C4C] pb-2 transition-colors">
                        <input type="password" inputMode="numeric" maxLength={4}
                          value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="••••" className={pinInput} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New PIN</label>
                    <div className="flex items-center border-b-2 border-[#118C4C] pb-2">
                      <input type="password" inputMode="numeric" maxLength={4}
                        value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="••••" className={pinInput} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirm New PIN</label>
                    <div className={`flex items-center border-b-2 pb-2 transition-colors ${confirmPin && confirmPin !== newPin ? "border-red-400" : confirmPin === newPin && confirmPin.length === 4 ? "border-green-500" : "border-border focus-within:border-[#118C4C]"}`}>
                      <input type="password" inputMode="numeric" maxLength={4}
                        value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="••••" className={pinInput} />
                      {confirmPin.length === 4 && (
                        confirmPin === newPin
                          ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          : <span className="text-xs text-red-500 shrink-0 font-semibold">Mismatch</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || newPin.length !== 4 || confirmPin.length !== 4 || (hasPin && !currentPin)}
                    className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-colors"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="h-5 w-5" />{hasPin ? "Change PIN" : "Set PIN"}</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
