"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, Search, X, CheckCircle2, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react"
import { useDebounce } from "@/lib/useDebounce"
import { WalletSuccessScreen } from "@/components/WalletSuccessScreen"

interface Recipient { id: string; name: string; avatar: string; foodra_tag: string | null }

interface Props {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export function WalletSendModal({ isOpen, onClose, currentBalance, onSuccess }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()

  const [step, setStep] = useState<"form" | "pin" | "success">("form")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Recipient[]>([])
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [successBalance, setSuccessBalance] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    if (recipient) return
    const q = debouncedQuery.trim()
    if (q.length < 2) { setResults([]); setShowDropdown(false); return }
    const url = q.toUpperCase().startsWith("FDR-")
      ? `/api/users/search?foodra_tag=${encodeURIComponent(q.toUpperCase())}`
      : `/api/users/search?q=${encodeURIComponent(q)}`
    setSearching(true); setShowDropdown(true)
    fetch(url).then(r => r.json())
      .then((data: Recipient[]) => setResults(data.filter(u => u.foodra_tag)))
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [debouncedQuery, recipient])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectRecipient = (r: Recipient) => { setRecipient(r); setQuery(r.name); setShowDropdown(false); setResults([]) }
  const clearRecipient = () => { setRecipient(null); setQuery(""); setResults([]) }

  const handleSend = async () => {
    if (!pin || pin.length !== 4) { toast.error("Enter your 4-digit PIN"); return }
    setLoading(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_foodra_tag: recipient!.foodra_tag, amount_ngn: parseFloat(amount), note, pin }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Transfer failed"); return }
      setSuccessBalance(data.new_balance)
      onSuccess(data.new_balance)
      setStep("success")
    } catch { toast.error("Something went wrong") }
    finally { setLoading(false) }
  }

  const handleClose = () => {
    onClose()
    // reset after sheet exit animation (~350ms)
    setTimeout(() => {
      setStep("form"); setQuery(""); setRecipient(null); setResults([])
      setAmount(""); setNote(""); setPin("")
    }, 400)
  }

  const amt = parseFloat(amount) || 0
  const isFormValid = recipient && amt >= 100 && amt <= currentBalance

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={step === "success" ? handleClose : undefined} />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-w-lg mx-auto"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-6 pt-2 pb-10">
              {step === "success" ? (
                <WalletSuccessScreen
                  title="Money Sent! 🎉"
                  subtitle={`₦${parseFloat(amount).toLocaleString()} sent to ${recipient?.name}. Balance: ₦${successBalance.toLocaleString()}`}
                  onDone={handleClose}
                />
              ) : step === "pin" ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Confirm Transfer</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Enter PIN to authorise</p>
                    </div>
                    <button onClick={handleClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="rounded-2xl bg-[#118C4C]/8 border border-[#118C4C]/20 p-5 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Sending to {recipient?.name}</p>
                    <p className="text-4xl font-black text-[#118C4C]">₦{parseFloat(amount).toLocaleString()}</p>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-green-600 font-semibold">
                      <Sparkles className="h-3 w-3" /> No fees applied
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#118C4C]" /> Wallet PIN
                    </label>
                    <div className="relative flex items-center border-b-2 border-[#118C4C] pb-2">
                      <input
                        type="password" inputMode="numeric" maxLength={4} autoFocus
                        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="••••"
                        className="flex-1 text-4xl font-black bg-transparent border-none outline-none text-center tracking-[0.6em] placeholder:text-muted-foreground/30"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Enter your 4-digit wallet PIN</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setStep("form"); setPin("") }}
                      className="flex-1 py-3.5 rounded-2xl border-2 border-border font-semibold text-sm hover:bg-muted/50 transition-colors">
                      Back
                    </button>
                    <button onClick={handleSend} disabled={loading || pin.length !== 4}
                      className="flex-1 py-3.5 rounded-2xl bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowUpRight className="h-5 w-5" /> Send Money</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Send Money</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <Sparkles className="h-3 w-3" /> 100% Free — no fees ever
                        </span>
                      </p>
                    </div>
                    <button onClick={handleClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recipient</label>
                    <div ref={dropdownRef} className="relative">
                      <div className={`flex items-center gap-2 border-b-2 pb-2 transition-colors ${recipient ? "border-[#118C4C]" : "border-border focus-within:border-[#118C4C]"}`}>
                        {recipient ? <CheckCircle2 className="h-5 w-5 text-[#118C4C] shrink-0" />
                          : searching ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" />
                          : <Search className="h-5 w-5 text-muted-foreground shrink-0" />}
                        <input
                          value={query}
                          onChange={e => { setQuery(e.target.value); if (recipient) clearRecipient() }}
                          onFocus={() => results.length > 0 && setShowDropdown(true)}
                          placeholder="Name or Foodra tag (FDR-...)"
                          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/40"
                          disabled={!!recipient}
                        />
                        {(query || recipient) && (
                          <button onClick={clearRecipient}><X className="h-4 w-4 text-muted-foreground" /></button>
                        )}
                      </div>
                      {showDropdown && (
                        <div className="absolute z-50 top-full mt-1.5 w-full bg-popover border border-border rounded-2xl shadow-xl overflow-hidden">
                          {results.map(r => (
                            <button key={r.id} onMouseDown={() => selectRecipient(r)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left">
                              <div className="w-9 h-9 rounded-full bg-[#118C4C] text-white flex items-center justify-center text-sm font-bold shrink-0 relative overflow-hidden">
                                <span className="absolute inset-0 flex items-center justify-center font-bold">{r.name?.[0]?.toUpperCase()}</span>
                                {r.avatar && <img src={r.avatar} alt={r.name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => (e.target as HTMLImageElement).remove()} />}
                              </div>
                              <div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-muted-foreground font-mono">{r.foodra_tag}</p></div>
                            </button>
                          ))}
                          {results.length === 0 && !searching && <p className="text-sm text-muted-foreground text-center py-4">No users found</p>}
                        </div>
                      )}
                    </div>
                    {recipient && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#118C4C]/8 border border-[#118C4C]/25">
                        <div className="w-10 h-10 rounded-full shrink-0 bg-[#118C4C] text-white flex items-center justify-center font-bold relative overflow-hidden">
                          <span className="absolute inset-0 flex items-center justify-center font-bold">{recipient.name?.[0]?.toUpperCase()}</span>
                          {recipient.avatar && <img src={recipient.avatar} alt={recipient.name} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => (e.target as HTMLImageElement).remove()} />}
                        </div>
                        <div><p className="text-sm font-semibold">{recipient.name}</p><p className="text-xs text-muted-foreground font-mono">{recipient.foodra_tag}</p></div>
                        <CheckCircle2 className="h-5 w-5 text-[#118C4C] ml-auto" />
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                    <div className="relative flex items-center border-b-2 border-[#118C4C] pb-2">
                      <span className="text-3xl font-bold text-muted-foreground mr-1">₦</span>
                      <input
                        type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min={100}
                        className="flex-1 text-4xl font-black bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min ₦100 · Available ₦{currentBalance.toLocaleString()}</span>
                      {amt > 0 && <span>After: <span className={amt > currentBalance ? "text-red-500 font-medium" : "font-medium"}>₦{(currentBalance - amt).toLocaleString()}</span></span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_AMOUNTS.map(v => (
                        <button key={v} onClick={() => setAmount(String(v))}
                          className={`py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all ${amt === v ? "border-[#118C4C] bg-[#118C4C]/10 text-[#118C4C]" : "border-border bg-muted/40 hover:border-[#118C4C]/40"}`}>
                          ₦{v.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Note <span className="font-normal normal-case">(optional)</span></label>
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. For tomatoes delivery" maxLength={100}
                      className="w-full border-b-2 border-border focus:border-[#118C4C] bg-transparent text-sm py-1.5 outline-none placeholder:text-muted-foreground/40 transition-colors" />
                  </div>

                  <button onClick={() => setStep("pin")} disabled={!isFormValid}
                    className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-colors">
                    <ArrowUpRight className="h-5 w-5" />
                    {isFormValid ? `Send ₦${parseFloat(amount).toLocaleString()}` : "Choose recipient & amount"}
                    <span className="ml-1 bg-white/20 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none uppercase">FREE</span>
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
