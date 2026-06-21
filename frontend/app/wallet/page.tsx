"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft,
  Banknote, Copy, Check, RefreshCcw, ShieldCheck, TrendingUp, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"
import { usePrivy } from "@privy-io/react-auth"
import { WalletPageSkeleton } from "@/components/Skeleton"
import { FundWalletModal } from "@/components/FundWalletModal"
import { WalletSendModal } from "@/components/WalletSendModal"
import { WalletWithdrawModal } from "@/components/WalletWithdrawModal"
import { WalletPinModal } from "@/components/WalletPinModal"
import withAuth from "@/components/withAuth"

interface WalletTx {
  id: string
  type: "credit" | "debit"
  category: string
  amount_ngn: number
  balance_after: number
  note: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  fund: "Wallet Funded",
  transfer_in: "Money Received",
  transfer_out: "Money Sent",
  withdrawal: "Bank Withdrawal",
  purchase: "Purchase",
  refund: "Refund",
}

function WalletPage() {
  const { getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [balance, setBalance] = useState<number>(0)
  const [tag, setTag] = useState("")
  const [transactions, setTransactions] = useState<WalletTx[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [fundOpen, setFundOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [hasPin, setHasPin] = useState(false)

  const loadWallet = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const [balRes, txRes] = await Promise.all([
        authFetch(getAccessToken, "/api/wallet/balance"),
        authFetch(getAccessToken, "/api/wallet/transactions?limit=20"),
      ])
      if (balRes.ok) {
        const data = await balRes.json()
        setBalance(parseFloat(data.balance_ngn ?? "0"))
        setTag(data.foodra_tag ?? "")
        setHasPin(!!data.has_pin)
      }
      if (txRes.ok) setTransactions(await txRes.json())
    } finally {
      setLoading(false)
    }
  }, [currentUser, getAccessToken])

  useEffect(() => { loadWallet() }, [loadWallet])

  useEffect(() => {
    if (searchParams.get("funded") === "1") {
      toast.success("Payment received! Your balance will update shortly.")
      router.replace("/wallet")
      setTimeout(loadWallet, 3000)
    }
  }, [searchParams]) // eslint-disable-line

  const copyTag = () => {
    navigator.clipboard.writeText(tag)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalIn = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount_ngn, 0)
  const totalOut = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount_ngn, 0)

  if (loading) return <WalletPageSkeleton />

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-5">

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#118C4C] via-[#0f7a41] to-[#0a5c31] p-6 text-white shadow-xl"
        >
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium opacity-90">Foodra Wallet</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-white/15 px-2.5 py-1 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                <span>Secured</span>
              </div>
            </div>

            <p className="text-sm opacity-70 mb-1">Available Balance</p>
            <h1 className="text-4xl font-black tracking-tight mb-5">
              ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </h1>

            <div className="flex items-center justify-between">
              <button
                onClick={copyTag}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-xl text-sm"
              >
                <span className="font-mono font-semibold">{tag}</span>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
              </button>
              <button onClick={loadWallet} className="opacity-60 hover:opacity-100 transition-opacity">
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total In</p>
              <p className="font-bold text-sm text-green-600">+₦{totalIn.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Out</p>
              <p className="font-bold text-sm text-red-500">-₦{totalOut.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Fund", icon: <PlusCircle className="h-5 w-5" />, onClick: () => setFundOpen(true), color: "text-[#118C4C]", bg: "bg-[#118C4C]/10" },
            { label: "Send", icon: <ArrowUpRight className="h-5 w-5" />, onClick: () => setSendOpen(true), color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Withdraw", icon: <Banknote className="h-5 w-5" />, onClick: () => setWithdrawOpen(true), color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
            { label: hasPin ? "Change PIN" : "Set PIN", icon: <ShieldCheck className="h-5 w-5" />, onClick: () => setPinOpen(true), color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-[#118C4C]/40 hover:shadow-sm transition-all active:scale-95"
            >
              <span className={`w-10 h-10 rounded-full ${a.bg} ${a.color} flex items-center justify-center`}>
                {a.icon}
              </span>
              <span className="text-xs font-semibold text-foreground">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div className="rounded-3xl bg-card border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-bold text-sm">Transaction History</h2>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {transactions.length} recent
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Fund your wallet to get started</p>
            </div>
          ) : (
            <AnimatePresence>
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "credit"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                        : "bg-red-100 dark:bg-red-900/30 text-red-500"
                    }`}>
                      {tx.type === "credit"
                        ? <ArrowDownLeft className="h-4 w-4" />
                        : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {CATEGORY_LABELS[tx.category] ?? tx.category}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{tx.note}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(tx.created_at).toLocaleDateString("en-NG", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                      {tx.type === "credit" ? "+" : "-"}₦{tx.amount_ngn.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bal: ₦{tx.balance_after.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

      </div>

      <FundWalletModal isOpen={fundOpen} onClose={() => setFundOpen(false)} />
      <WalletSendModal
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        currentBalance={balance}
        onSuccess={(newBal) => { setBalance(newBal); loadWallet() }}
      />
      <WalletWithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        currentBalance={balance}
        onSuccess={(newBal) => { setBalance(newBal); loadWallet() }}
      />
      <WalletPinModal
        isOpen={pinOpen}
        onClose={() => { setPinOpen(false); loadWallet() }}
        hasPin={hasPin}
      />
    </div>
  )
}

export default withAuth(WalletPage)
