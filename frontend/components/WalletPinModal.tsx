"use client"

import { useState } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, ShieldCheck } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  hasPin: boolean // true = change flow, false = first-time setup
}

const pinInput = "w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C] tracking-widest text-center text-xl font-bold"

export function WalletPinModal({ isOpen, onClose, hasPin }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [loading, setLoading] = useState(false)

  const reset = () => { setCurrentPin(""); setNewPin(""); setConfirmPin("") }

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
      toast.success(hasPin ? "PIN changed successfully" : "Wallet PIN set! You can now withdraw funds.")
      reset()
      onClose()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); reset() }} title={hasPin ? "Change Wallet PIN" : "Set Wallet PIN"}>
      <div className="space-y-4 p-1">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#118C4C]/8 border border-[#118C4C]/20 text-sm text-[#118C4C]">
          <ShieldCheck className="h-5 w-5 flex-shrink-0" />
          <p>{hasPin ? "Enter your current PIN then choose a new 4-digit PIN." : "Set a 4-digit PIN to authorise withdrawals."}</p>
        </div>

        {hasPin && (
          <div>
            <label className="text-sm font-medium mb-1 block">Current PIN</label>
            <input
              type="password" inputMode="numeric" maxLength={4}
              value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••" className={pinInput}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">New PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={4}
            value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••" className={pinInput}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Confirm New PIN</label>
          <input
            type="password" inputMode="numeric" maxLength={4}
            value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••" className={pinInput}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={() => { onClose(); reset() }} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSubmit} disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
            className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : hasPin ? "Change PIN" : "Set PIN"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
