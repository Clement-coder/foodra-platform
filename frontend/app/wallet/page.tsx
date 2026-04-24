"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePrivy, useSendTransaction, useFundWallet } from "@privy-io/react-auth"
import { ethers } from "ethers"
import { QRCodeSVG } from "qrcode.react"
import { FormInput } from "@/components/FormInput"
import { DollarSign, History, PlusCircle, MinusCircle, Copy, RefreshCcw, Wallet, Eye, EyeOff, Banknote, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/Modal"
import { useToast } from "@/lib/toast"
import { TransactionItem } from "@/components/TransactionItem"
import { baseSepolia } from "viem/chains"
import type { Chain } from "viem"
import { useUser } from "@/lib/useUser"
import { supabase } from "@/lib/supabase"
import { authFetch } from "@/lib/authFetch"

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  type?: "eth" | "usdc";
  tokenSymbol?: string;
  tokenDecimals?: string;
}

interface RateSettings {
  base_ngn_per_usdc: number;
  spread_percent: number;
}

interface FundRequest {
  id: string;
  reference: string;
  ngn_amount: number;
  usdc_amount: number;
  rate_ngn_per_usdc: number;
  spread_percent: number;
  status: "Pending" | "Confirmed" | "Rejected" | "Expired";
  expires_at: string;
  created_at: string;
}

// Smooth count-up hook
function useCountUp(target: number, active: boolean, duration = 800) {
  const [display, setDisplay] = useState("0")
  useEffect(() => {
    if (!active) { setDisplay("0"); return }
    const start = performance.now()
    const decimals = target % 1 !== 0 ? (String(target).split(".")[1]?.length ?? 4) : 0
    const raf = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay((eased * target).toFixed(decimals))
      if (progress < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, active])
  return display
}

// Countdown hook
function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0")
  const s = (secondsLeft % 60).toString().padStart(2, "0")
  return { secondsLeft, display: `${m}:${s}` }
}

function WalletPage() {
  const { user, getAccessToken } = usePrivy()
  const { sendTransaction } = useSendTransaction()
  const { fundWallet } = useFundWallet()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [balance, setBalance] = useState<string>("0")
  const [usdNgnRate, setUsdNgnRate] = useState<number | null>(null)
  const [ethToUsdRate, setEthToUsdRate] = useState<number | null>(null)
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false)
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false)
  const [isConfirmWithdrawModalOpen, setIsConfirmWithdrawModalOpen] = useState(false)
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false)
  const [isNgnFundModalOpen, setIsNgnFundModalOpen] = useState(false)
  const [isNgnConfirmModalOpen, setIsNgnConfirmModalOpen] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionFilter, setTransactionFilter] = useState<"all" | "send" | "receive">("all")
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string>("0")
  const [balanceVisible, setBalanceVisible] = useState(() => {
    if (typeof window === "undefined") return true
    const stored = localStorage.getItem("foodra_balance_visible")
    return stored === null ? true : stored === "true"
  })
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [selectedChain] = useState<Chain>(baseSepolia)
  // NGN funding state
  const [rateSettings, setRateSettings] = useState<RateSettings | null>(null)
  const [ngnAmount, setNgnAmount] = useState("")
  const [activeFundRequest, setActiveFundRequest] = useState<FundRequest | null>(null)
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([])
  const [isSubmittingFund, setIsSubmittingFund] = useState(false)
  const { secondsLeft, display: countdownDisplay } = useCountdown(activeFundRequest?.expires_at ?? null)

  const effectiveRate = rateSettings ? rateSettings.base_ngn_per_usdc : null
  const previewUsdc = effectiveRate && ngnAmount && parseFloat(ngnAmount) > 0
    ? (parseFloat(ngnAmount) / effectiveRate).toFixed(4)
    : null

  const usdcNum = parseFloat(usdcBalance) || 0
  const ngnEquiv = usdNgnRate ? usdcNum * usdNgnRate : 0
  const countedUsdc = useCountUp(usdcNum, balanceVisible)
  const countedNgn = useCountUp(ngnEquiv, balanceVisible && !!usdNgnRate, 900)

  const fetchWalletData = async () => {
    const address = user?.wallet?.address
    if (!address) return
    setIsRefreshingBalance(true)
    try {
      const provider = new ethers.JsonRpcProvider("https://sepolia.base.org")

      // ETH balance
      const rawBalance = await provider.getBalance(address)
      setBalance(parseFloat(ethers.formatEther(rawBalance)).toFixed(6))

      // USDC balance — try contract first, fall back to Blockscout token balances
      const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS
      if (usdcAddress) {
        try {
          const usdcContract = new ethers.Contract(
            usdcAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          )
          const raw: bigint = await usdcContract.balanceOf(address)
          setUsdcBalance((Number(raw) / 1_000_000).toFixed(4))
        } catch {
          // fallback: fetch from Blockscout token balances
          const res = await fetch(`https://base-sepolia.blockscout.com/api/v2/addresses/${address}/token-balances`)
          if (res.ok) {
            const tokens = await res.json()
            const usdc = tokens.find((t: any) => t.token?.symbol?.toUpperCase().includes("USDC"))
            if (usdc) setUsdcBalance((Number(usdc.value) / Math.pow(10, Number(usdc.token?.decimals || 6))).toFixed(4))
          }
        }
      } else {
        // No contract address configured — fetch all token balances and find USDC
        const res = await fetch(`https://base-sepolia.blockscout.com/api/v2/addresses/${address}/token-balances`)
        if (res.ok) {
          const tokens = await res.json()
          const usdc = tokens.find((t: any) => t.token?.symbol?.toUpperCase().includes("USDC"))
          if (usdc) setUsdcBalance((Number(usdc.value) / Math.pow(10, Number(usdc.token?.decimals || 6))).toFixed(4))
        }
      }

      // Transactions
      const txRes = await fetch(`/api/wallet/transactions?address=${address}`)
      const txData = await txRes.json()
      if (txData.status === "1" && Array.isArray(txData.result)) {
        setTransactions(txData.result)
      } else {
        setTransactions([])
      }
    } catch {
      toast.error("Could not fetch wallet data. Check your connection.")
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  const fetchRateSettings = async () => {
    try {
      const res = await authFetch(getAccessToken, "/api/admin/rate")
      if (res.ok) {
        const data = await res.json()
        if (data?.base_ngn_per_usdc) setRateSettings(data)
        else setRateSettings({ base_ngn_per_usdc: 1600, spread_percent: 2.5 })
      } else {
        setRateSettings({ base_ngn_per_usdc: 1600, spread_percent: 2.5 })
      }
    } catch {
      setRateSettings({ base_ngn_per_usdc: 1600, spread_percent: 2.5 })
    }
  }

  const fetchFundRequests = async () => {
    if (!currentUser?.id) return
    // Auto-expire stale requests first
    await fetch("/api/wallet/expire-requests", { method: "POST" }).catch(() => {})
    try {
      const res = await authFetch(getAccessToken, `/api/wallet/fund-request?userId=${currentUser.id}`)
      if (res.ok) {
        const list: FundRequest[] = await res.json()
        setFundRequests(list)
        const pending = list.find(r => r.status === "Pending" && new Date(r.expires_at) > new Date())
        setActiveFundRequest(pending ?? null)
      }
    } catch { /* ignore */ }
  }

  const fetchEthRate = async () => {
    try {
      const [ethRes, fxRes] = await Promise.all([
        fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"),
        fetch("https://open.er-api.com/v6/latest/USD"),
      ])
      const ethData = await ethRes.json()
      const fxData = await fxRes.json()
      const ethUsd: number = ethData?.ethereum?.usd ?? 0
      const usdNgn: number = fxData?.rates?.NGN ?? 1600
      if (ethUsd) setEthToUsdRate(ethUsd)
      setUsdNgnRate(usdNgn)
    } catch (error) {
      console.error("Error fetching rates:", error)
    }
  }

  useEffect(() => {
    if (user?.wallet?.address) {
      fetchWalletData()
      fetchEthRate()
    }
  }, [user?.wallet?.address, selectedChain])

  useEffect(() => {
    fetchRateSettings()
  }, [])

  useEffect(() => {
    fetchFundRequests()
  }, [currentUser?.id])

  // Realtime: update fund request status when admin confirms/rejects
  useEffect(() => {
    if (!currentUser?.id) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`wfr:${currentUser.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "wallet_funding_requests",
          filter: `user_id=eq.${currentUser.id}`,
        }, (payload) => {
          const updated = payload.new as FundRequest
          setFundRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
          if (updated.status !== "Pending") setActiveFundRequest(null)
        })
        .subscribe()
    } catch { /* realtime unavailable, polling via fetchFundRequests is sufficient */ }
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [currentUser?.id])

  // Auto-expire active request when countdown hits 0
  useEffect(() => {
    if (activeFundRequest && secondsLeft === 0) {
      setActiveFundRequest(null)
      fetchFundRequests()
    }
  }, [secondsLeft])

  useEffect(() => {
    // Real-time validation for recipient address
    if (recipientAddress && !ethers.isAddress(recipientAddress)) {
      setRecipientError("Please enter a valid recipient address.")
    } else {
      setRecipientError(null)
    }

    

    // Real-time validation for withdrawal amount
    if (withdrawAmount) {
      if (parseFloat(withdrawAmount) <= 0) {
        setAmountError("Please enter a valid amount.")
      } else if (parseFloat(withdrawAmount) > parseFloat(balance)) {
        setAmountError("Insufficient balance.")
      } else {
        setAmountError(null)
      }
    } else {
      setAmountError(null)
    }
  }, [recipientAddress, withdrawAmount, balance])

  const handleRefreshWalletData = async () => {
    await fetchWalletData()
    await fetchEthRate()
    toast.success("Wallet data refreshed!")
  }

  const handleRefreshTransactions = async () => {
    setIsRefreshingTransactions(true)
    await fetchWalletData()
    setIsRefreshingTransactions(false)
    toast.success("Transaction history refreshed!")
  }

  const copyToClipboard = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address)
      toast.success("Address copied to clipboard!")
    }
  }

  const copyText = (text: string, label = "Copied!") => {
    navigator.clipboard.writeText(text)
    toast.success(label)
  }

  const handleWithdraw = () => {
    if (recipientError || amountError || !recipientAddress || !withdrawAmount) {
      return
    }
    setIsWithdrawFundsModalOpen(false)
    setIsConfirmWithdrawModalOpen(true)
  }

  const confirmWithdraw = async () => {
    try {
      const valueInWei = ethers.parseEther(withdrawAmount)

      await sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: valueInWei,
        chainId: `0x${selectedChain.id.toString(16)}` as any,
      })

      toast.success("Transaction submitted successfully!")
      setIsConfirmWithdrawModalOpen(false)
      setRecipientAddress("")
      setWithdrawAmount("")

      setTimeout(() => {
        fetchWalletData()
      }, 3000)
    } catch (error) {
      console.error("Error sending transaction:", error)
      toast.error("Transaction failed. Please try again.")
      setIsConfirmWithdrawModalOpen(false)
    }
  }

  const handleNgnFundSubmit = async () => {
    if (!currentUser?.id || !ngnAmount || parseFloat(ngnAmount) <= 0) return
    setIsSubmittingFund(true)
    try {
      const res = await authFetch(getAccessToken, "/api/wallet/fund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngnAmount: parseFloat(ngnAmount) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to create funding request. Please try again.")
        return
      }
      const req: FundRequest = await res.json()
      setActiveFundRequest(req)
      setFundRequests(prev => [req, ...prev])
      setNgnAmount("")
      setIsNgnFundModalOpen(false)
      setIsNgnConfirmModalOpen(true)
    } catch {
      toast.error("Failed to create funding request. Please try again.")
    } finally {
      setIsSubmittingFund(false)
    }
  }

  const filteredTransactions = transactions.filter((txn) => {
    if (!user?.wallet?.address) return false
    if (transactionFilter === "all") return true
    if (transactionFilter === "send") {
      return txn.from.toLowerCase() === user.wallet.address.toLowerCase()
    }
    if (transactionFilter === "receive") {
      return txn.to.toLowerCase() === user.wallet.address.toLowerCase()
    }
    return true
  })

  const isWithdrawButtonDisabled = !!recipientError || !!amountError || !recipientAddress || !withdrawAmount

  const shortAddress = user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : ""

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

          {/* ── Hero Balance Card ── */}
          <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] shadow-2xl text-white p-6">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative z-10">
              {/* top row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-base font-semibold text-white/90">Foodra Wallet</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBalanceVisible(v => {
                    const next = !v
                    localStorage.setItem("foodra_balance_visible", String(next))
                    return next
                  })} className="p-2 rounded-full hover:bg-white/10 transition-colors" title={balanceVisible ? "Hide balance" : "Show balance"}>
                    {balanceVisible ? <EyeOff className="h-5 w-5 text-white/80" /> : <Eye className="h-5 w-5 text-white/80" />}
                  </button>
                  <button onClick={handleRefreshWalletData} disabled={isRefreshingBalance} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <RefreshCcw className={`h-5 w-5 text-white/80 ${isRefreshingBalance ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* balance — futuristic animated toggle */}
              <div className="mb-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-[0.2em] mb-2">Total Balance</p>
                <div className="flex items-end gap-3 h-16 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {isRefreshingBalance && balance === "0" ? (
                      <motion.div key="loading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-12 w-40 rounded-xl bg-white/20 animate-pulse" />
                    ) : balanceVisible ? (
                      <motion.span key="visible"
                        initial={{ opacity: 0, filter: "blur(12px)", y: 8 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(12px)", y: -8 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="text-6xl font-bold tracking-tight leading-none tabular-nums">
                        {countedUsdc}
                      </motion.span>
                    ) : (
                      <motion.span key="hidden"
                        initial={{ opacity: 0, filter: "blur(12px)", y: 8 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(12px)", y: -8 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="text-6xl font-bold tracking-tight leading-none text-white/40 select-none">
                        ••••••
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="text-2xl font-semibold text-white/60 mb-1">USDC</span>
                </div>
                <AnimatePresence mode="wait">
                  {usdNgnRate && (
                    <motion.p key={balanceVisible ? "ngn-v" : "ngn-h"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-base text-white/60 mt-1 font-medium tabular-nums">
                      {balanceVisible
                        ? `≈ ₦${parseFloat(countedNgn).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "≈ ₦••••••"}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* address + network row */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-sm text-white/60 font-medium">Base Sepolia (Testnet)</span>
                </div>
                {user?.wallet?.address && (
                  <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-mono">
                    <Copy className="h-3.5 w-3.5" />
                    {shortAddress}
                  </button>
                )}
              </div>
              {/* Testnet notice */}
              <div className="mt-3 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-2">
                <span className="text-yellow-300 text-xs font-semibold">⚠ Testnet</span>
                <span className="text-white/50 text-xs">This wallet uses Base Sepolia. Funds are not real.</span>
              </div>

              {/* gas balance */}
              <p className="text-sm text-white/40 mt-2 font-medium">
                Gas: {balanceVisible ? `${balance} ETH` : "•••••"}
              </p>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: "Add Funds", icon: PlusCircle, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400", onClick: () => setIsAddFundsModalOpen(true), desc: "Receive crypto" },
              { label: "Buy Crypto", icon: CreditCard, color: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400", onClick: () => user?.wallet?.address && fundWallet({ address: user.wallet.address, options: { chain: baseSepolia } }), desc: "Card / Bank" },
              { label: "Fund NGN", icon: Banknote, color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400", onClick: () => setIsNgnFundModalOpen(true), desc: "Bank transfer" },
              { label: "Send", icon: MinusCircle, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400", onClick: () => setIsWithdrawFundsModalOpen(true), desc: "Withdraw ETH" },
              { label: "Bridge", icon: RefreshCcw, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400", onClick: () => setIsComingSoonModalOpen(true), desc: "Cross-chain" },
            ].map(({ label, icon: Icon, color, onClick, desc }) => (
              <button key={label} onClick={onClick}
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-card border border-border hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight text-center">{label}</span>
                <span className="text-xs text-muted-foreground leading-tight text-center hidden sm:block">{desc}</span>
              </button>
            ))}
          </div>

          {/* ── Active Funding Request Banner ── */}
          {activeFundRequest && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-800/40 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-yellow-800 dark:text-yellow-300">Pending Bank Transfer</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
                      Send ₦{Number(activeFundRequest.ngn_amount).toLocaleString()} · ref: <strong>{activeFundRequest.reference}</strong>
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-0.5">
                      You receive <strong>{activeFundRequest.usdc_amount} USDC</strong>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-lg font-mono font-bold ${secondsLeft < 120 ? "text-red-600" : "text-yellow-700 dark:text-yellow-300"}`}>
                    {countdownDisplay}
                  </span>
                  <button onClick={() => setIsNgnConfirmModalOpen(true)}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── NGN Funding History ── */}
          {fundRequests.length > 0 && (
            <div className="mb-6 rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">NGN Funding History</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {fundRequests.slice(0, 5).map(r => (
                  <div key={r.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-bold text-[#118C4C]">{r.reference}</span>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        ₦{Number(r.ngn_amount).toLocaleString()} → {r.usdc_amount} USDC
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${
                      r.status === "Confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : r.status === "Rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : r.status === "Expired" ? "bg-gray-100 text-muted-foreground dark:bg-gray-800 dark:text-muted-foreground"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Transaction History ── */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Transaction History</h2>
              </div>
              <div className="flex items-center gap-1.5">
                {(["all", "send", "receive"] as const).map(f => (
                  <button key={f} onClick={() => setTransactionFilter(f)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors capitalize ${
                      transactionFilter === f
                        ? "bg-[#118C4C] text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-muted-foreground hover:bg-accent dark:hover:bg-gray-700"
                    }`}>
                    {f}
                  </button>
                ))}
                <button onClick={handleRefreshTransactions} disabled={isRefreshingTransactions}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50">
                  <RefreshCcw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshingTransactions ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            <div className="p-4">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <History className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-base font-medium">No transactions yet</p>
                  <p className="text-sm text-center">Your on-chain activity will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredTransactions.map(txn => (
                    <TransactionItem
                      key={txn.hash + txn.type}
                      txn={txn}
                      userAddress={user!.wallet!.address}
                      usdNgnRate={usdNgnRate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </motion.div>
      </div>

      <Modal
        isOpen={isAddFundsModalOpen}
        onClose={() => setIsAddFundsModalOpen(false)}
        title="Add Funds to Wallet"
      >
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">Scan the QR code or copy the address below to send Base Sepolia ETH to your wallet.</p>
          {user?.wallet?.address && (
            <>
              <div className="flex justify-center">
                <QRCodeSVG value={user.wallet.address} size={256} />
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <p className="font-mono break-all text-sm">{user.wallet.address}</p>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isWithdrawFundsModalOpen}
        onClose={() => setIsWithdrawFundsModalOpen(false)}
        title="Withdraw Funds from Wallet"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Enter the recipient address and the amount you wish to withdraw.</p>
          <div>
            <FormInput
              label="Recipient Address"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
            />
            {recipientError && <p className="text-red-500 text-sm mt-1">{recipientError}</p>}
          </div>
          <div>
            <FormInput
              label="Amount (ETH)"
              placeholder="0.0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
            />
            {amountError && <p className="text-red-500 text-sm mt-1">{amountError}</p>}
            {parseFloat(withdrawAmount) > 0 && ethToUsdRate && usdNgnRate && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>~₦{(parseFloat(withdrawAmount) * ethToUsdRate * usdNgnRate).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN</p>
              </div>
            )}
          </div>
          <Button onClick={handleWithdraw} className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isWithdrawButtonDisabled}>
            Continue
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmWithdrawModalOpen}
        onClose={() => setIsConfirmWithdrawModalOpen(false)}
        title="Confirm Withdrawal"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Please confirm the withdrawal details:</p>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Recipient</p>
              <p className="font-mono text-sm break-all">{recipientAddress}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-bold text-lg">{withdrawAmount} ETH</p>
              {ethToUsdRate && usdNgnRate && (
                <div className="mt-1 text-sm text-muted-foreground">
                  <p>~₦{(parseFloat(withdrawAmount) * ethToUsdRate * usdNgnRate).toFixed(2)} NGN</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsConfirmWithdrawModalOpen(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmWithdraw} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              Confirm Withdrawal
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
        title="Feature Coming Soon"
      >
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">The fund bridging functionality is currently under development and will be available soon. Stay tuned for updates!</p>
          <Button onClick={() => setIsComingSoonModalOpen(false)} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
            Close
          </Button>
        </div>
      </Modal>

      {/* NGN Fund — enter amount */}
      <Modal isOpen={isNgnFundModalOpen} onClose={() => setIsNgnFundModalOpen(false)} title="Fund Wallet with NGN">
        <div className="space-y-4">
          {rateSettings && effectiveRate ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm space-y-1">
              <p className="font-semibold text-blue-700 dark:text-blue-300">Current Exchange Rate</p>
              <p className="text-blue-600 dark:text-blue-400">₦{rateSettings.base_ngn_per_usdc.toFixed(2)} = 1 USDC</p>
              <p className="text-xs text-green-600 font-medium">✓ No platform fee — free conversion</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading rate…</p>
          )}
          <FormInput
            label="Amount in NGN (₦)"
            placeholder="e.g. 50000"
            value={ngnAmount}
            onChange={e => setNgnAmount(e.target.value)}
            required
          />
          {previewUsdc && effectiveRate && (
            <div className={`rounded-xl p-3 text-sm space-y-1 border ${parseFloat(previewUsdc) < 1 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}`}>
              <p className="text-xs text-muted-foreground">You will receive</p>
              <p className={`text-2xl font-bold ${parseFloat(previewUsdc) < 1 ? "text-red-600" : "text-[#118C4C]"}`}>{previewUsdc} <span className="text-base">USDC</span></p>
              {parseFloat(previewUsdc) < 1
                ? <p className="text-xs text-red-600 font-medium">Minimum is 1 USDC. Enter at least ₦{effectiveRate ? Math.ceil(effectiveRate).toLocaleString() : "—"}</p>
                : <p className="text-xs text-muted-foreground">Rate: ₦{rateSettings?.base_ngn_per_usdc?.toFixed(2)} per USDC · Free, no fees</p>
              }
            </div>
          )}
          <p className="text-xs text-muted-foreground">After confirming, you will receive a unique reference and bank account details. Transfer the exact NGN amount and include the reference in your narration.</p>
          <Button
            onClick={handleNgnFundSubmit}
            disabled={isSubmittingFund || !ngnAmount || parseFloat(ngnAmount) <= 0 || !effectiveRate || (!!previewUsdc && parseFloat(previewUsdc) < 1)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-base font-semibold py-3"
          >
            {isSubmittingFund ? "Creating request…" : "Continue"}
          </Button>
        </div>
      </Modal>

      {/* NGN Fund — bank transfer instructions */}
      <Modal isOpen={isNgnConfirmModalOpen} onClose={() => setIsNgnConfirmModalOpen(false)} title="Complete Your Bank Transfer">
        {activeFundRequest && (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
              secondsLeft > 120 ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
              : secondsLeft > 0 ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              : "bg-gray-100 text-muted-foreground"}`}>
              <Clock className="h-4 w-4 flex-shrink-0" />
              {secondsLeft > 0 ? <>Expires in <strong className="ml-1 font-mono">{countdownDisplay}</strong></> : "This request has expired"}
            </div>

            <div className="bg-muted rounded-xl p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reference (include in narration)</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-[#118C4C] text-base">{activeFundRequest.reference}</span>
                  <button onClick={() => copyText(activeFundRequest.reference, "Reference copied!")} className="p-1 hover:bg-accent rounded">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount to transfer</span>
                <span className="font-bold text-lg">₦{Number(activeFundRequest.ngn_amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-bold text-[#118C4C]">{activeFundRequest.usdc_amount} USDC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>₦{Number(activeFundRequest.rate_ngn_per_usdc).toFixed(2)} / USDC</span>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground">Bank Transfer Details</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium">Foodra Finance Bank</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Number</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold">0123456789</span>
                  <button onClick={() => copyText("0123456789", "Account number copied!")} className="p-1 hover:bg-accent rounded">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account Name</span><span className="font-medium">Foodra Platform Ltd</span></div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p className="font-semibold">⚠ Important</p>
              <p>You MUST include <strong>{activeFundRequest.reference}</strong> in your transfer narration/description.</p>
              <p>Transfer the exact amount of ₦{Number(activeFundRequest.ngn_amount).toLocaleString()}. Partial transfers will not be processed.</p>
              <p>USDC will be credited within 30 minutes of confirmation.</p>
            </div>

            <Button onClick={() => setIsNgnConfirmModalOpen(false)} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
              I&apos;ve Made the Transfer
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WalletPage
