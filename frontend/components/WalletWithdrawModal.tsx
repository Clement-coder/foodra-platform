"use client"

import { useState, useEffect, useRef } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, CheckCircle2, ChevronDown, Search, Building2, Sparkles } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

function BankDropdown({
  banks,
  value,
  onChange,
}: {
  banks: { code: string; name: string }[]
  value: string
  onChange: (code: string, name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const selected = banks.find((b) => b.code === value)
  const filtered = banks.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl bg-background text-sm transition-all ${
          open ? "border-[#118C4C] ring-2 ring-[#118C4C]/20" : "border-border hover:border-[#118C4C]/50"
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-[#118C4C]/10 flex items-center justify-center shrink-0">
          <Building2 className="h-3.5 w-3.5 text-[#118C4C]" />
        </div>
        <span className={`flex-1 text-left truncate ${selected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {selected ? selected.name : "Select your bank"}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-popover border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search banks..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No banks found</p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  onMouseDown={() => { onChange(b.code, b.name); setOpen(false); setSearch("") }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors ${
                    b.code === value ? "bg-[#118C4C]/8 text-[#118C4C]" : ""
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                    {b.name[0]}
                  </div>
                  <span className="text-sm truncate">{b.name}</span>
                  {b.code === value && <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0" />}
                </button>
              ))
            )}
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
    if (isOpen && banks.length === 0) {
      fetch("/api/wallet/banks").then((r) => r.json()).then(setBanks)
    }
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
    } catch {
      toast.error("Verification failed")
    } finally {
      setVerifying(false)
    }
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
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1); setBankCode(""); setBankName(""); setAccountNumber("")
    setAccountName(""); setAmount(""); setPin("")
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset() }} title="Withdraw to Bank">
      <div className="p-1">
        {step === 1 && (
          <div className="space-y-4">
            {/* Zero-fee notice upfront */}
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-3 py-2.5">
              <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                No Foodra fees · We never charge you to withdraw your money.
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Bank</label>
              <BankDropdown
                banks={banks}
                value={bankCode}
                onChange={(code, name) => { setBankCode(code); setBankName(name); setAccountName("") }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Account Number</label>
              <div className="flex gap-2">
                <input
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setAccountName("") }}
                  placeholder="0123456789"
                  className="flex-1 border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/30 focus:border-[#118C4C]"
                />
                <Button onClick={verifyAccount} disabled={verifying || accountNumber.length !== 10 || !bankCode} size="sm" variant="outline" className="px-3 text-xs">
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
              {accountName && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {accountName}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { onClose(); reset() }} className="flex-1">Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!accountName} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
                Next →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-[#118C4C]" />
              </div>
              <div>
                <p className="text-sm font-semibold">{accountName}</p>
                <p className="text-xs text-muted-foreground">{bankName} · {accountNumber}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Amount (NGN)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={500}
                  className="w-full border rounded-xl pl-8 pr-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/30 focus:border-[#118C4C]"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available: ₦{currentBalance.toLocaleString()} · Min ₦500</p>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Wallet PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-full border rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/30 focus:border-[#118C4C]"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleWithdraw} disabled={loading} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    Withdraw
                    <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">NO FEES</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="font-bold text-base">Withdrawal Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              ₦{parseFloat(amount).toLocaleString()} will be sent to <span className="font-medium text-foreground">{accountName}</span> within 1–2 business days.
            </p>
            <Button onClick={() => { onClose(); reset() }} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
