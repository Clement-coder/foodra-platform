"use client"

import { useState, useEffect, useRef } from "react"
import { ethers } from "ethers"
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ArrowLeft, CheckCircle, Loader2, AlertCircle, ShieldCheck, X } from "lucide-react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { USDC_ADDRESS, USDC_ABI } from "@/lib/escrow"
import { authFetch } from "@/lib/authFetch"
import Image from "next/image"

interface FoodraUser {
  id: string
  name: string
  avatar: string
  wallet: string
  role?: string
  isVerified?: boolean
}

type Token = "ETH" | "USDC"
type Step = "recipient" | "amount" | "review" | "sending" | "success" | "error"

interface Props {
  isOpen: boolean
  onClose: () => void
  ethBalance: string
  usdcBalance: string
  usdNgnRate: number | null
  ethToUsdRate: number | null
  onSuccess: () => void
}

export function SendModal({ isOpen, onClose, ethBalance, usdcBalance, usdNgnRate, ethToUsdRate, onSuccess }: Props) {
  const { user, getAccessToken } = usePrivy()
  const { sendTransaction } = useSendTransaction()
  const { wallets } = useWallets()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>("recipient")
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<FoodraUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selected, setSelected] = useState<FoodraUser | null>(null)
  const [manualAddress, setManualAddress] = useState("")
  const [token, setToken] = useState<Token>("USDC")
  const [amount, setAmount] = useState("")
  const [txHash, setTxHash] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("recipient"); setQuery(""); setUsers([])
        setSelected(null); setManualAddress(""); setAmount("")
        setTxHash(""); setErrorMsg(""); setToken("USDC")
      }, 300)
    }
  }, [isOpen])

  // Debounced user search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    if (query.length < 2) { setUsers([]); return }
    searchRef.current = setTimeout(async () => {
      setLoadingUsers(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data = res.ok ? await res.json() : []
        // Filter out self and users without a wallet address
        setUsers(data.filter((u: FoodraUser) => u.wallet && u.wallet !== user?.wallet?.address))
      } catch { setUsers([]) }
      finally { setLoadingUsers(false) }
    }, 350)
  }, [query])

  const recipient = selected?.wallet || manualAddress
  const recipientLabel = selected?.name || (recipient ? `${recipient.slice(0, 8)}...${recipient.slice(-6)}` : "")

  const balance = token === "ETH" ? parseFloat(ethBalance) : parseFloat(usdcBalance)
  const amountNum = parseFloat(amount) || 0
  const ngnEquiv = token === "USDC" && usdNgnRate
    ? amountNum * usdNgnRate
    : token === "ETH" && ethToUsdRate && usdNgnRate
      ? amountNum * ethToUsdRate * usdNgnRate
      : null

  const isValidAddress = ethers.isAddress(recipient)
  const isValidAmount = amountNum > 0 && amountNum <= balance

  const handleSelectUser = (u: FoodraUser) => {
    setSelected(u); setManualAddress(""); setQuery(""); setUsers([])
    setStep("amount")
  }

  const handleManualContinue = () => {
    if (!isValidAddress) return
    setSelected(null)
    setStep("amount")
  }

  const handleSend = async () => {
    if (!isValidAddress || !isValidAmount) return
    setStep("sending")
    setErrorMsg("")

    try {
      let finalTxHash = ""

      if (token === "ETH") {
        await sendTransaction({
          to: recipient as `0x${string}`,
          value: ethers.parseEther(amount),
          chainId: `0x${(Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 84532).toString(16)}` as any,
        })
      } else {
        // USDC transfer via contract
        const wallet = wallets[0]
        if (!wallet) throw new Error("No wallet connected")
        const requiredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532)
        await wallet.switchChain(requiredChainId)
        const provider = new ethers.BrowserProvider(await wallet.getEthereumProvider())
        const signer = await provider.getSigner()
        const usdc = new ethers.Contract(USDC_ADDRESS, [
          ...USDC_ABI,
          "function transfer(address to, uint256 amount) external returns (bool)",
        ], signer)
        const rawAmount = BigInt(Math.round(amountNum * 1_000_000))
        const tx = await usdc.transfer(recipient, rawAmount)
        const receipt = await tx.wait()
        if (!receipt || receipt.status === 0) throw new Error("Transaction reverted")
        finalTxHash = receipt.hash
      }

      setTxHash(finalTxHash)
      setStep("success")
      onSuccess()

      // Fire confirmation email (non-blocking)
      authFetch(getAccessToken, "/api/wallet/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, token, toAddress: recipient,
          toName: selected?.name ?? null,
          txHash: finalTxHash || null,
          ngnEquiv: ngnEquiv ?? null,
        }),
      }).catch(() => {})

    } catch (err: any) {
      const msg = err?.reason || err?.shortMessage || err?.message || "Transaction failed"
      setErrorMsg(msg)
      setStep("error")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={step === "sending" ? () => {} : onClose} title="">
      <div className="min-h-[320px] flex flex-col">

        {/* ── Step: Recipient ── */}
        {step === "recipient" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Send</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Search a Foodra member or enter any wallet address</p>
            </div>

            {/* Search Foodra users */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40"
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(""); setUsers([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Results */}
            <AnimatePresence>
              {loadingUsers && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loadingUsers && users.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {users.map(u => (
                    <button key={u.id} onClick={() => handleSelectUser(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left">
                      <div className="relative flex-shrink-0">
                        {u.avatar ? (
                          <Image src={u.avatar} alt={u.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#118C4C]/10 flex items-center justify-center text-[#118C4C] font-bold text-sm">
                            {u.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        {u.isVerified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#118C4C] rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {u.wallet.slice(0, 10)}...{u.wallet.slice(-6)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                        {u.role ?? "member"}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
              {!loadingUsers && query.length >= 2 && users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No Foodra members found</p>
              )}
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or send to address</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Manual address */}
            <div className="space-y-2">
              <input
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                placeholder="0x... wallet address"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40"
              />
              {manualAddress && !ethers.isAddress(manualAddress) && (
                <p className="text-xs text-red-500">Invalid wallet address</p>
              )}
              <Button
                onClick={handleManualContinue}
                disabled={!isValidAddress || !!selected}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Amount ── */}
        {step === "amount" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("recipient")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-foreground">Amount</h2>
                <p className="text-sm text-muted-foreground">To {recipientLabel}</p>
              </div>
            </div>

            {/* Recipient chip */}
            {selected && (
              <div className="flex items-center gap-3 bg-[#118C4C]/5 border border-[#118C4C]/20 rounded-xl px-4 py-3">
                {selected.avatar ? (
                  <Image src={selected.avatar} alt={selected.name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" unoptimized />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#118C4C]/20 flex items-center justify-center text-[#118C4C] font-bold text-sm">
                    {selected.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{selected.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selected.wallet.slice(0, 10)}...{selected.wallet.slice(-6)}</p>
                </div>
                {selected.isVerified && <ShieldCheck className="h-4 w-4 text-[#118C4C] ml-auto" />}
              </div>
            )}

            {/* Token selector */}
            <div className="flex gap-2 bg-muted p-1 rounded-xl">
              {(["USDC", "ETH"] as Token[]).map(t => (
                <button key={t} onClick={() => { setToken(t); setAmount("") }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${token === t ? "bg-white dark:bg-gray-800 shadow text-foreground" : "text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-4xl font-bold text-center bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 py-4"
                autoFocus
              />
              <p className="text-center text-sm text-muted-foreground">{token}</p>
              {ngnEquiv !== null && amountNum > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-1">
                  ≈ ₦{ngnEquiv.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Balance + Max */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Balance: {balance.toFixed(4)} {token}</span>
              <button onClick={() => setAmount(balance.toString())}
                className="text-[#118C4C] font-semibold text-xs bg-[#118C4C]/10 px-3 py-1 rounded-full hover:bg-[#118C4C]/20 transition-colors">
                Max
              </button>
            </div>

            {amountNum > balance && (
              <p className="text-xs text-red-500 text-center">Insufficient {token} balance</p>
            )}

            <Button
              onClick={() => setStep("review")}
              disabled={!isValidAmount}
              className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
            >
              Review
            </Button>
          </div>
        )}

        {/* ── Step: Review ── */}
        {step === "review" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep("amount")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-bold text-foreground">Review</h2>
            </div>

            <div className="bg-muted/40 rounded-2xl p-5 space-y-4">
              {/* Amount */}
              <div className="text-center pb-4 border-b border-border">
                <p className="text-4xl font-bold text-foreground">{amount} <span className="text-2xl text-muted-foreground">{token}</span></p>
                {ngnEquiv !== null && (
                  <p className="text-muted-foreground text-sm mt-1">≈ ₦{ngnEquiv.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                )}
              </div>

              {/* To */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">To</span>
                {selected ? (
                  <div className="flex items-center gap-2">
                    {selected.avatar ? (
                      <Image src={selected.avatar} alt={selected.name} width={28} height={28} className="w-7 h-7 rounded-full object-cover" unoptimized />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#118C4C]/20 flex items-center justify-center text-[#118C4C] font-bold text-xs">
                        {selected.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-semibold">{selected.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{recipient.slice(0, 8)}...{recipient.slice(-6)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-mono text-right break-all">{recipient.slice(0, 10)}...{recipient.slice(-8)}</p>
                )}
              </div>

              {/* Network */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm font-medium">Base Sepolia</span>
              </div>

              {/* Fee */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network fee</span>
                <span className="text-sm text-muted-foreground">~0.0001 ETH (gas)</span>
              </div>
            </div>

            <Button onClick={handleSend} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white text-base py-3">
              Confirm &amp; Send
            </Button>
          </div>
        )}

        {/* ── Step: Sending ── */}
        {step === "sending" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative w-16 h-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#118C4C] animate-spin" />
              </div>
            </div>
            <p className="font-semibold text-foreground text-lg">Sending {amount} {token}…</p>
            <p className="text-sm text-muted-foreground text-center">Approve the transaction in your wallet. Do not close this window.</p>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full bg-[#118C4C]/10 border-4 border-[#118C4C] flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-[#118C4C]" />
            </motion.div>
            <div>
              <p className="text-xl font-bold text-foreground">Sent Successfully!</p>
              <p className="text-muted-foreground text-sm mt-1">
                {amount} {token} sent to {selected?.name ?? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`}
              </p>
              {ngnEquiv !== null && (
                <p className="text-muted-foreground text-sm">≈ ₦{ngnEquiv.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              )}
            </div>
            {txHash && (
              <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#118C4C] underline font-mono">
                View on Basescan
              </a>
            )}
            <Button onClick={onClose} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Done</Button>
          </div>
        )}

        {/* ── Step: Error ── */}
        {step === "error" && (
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 border-4 border-red-300 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">Transaction Failed</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{errorMsg || "Something went wrong. Please try again."}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={() => setStep("review")} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Try Again</Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
