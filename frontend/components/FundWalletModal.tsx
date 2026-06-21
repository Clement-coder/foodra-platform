"use client"

import { useState } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2 } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function FundWalletModal({ isOpen, onClose }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 500) { toast.error("Minimum amount is ₦500"); return }
    setLoading(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_ngn: amt }),
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fund Your Wallet">
      <div className="space-y-4 p-1">
        <div>
          <label className="text-sm font-medium mb-1 block">Amount (NGN)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            min={500}
            className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
          />
          <p className="text-xs text-muted-foreground mt-1">Min ₦500 · Max ₦1,000,000</p>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          You will be redirected to Paystack to complete payment securely.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue →"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
