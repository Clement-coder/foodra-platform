"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, CheckCircle2 } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
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

  const reset = () => { setStep(1); setBankCode(""); setBankName(""); setAccountNumber(""); setAccountName(""); setAmount(""); setPin("") }

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset() }} title="Withdraw to Bank">
      <div className="p-1">
        {/* Step 1: Bank details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => {
                  setBankCode(e.target.value)
                  setBankName(e.target.options[e.target.selectedIndex].text)
                  setAccountName("")
                }}
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
              >
                <option value="">Select bank</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Account Number</label>
              <div className="flex gap-2">
                <input
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setAccountName("") }}
                  placeholder="0123456789"
                  className="flex-1 border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                />
                <Button onClick={verifyAccount} disabled={verifying} size="sm" variant="outline" className="px-3 text-xs">
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
              {accountName && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {accountName}
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

        {/* Step 2: Amount + PIN */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/50 text-sm">
              <p className="font-semibold">{accountName}</p>
              <p className="text-muted-foreground text-xs">{bankName} · {accountNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (NGN)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2000"
                min={500}
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
              />
              <p className="text-xs text-muted-foreground mt-1">Available: ₦{currentBalance.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Wallet PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C] tracking-widest"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleWithdraw} disabled={loading} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw →"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="font-bold text-base">Withdrawal Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              ₦{parseFloat(amount).toLocaleString()} will be sent to your bank within 1–2 business days.
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
