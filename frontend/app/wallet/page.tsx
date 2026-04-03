"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth"
import { useAccount } from "wagmi"
import { ethers } from "ethers"
import { QRCodeSVG } from "qrcode.react"
import { FormInput } from "@/components/FormInput"
import { DollarSign, History, PlusCircle, MinusCircle, ArrowUpCircle, ArrowDownCircle, Copy, RefreshCcw, Wallet, ChevronDown, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { useToast } from "@/lib/toast"
import { TransactionItem } from "@/components/TransactionItem"
import { baseSepolia } from "viem/chains"
import type { Chain } from "viem"


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

function WalletPage() {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const { chainId } = useAccount()
  const { sendTransaction } = useSendTransaction()
  const { toast } = useToast()
  const [balance, setBalance] = useState<string>("0")
  const [usdNgnRate, setUsdNgnRate] = useState<number | null>(null)
  const [ethToUsdRate, setEthToUsdRate] = useState<number | null>(null)
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false)
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false)
  const [isConfirmWithdrawModalOpen, setIsConfirmWithdrawModalOpen] = useState(false)
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionFilter, setTransactionFilter] = useState<"all" | "send" | "receive">("all")
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string>("0")
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  const [selectedChain] = useState<Chain>(baseSepolia)

  const handleChainSwitch = (_chainId: number) => { /* locked to Base Sepolia */ }

  const fetchWalletData = async () => {
    if (user?.wallet?.address) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const provider = new ethers.JsonRpcProvider("https://sepolia.base.org")
        const balance = await provider.getBalance(user.wallet.address)
        setBalance(parseFloat(ethers.formatEther(balance)).toFixed(6))

        // Fetch MockUSDC balance
        const usdcAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS
        if (usdcAddress) {
          const usdcContract = new ethers.Contract(
            usdcAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          )
          const raw: bigint = await usdcContract.balanceOf(user.wallet.address)
          setUsdcBalance((Number(raw) / 1_000_000).toFixed(4))
        }

        const response = await fetch(`/api/wallet/transactions?address=${user.wallet.address}`)
        const data = await response.json()

        if (data.status === "1" && Array.isArray(data.result)) {
          setTransactions(data.result)
        } else {
          setTransactions([])
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error)
        toast.error("Error fetching wallet data.")
      }
    }
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
    fetchWalletData()
    fetchEthRate()
  }, [user, selectedChain])

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
    setIsRefreshingBalance(true)
    await fetchWalletData()
    await fetchEthRate()
    setIsRefreshingBalance(false)
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">My Wallet</h1>

        {user?.wallet?.address && (
          <Card className="mb-6 bg-gradient-to-br from-green-50 via-green-100 to-yellow-100">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Wallet Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm flex-1 min-w-0 truncate">{user.wallet.address}</p>
                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="flex-shrink-0 h-8 w-8 p-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-mono text-xs text-muted-foreground mt-1 sm:hidden break-all">{user.wallet.address}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 bg-gradient-to-br from-green-50 via-green-100 to-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Current Balance</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setBalanceVisible((v) => !v)} title="Toggle balance visibility">
                {balanceVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRefreshWalletData} title="Refresh" disabled={isRefreshingBalance}>
                <RefreshCcw className={`h-4 w-4 text-muted-foreground ${isRefreshingBalance ? "animate-spin" : ""}`} />
              </Button>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl sm:text-5xl font-bold text-[#118C4C] mb-1 flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600">USDC</span>
              {balanceVisible ? usdcBalance : "••••••"}
            </div>
            {usdNgnRate && (
              <p className="text-xl font-semibold text-muted-foreground mb-3">
                {balanceVisible
                  ? `≈ ₦${(parseFloat(usdcBalance) * usdNgnRate).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN`
                  : "≈ ₦•••••• NGN"}
              </p>
            )}
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 mt-2">
              Gas balance: {balanceVisible ? `${balance} ETH` : "•••••"} (Base Sepolia)
            </p>
            {usdNgnRate && (
              <p className="text-xs text-muted-foreground mt-1">
                1 USDC ≈ ₦{usdNgnRate.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Button onClick={() => setIsAddFundsModalOpen(true)} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2" title="Add funds to your wallet by scanning the QR code or copying the address.">
            <PlusCircle className="h-5 w-5" />
            Add Funds
          </Button>
          <Button onClick={() => setIsWithdrawFundsModalOpen(true)} variant="outline" className="gap-2" title="Withdraw funds from your wallet to another address.">
            <MinusCircle className="h-5 w-5" />
            Withdraw Funds
          </Button>
          <Button onClick={() => setIsComingSoonModalOpen(true)} variant="outline" className="gap-2" title="Bridge funds to another network.">
            <Wallet className="h-5 w-5" />
            Bridge Funds
          </Button>
        </div>

        <div className="flex justify-end mb-6">
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 p-1.5 shadow-sm">
            <span className="rounded-lg px-5 py-2.5 text-sm font-semibold bg-[#118C4C] text-white shadow-md">
              Base Sepolia (Testnet)
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4 bg-gradient-to-br from-green-100 via-blue-100 to-green-50">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
                <p className="text-sm text-muted-foreground">
                  Recent transactions on the Base Sepolia network.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    transactionFilter === "all"
                      ? "bg-[#118C4C] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setTransactionFilter("all")}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    transactionFilter === "send"
                      ? "bg-[#118C4C] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setTransactionFilter("send")}
                >
                  Send
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    transactionFilter === "receive"
                      ? "bg-[#118C4C] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setTransactionFilter("receive")}
                >
                  Receive
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                  onClick={handleRefreshTransactions}
                  title="Refresh transactions"
                  disabled={isRefreshingTransactions}
                >
                  <RefreshCcw className={`h-4 w-4 text-muted-foreground ${isRefreshingTransactions ? "animate-spin" : ""}`} />
                </button>
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
</CardHeader>
<CardContent className="p-4">
            {filteredTransactions.length === 0 ? (
              <div className="p-6 text-muted-foreground text-center flex flex-col items-center justify-center">
                <Wallet className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">No transactions found yet.</p>
                <p className="text-sm">Make your first transaction to see it here!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTransactions.map((txn) => (
                  <TransactionItem
                    key={txn.hash + txn.type}
                    txn={txn}
                    userAddress={user!.wallet!.address}
                    usdNgnRate={usdNgnRate}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
    </div>
  )
}

export default WalletPage