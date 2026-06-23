"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft,
  Banknote, Copy, Check, RefreshCcw, ShieldCheck, TrendingUp, Clock, Eye, EyeOff,
  X, Download, ExternalLink,
} from "lucide-react"
import { useToast } from "@/lib/toast"
import { useUser } from "@/lib/useUser"
import { authFetch } from "@/lib/authFetch"
import { usePrivy } from "@privy-io/react-auth"
import { WalletPageSkeleton } from "@/components/Skeleton"
import { FundWalletModal } from "@/components/FundWalletModal"
import { WalletSendModal } from "@/components/WalletSendModal"
import { WalletWithdrawModal } from "@/components/WalletWithdrawModal"
import { WalletPinModal } from "@/components/WalletPinModal"
import { downloadReceiptImage } from "@/lib/receipt"
import withAuth from "@/components/withAuth"

interface WalletTx {
  id: string
  type: "credit" | "debit"
  category: string
  amount_ngn: number
  balance_after: number
  note: string | null
  created_at: string
  reference?: string | null
  related_user_id?: string | null
  order_id?: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  fund:     "Wallet Funded",
  send:     "Money Sent",
  receive:  "Money Received",
  withdraw: "Bank Withdrawal",
  purchase: "Purchase",
  refund:   "Refund",
}

const CATEGORY_ICONS: Record<string, string> = {
  fund:     "💳",
  send:     "↗️",
  receive:  "↙️",
  withdraw: "🏦",
  purchase: "🛒",
  refund:   "↩️",
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
  const [selectedTx, setSelectedTx] = useState<WalletTx | null>(null)
  const [balanceVisible, setBalanceVisible] = useState(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("balanceVisible") !== "false"
  })
  const [leafBurst, setLeafBurst] = useState(false)
  const [displayBalance, setDisplayBalance] = useState(0)
  const countRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Count-up when balance becomes visible
  useEffect(() => {
    if (!balanceVisible) { setDisplayBalance(0); return }
    if (balance === 0) { setDisplayBalance(0); return }
    const duration = 900
    const steps = 50
    const increment = balance / steps
    let current = 0
    let step = 0
    const tick = () => {
      step++
      current = step >= steps ? balance : current + increment
      setDisplayBalance(current)
      if (step < steps) countRef.current = setTimeout(tick, duration / steps)
    }
    countRef.current = setTimeout(tick, 60)
    return () => { if (countRef.current) clearTimeout(countRef.current) }
  }, [balanceVisible, balance])

  const LEAVES = [
    { id: 1, emoji: "🌿", x: -40, y: -35, rotate: -45, size: "18px" },
    { id: 2, emoji: "🍃", x: 38,  y: -42, rotate: 30,  size: "16px" },
    { id: 3, emoji: "🌱", x: -30, y: 38,  rotate: -20, size: "15px" },
    { id: 4, emoji: "🍀", x: 44,  y: 28,  rotate: 55,  size: "17px" },
    { id: 5, emoji: "🌾", x: 8,   y: -50, rotate: 10,  size: "16px" },
    { id: 6, emoji: "🌿", x: -50, y: 5,   rotate: -70, size: "15px" },
    { id: 7, emoji: "🍃", x: 48,  y: -15, rotate: 80,  size: "16px" },
    { id: 8, emoji: "🌱", x: -18, y: 52,  rotate: 25,  size: "14px" },
    { id: 9, emoji: "🍃", x: 20,  y: 50,  rotate: -35, size: "15px" },
  ]

  // Floating leaves shown when balance is hidden
  const FLOAT_LEAVES = [
    { id: "f1", emoji: "🍃", x: 0,   delay: 0 },
    { id: "f2", emoji: "🌿", x: 28,  delay: 0.3 },
    { id: "f3", emoji: "🍀", x: 56,  delay: 0.6 },
    { id: "f4", emoji: "🌾", x: 84,  delay: 0.9 },
    { id: "f5", emoji: "🌱", x: 112, delay: 1.2 },
    { id: "f6", emoji: "🍃", x: 140, delay: 0.15 },
  ]

  const handleToggleVisibility = () => {
    setLeafBurst(true)
    setTimeout(() => setLeafBurst(false), 800)
    setBalanceVisible(v => !v)
  }

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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#118C4C] via-[#0f7a41] to-[#0a5c31] p-6 text-white shadow-xl">
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
            <div className="flex items-center gap-3 mb-5">
              <div className="relative min-w-[180px] h-12 flex items-center">
                <AnimatePresence mode="wait">
                  {balanceVisible ? (
                    <motion.h1
                      key="amount"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl font-black tracking-tight tabular-nums"
                    >
                      ₦{displayBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </motion.h1>
                  ) : (
                    <motion.div
                      key="leaves"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-0.5"
                    >
                      {FLOAT_LEAVES.map((leaf) => (
                        <motion.span
                          key={leaf.id}
                          className="text-xl select-none"
                          animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
                          transition={{ duration: 2.4, repeat: Infinity, delay: leaf.delay, ease: "easeInOut" }}
                        >
                          {leaf.emoji}
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Toggle button with burst */}
              <div className="relative mt-1 shrink-0">
                <AnimatePresence>
                  {leafBurst && LEAVES.map((leaf) => (
                    <motion.span
                      key={leaf.id}
                      className="absolute pointer-events-none select-none"
                      style={{ fontSize: leaf.size, left: "50%", top: "50%" }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                      animate={{ x: leaf.x, y: leaf.y, scale: 1.5, opacity: 0, rotate: leaf.rotate }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.75, ease: "easeOut" }}
                    >
                      {leaf.emoji}
                    </motion.span>
                  ))}
                </AnimatePresence>
                <button
                  onClick={handleToggleVisibility}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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
        </div>
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

        {/* Zero-fee notice */}
        <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200/70 dark:border-green-800/40 rounded-2xl px-4 py-3">
          <span className="text-base shrink-0">🎉</span>
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 leading-snug">
            Sending money to Foodra users &amp; paying for orders are <span className="underline underline-offset-2">completely free</span> — no hidden fees, no charges, ever.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Fund", icon: <PlusCircle className="h-5 w-5" />, onClick: () => setFundOpen(true), color: "text-[#118C4C]", bg: "bg-[#118C4C]/10", free: false },
            { label: "Send", icon: <ArrowUpRight className="h-5 w-5" />, onClick: () => setSendOpen(true), color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", free: true },
            { label: "Withdraw", icon: <Banknote className="h-5 w-5" />, onClick: () => setWithdrawOpen(true), color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20", free: false },
            { label: hasPin ? "Change PIN" : "Set PIN", icon: <ShieldCheck className="h-5 w-5" />, onClick: () => setPinOpen(true), color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", free: false },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-[#118C4C]/40 hover:shadow-sm transition-all active:scale-95"
            >
              {a.free && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none uppercase tracking-wide shadow-sm">
                  FREE
                </span>
              )}
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
                <motion.button
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedTx(tx)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${
                      tx.type === "credit"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}>
                      {CATEGORY_ICONS[tx.category] ?? (tx.type === "credit" ? "↙️" : "↗️")}
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
                </motion.button>
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

      {/* Transaction Detail Sheet */}
      <AnimatePresence>
        {selectedTx && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)} />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-w-lg mx-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-6 pt-2 pb-10 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Transaction Details</h2>
                  <button onClick={() => setSelectedTx(null)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Amount hero */}
                <div className={`rounded-2xl p-5 text-center space-y-1 ${selectedTx.type === "credit" ? "bg-green-50 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/30" : "bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[selectedTx.category] ?? selectedTx.category}
                  </p>
                  <p className={`text-4xl font-black ${selectedTx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                    {selectedTx.type === "credit" ? "+" : "-"}₦{selectedTx.amount_ngn.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedTx.created_at).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}
                  </p>
                </div>

                {/* Details rows */}
                <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
                  {[
                    { label: "Type", value: selectedTx.type === "credit" ? "Credit" : "Debit" },
                    { label: "Category", value: CATEGORY_LABELS[selectedTx.category] ?? selectedTx.category },
                    { label: "Balance After", value: `₦${selectedTx.balance_after.toLocaleString()}` },
                    ...(selectedTx.note ? [{ label: "Note", value: selectedTx.note }] : []),
                    ...(selectedTx.reference ? [{ label: "Reference", value: selectedTx.reference }] : []),
                    ...(selectedTx.order_id ? [{ label: "Order ID", value: selectedTx.order_id.slice(0, 8).toUpperCase() }] : []),
                    { label: "Transaction ID", value: selectedTx.id.slice(0, 16).toUpperCase() },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-semibold text-right max-w-[200px] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedTx.order_id && (
                    <a href={`/orders/${selectedTx.order_id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-border font-semibold text-sm hover:bg-muted/50 transition-colors">
                      <ExternalLink className="h-4 w-4" /> View Order
                    </a>
                  )}
                  <button
                    onClick={() => {
                      downloadReceiptImage({
                        title: "WALLET RECEIPT",
                        subtitle: CATEGORY_LABELS[selectedTx.category] ?? selectedTx.category,
                        lines: [
                          { label: "Type", value: selectedTx.type === "credit" ? "Credit ↙" : "Debit ↗" },
                          { label: "Category", value: CATEGORY_LABELS[selectedTx.category] ?? selectedTx.category },
                          { label: "Amount", value: `${selectedTx.type === "credit" ? "+" : "-"}₦${selectedTx.amount_ngn.toLocaleString()}`, bold: true, green: selectedTx.type === "credit" },
                          { label: "Balance After", value: `₦${selectedTx.balance_after.toLocaleString()}`, bold: true },
                          { label: "", value: "" },
                          ...(selectedTx.note ? [{ label: "Note", value: selectedTx.note, small: true }] : []),
                          ...(selectedTx.reference ? [{ label: "Reference", value: selectedTx.reference, small: true }] : []),
                          { label: "Transaction ID", value: selectedTx.id.slice(0, 16).toUpperCase(), small: true },
                          { label: "Date", value: new Date(selectedTx.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }), small: true },
                        ],
                        filename: `foodra-wallet-${selectedTx.id.slice(0, 8)}`,
                      })
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-bold text-sm transition-colors"
                  >
                    <Download className="h-4 w-4" /> Download Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default withAuth(WalletPage)
