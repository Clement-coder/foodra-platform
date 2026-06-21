"use client"

import { useState, useRef, useEffect } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { usePrivy } from "@privy-io/react-auth"
import { authFetch } from "@/lib/authFetch"
import { Loader2, Search, X, CheckCircle2, User } from "lucide-react"
import { useDebounce } from "@/lib/useDebounce"

interface Recipient {
  id: string
  name: string
  avatar: string
  foodra_tag: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}

export function WalletSendModal({ isOpen, onClose, currentBalance, onSuccess }: Props) {
  const { getAccessToken } = usePrivy()
  const { toast } = useToast()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Recipient[]>([])
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 350)

  // Auto-search as user types
  useEffect(() => {
    if (recipient) return // already selected
    const q = debouncedQuery.trim()
    if (q.length < 2) { setResults([]); setShowDropdown(false); return }
    const isFoodraTag = q.toUpperCase().startsWith("FDR-")
    const url = isFoodraTag
      ? `/api/users/search?foodra_tag=${encodeURIComponent(q.toUpperCase())}`
      : `/api/users/search?q=${encodeURIComponent(q)}`

    setSearching(true)
    setShowDropdown(true)
    fetch(url)
      .then((r) => r.json())
      .then((data: Recipient[]) => {
        const withWallet = data.filter((u) => u.foodra_tag)
        setResults(withWallet)
      })
      .catch(() => {})
      .finally(() => setSearching(false))
  }, [debouncedQuery, recipient])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectRecipient = (r: Recipient) => {
    setRecipient(r)
    setQuery(r.name)
    setShowDropdown(false)
    setResults([])
  }

  const clearRecipient = () => {
    setRecipient(null)
    setQuery("")
    setResults([])
  }

  const handleSend = async () => {
    if (!recipient) { toast.error("Select a recipient first"); return }
    const amt = parseFloat(amount)
    if (!amt || amt < 100) { toast.error("Minimum is ₦100"); return }
    if (amt > currentBalance) { toast.error("Insufficient balance"); return }
    setLoading(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_foodra_tag: recipient.foodra_tag, amount_ngn: amt, note }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Transfer failed"); return }
      toast.success(`₦${amt.toLocaleString()} sent to ${recipient.name}`)
      onSuccess(data.new_balance)
      handleClose()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setQuery(""); setRecipient(null); setResults([])
    setAmount(""); setNote("")
    onClose()
  }

  const afterAmt = parseFloat(amount) ? currentBalance - parseFloat(amount) : null
  const isValid = recipient && parseFloat(amount) >= 100 && parseFloat(amount) <= currentBalance

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Money">
      <div className="space-y-5 p-1">

        {/* Recipient search */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block text-foreground">
            Recipient
          </label>
          <div ref={dropdownRef} className="relative">
            <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-background transition-all ${
              recipient ? "border-[#118C4C]" : "focus-within:border-[#118C4C] focus-within:ring-2 focus-within:ring-[#118C4C]/20"
            }`}>
              {recipient ? (
                <CheckCircle2 className="h-4 w-4 text-[#118C4C] shrink-0" />
              ) : searching ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); if (recipient) clearRecipient() }}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder="Search by name or Foodra tag (FDR-...)"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                disabled={!!recipient}
              />
              {(query || recipient) && (
                <button onClick={clearRecipient} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && (
              <div className="absolute z-50 top-full mt-1.5 w-full bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onMouseDown={() => selectRecipient(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#118C4C] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {r.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.foodra_tag}</p>
                    </div>
                  </button>
                ))}
                {results.length === 0 && !searching && (
                  <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
                )}
              </div>
            )}
          </div>

          {/* Selected recipient card */}
          {recipient && (
            <div className="mt-2.5 flex items-center gap-3 p-3 rounded-xl bg-[#118C4C]/8 border border-[#118C4C]/25">
              <div className="w-10 h-10 rounded-full bg-[#118C4C] text-white flex items-center justify-center font-bold shrink-0">
                {recipient.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold">{recipient.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{recipient.foodra_tag}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#118C4C] ml-auto" />
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block text-foreground">Amount (NGN)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₦</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min={100}
              className="w-full border rounded-xl pl-8 pr-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/30 focus:border-[#118C4C]"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-muted-foreground">Min ₦100</p>
            {afterAmt !== null && (
              <p className="text-xs text-muted-foreground">
                New balance: <span className={afterAmt < 0 ? "text-red-500" : "font-medium"}>₦{afterAmt.toLocaleString()}</span>
              </p>
            )}
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2">
            {[500, 1000, 2000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#118C4C]/30 text-[#118C4C] hover:bg-[#118C4C]/10 transition-colors font-medium"
              >
                ₦{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-semibold mb-1.5 block text-foreground">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. For tomatoes delivery"
            maxLength={100}
            className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/30 focus:border-[#118C4C]"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSend}
            disabled={loading || !isValid}
            className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Money →"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
