"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, CheckCircle2, ChevronDown, Search, Building2, Banknote, ShieldCheck, Sparkles, X } from "lucide-react"
import { WalletSuccessScreen } from "@/components/WalletSuccessScreen"

interface Props {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

function BankDropdown({ banks, value, onChange }: {
  banks: { code: string; name: string }[]
  value: string
  onChange: (code: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const selected = banks.find(b => b.code === value)
  const filtered = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 border-b-2 pb-2 bg-transparent text-sm transition-colors ${open || value ? "border-[#118C4C]" : "border-border"}`}>
        <Building2 className={`h-5 w-5 shrink-0 ${value ? "text-[#118C4C]" : "text-muted-foreground"}`} />
        <span className={`flex-1 text-left truncate text-base ${selected ? "font-semibold" : "text-muted-foreground/60"}`}>
          {selected ? selected.name : "Select your bank"}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 w-full bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search banks..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No banks found</p>
              : filtered.map(b => (
                <button key={b.code} type="button"
                  onMouseDown={() => { onChange(b.code, b.name); setOpen(false); setSearch("") }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors ${b.code === value ? "bg-[#118C4C]/8 text-[#118C4C]" : ""}`}>
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{b.name[0]}</div>
                  <span className="text-sm truncate">{b.name}</span>
                  {b.code === value && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function WalletWithdrawModal({ isOpen, onClose, currentBalance, onSuccess }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([])
  const [bankCode, setBankCode] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [amount, setAmount] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && banks.length === 0) fetch("/api/wallet/banks").then(r => r.json()).then(setBanks)
  }, [isOpen]) // eslint-disable-line

  const verifyAccount = async () => {
    if (!accountNumber || !bankCode) { toast.error("Select bank and enter account number"); return }
    if (accountNumber.length !== 10) { toast.error("Account number must be 10 digits"); return }
    setVerifying(true)
    try {
      const res = await fetch(`/api/wallet/verify-bank?account_number=${accountNumber}&bank_code=${bankCode}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Could not verify account"); return }
      setAccountName(data.account_name)
    } catch { toast.error("Verification failed") }
    finally { setVerifying(false) }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 500) { toast.error("Minimum withdrawal is ₦500"); return }
    if (amt > currentBalance) { toast.error("Insufficient balance"); return }
    if (!pin || pin.length !== 4) { toast.error("Enter your 4-digit PIN"); return }
    setLoading(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ngn: amt, bank_code: bankCode, bank_name: bankName, account_number: accountNumber, account_name: accountName, pin }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Withdrawal failed"); return }
      onSuccess(data.new_balance)
      setStep(3)
    } catch { toast.error("Something went wrong") }
    finally { setLoading(false) }
  }

  const reset = () => { setStep(1); setBankCode(""); setBankName(""); setAccountNumber(""); setAccountName(""); setAmount(""); setPin("") }
  const handleClose = () => { onClose(); reset() }

  const amt = parseFloat(amount) || 0
  const youReceive = Math.max(0, amt - 50)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={step === 3 ? handleClose : undefined} />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-w-lg mx-auto"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-6 pt-2 pb-10">
              {step === 3 ? (
                <WalletSuccessScreen
                  title="Withdrawal Submitted! 🏦"
                  subtitle={`₦${youReceive.toLocaleString()} will arrive in ${accountName}'s account shortly.`}
                  onDone={handleClose}
                />
              ) : step === 2 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Confirm Withdrawal</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Enter PIN to authorise</p>
                    </div>
                    <button onClick={handleClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Account summary */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{accountName}</p>
                      <p className="text-xs text-muted-foreground">{bankName} · {accountNumber}</p>
                    </div>
                  </div>

                  {/* Amount input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                    <div className="relative flex items-center border-b-2 border-[#118C4C] pb-2">
                      <span className="text-3xl font-bold text-muted-foreground mr-1">₦</span>
                      <input
                        type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min={500}
                        className="flex-1 text-4xl font-black bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Available: ₦{currentBalance.toLocaleString()} · Min ₦500</p>

                    {amt >= 500 && (
                      <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/30 px-4 py-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">You withdraw</span>
                          <span className="font-semibold">₦{amt.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400"><Sparkles className="h-3 w-3" /> Bank processing fee</span>
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">− ₦50</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-amber-200/60 dark:border-amber-800/30 pt-1.5">
                          <span>You receive</span>
                          <span className="text-[#118C4C]">₦{youReceive.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIN */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#118C4C]" /> Wallet PIN
                    </label>
                    <div className="relative flex items-center border-b-2 border-[#118C4C] pb-2">
                      <input
                        type="password" inputMode="numeric" maxLength={4}
                        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="••••"
                        className="flex-1 text-4xl font-black bg-transparent border-none outline-none text-center tracking-[0.6em] placeholder:text-muted-foreground/30"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-2xl border-2 border-border font-semibold text-sm hover:bg-muted/50 transition-colors">
                      Back
                    </button>
                    <button onClick={handleWithdraw} disabled={loading || !amount || pin.length !== 4}
                      className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Banknote className="h-5 w-5" /> Withdraw</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">Withdraw to Bank</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">₦50 bank processing fee applies</p>
                    </div>
                    <button onClick={handleClose} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Bank selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bank</label>
                    <BankDropdown banks={banks} value={bankCode}
                      onChange={(code, name) => { setBankCode(code); setBankName(name); setAccountName("") }} />
                  </div>

                  {/* Account number */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Number</label>
                    <div className="flex items-center gap-3 border-b-2 border-[#118C4C] pb-2">
                      <input
                        value={accountNumber}
                        onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setAccountName("") }}
                        placeholder="0123456789"
                        className="flex-1 text-xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 tracking-wider"
                      />
                      <button onClick={verifyAccount} disabled={verifying || accountNumber.length !== 10 || !bankCode}
                        className="text-xs font-bold text-[#118C4C] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify →"}
                      </button>
                    </div>
                    {accountName && (
                      <p className="text-sm text-green-600 flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> {accountName}
                      </p>
                    )}
                  </div>

                  <button onClick={() => setStep(2)} disabled={!accountName}
                    className="w-full flex items-center justify-center gap-2 bg-[#118C4C] hover:bg-[#0d6d3a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-colors">
                    <Building2 className="h-5 w-5" />
                    {accountName ? `Continue with ${accountName}` : "Verify account to continue"}
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
