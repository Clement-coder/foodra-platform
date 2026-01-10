"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth"
import { useAccount, useSwitchChain } from "wagmi"
import { ethers } from "ethers"
import { QRCodeSVG } from "qrcode.react"
import { FormInput } from "@/components/FormInput"
import { DollarSign, History, PlusCircle, MinusCircle, ArrowUpCircle, ArrowDownCircle, Copy, RefreshCcw, Wallet, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { NotificationDiv } from "@/components/NotificationDiv"
import { TransactionItem } from "@/components/TransactionItem"
import { base, baseSepolia } from "viem/chains"
import type { Chain } from "viem"


interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

function WalletPage() {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const { chainId } = useAccount()
  const { sendTransaction } = useSendTransaction()
  const { switchChain } = useSwitchChain()
  const [balance, setBalance] = useState<string>("0")
  const [ethToUsdRate, setEthToUsdRate] = useState<number | null>(null)
  const [ethToUsdcRate, setEthToUsdcRate] = useState<number | null>(null)
  const [ethToNgnRate, setEthToNgnRate] = useState<number | null>(null)
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false)
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false)
  const [isConfirmWithdrawModalOpen, setIsConfirmWithdrawModalOpen] = useState(false)
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionFilter, setTransactionFilter] = useState<"all" | "send" | "receive">("all")
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)
  // const [selectedChain, setSelectedChain] = useState(baseSepolia)
  const [selectedChain, setSelectedChain] = useState<Chain>(baseSepolia)


  const handleChainSwitch = (chainId: number) => {
    switchChain({ chainId })
    setSelectedChain(chainId === base.id ? base : baseSepolia)
  }

  const fetchWalletData = async () => {
    if (user?.wallet?.address) {
      try {
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

        const provider = new ethers.JsonRpcProvider(selectedChain.id === base.id ? "https://mainnet.base.org" : "https://sepolia.base.org")
        const balance = await provider.getBalance(user.wallet.address)
        setBalance(ethers.formatEther(balance))

        const apiUrl =
          selectedChain.id === base.id
            ? `https://api.routescan.io/v2/network/mainnet/evm/8453/etherscan/api?module=account&action=txlist&address=${user.wallet.address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.NEXT_PUBLIC_BASESCAN_API_KEY}`
            : `https://api.routescan.io/v2/network/testnet/evm/84532/etherscan/api?module=account&action=txlist&address=${user.wallet.address}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.NEXT_PUBLIC_BASESCAN_API_KEY}`

        const response = await fetch(apiUrl)

        const data = await response.json()
        if (data.status === "1" && Array.isArray(data.result)) {
          setTransactions(data.result)
        } else if (data.message === "No transactions found") {
          setTransactions([])
        } else {
          console.error("Error fetching transactions:", data.message)
          if (data.message !== "No transactions found") {
            setNotification({ type: "error", message: "Error fetching transactions." })
          }
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error)
        setNotification({ type: "error", message: "Error fetching wallet data." })
      }
    }
  }

  const fetchEthRate = async () => {
    try {
      const rateResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,ngn")
      const rateData = await rateResponse.json()
      if (rateData.ethereum) {
        if (rateData.ethereum.usd) {
          setEthToUsdRate(rateData.ethereum.usd)
          setEthToUsdcRate(rateData.ethereum.usd) // Assuming 1 USDC = 1 USD
        }
        if (rateData.ethereum.ngn) {
          setEthToNgnRate(rateData.ethereum.ngn)
        }
      }
    } catch (error) {
      console.error("Error fetching ETH to USD rate:", error)
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
    setNotification({ type: "success", message: "Wallet data refreshed!" })
  }

  const handleRefreshTransactions = async () => {
    setIsRefreshingTransactions(true)
    await fetchWalletData()
    setIsRefreshingTransactions(false)
    setNotification({ type: "success", message: "Transaction history refreshed!" })
  }

  const copyToClipboard = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address)
      setNotification({ type: "success", message: "Address copied to clipboard!" })
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

      setNotification({ type: "success", message: "Transaction submitted successfully!" })
      setIsConfirmWithdrawModalOpen(false)
      setRecipientAddress("")
      setWithdrawAmount("")

      setTimeout(() => {
        fetchWalletData()
      }, 3000)
    } catch (error) {
      console.error("Error sending transaction:", error)
      setNotification({ type: "error", message: "Transaction failed. Please try again." })
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
      {notification && (
        <NotificationDiv
          type={notification.type}
          message={notification.message}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">My Wallet</h1>

        {user?.wallet?.address && (
          <Card className="mb-8 bg-gradient-to-br from-green-50 via-green-100 to-yellow-100">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
              <h2 className="text-sm font-medium text-muted-foreground">Wallet Address</h2>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-base sm:text-lg font-mono break-all">{user.wallet.address}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 bg-gradient-to-br from-green-50 via-green-100 to-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Current Balance</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshWalletData}
                title="Refresh balance and rate"
                disabled={isRefreshingBalance}
              >
                <RefreshCcw className={`h-4 w-4 text-muted-foreground ${isRefreshingBalance ? "animate-spin" : ""}`} />
              </Button>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#118C4C] mb-2">{balance} ETH</div>
            <div className="space-y-1 text-muted-foreground">
              {ethToUsdcRate && (
                <div className="text-lg sm:text-xl font-semibold">
                  ~${(parseFloat(balance) * ethToUsdcRate).toFixed(2)} USDC
                </div>
              )}
              {ethToNgnRate && (
                <div className="text-lg sm:text-xl font-semibold">
                  ~₦{(parseFloat(balance) * ethToNgnRate).toFixed(2)} NGN
                </div>
              )}
            </div>
            {ethToUsdRate && (
              <p className="mt-4 text-sm text-muted-foreground">
                Current rate: 1 ETH = ${ethToUsdRate.toFixed(2)} USD
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

  <div className="flex justify-end mb-4">
  <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
    <Button
      onClick={() => handleChainSwitch(base.id)}
      className={`rounded-full px-4 py-1 text-sm font-medium transition-all ${
        selectedChain.id === base.id
          ? "bg-[#118C4C] text-white shadow"
          : "bg-transparent  border border-green-700 hover:bg-[#118C4C]/10"
      }`}
    >
      Mainnet
    </Button>

    <Button
      onClick={() => handleChainSwitch(baseSepolia.id)}
      className={`rounded-full px-4 py-1 text-sm font-medium transition-all ${
        selectedChain.id === baseSepolia.id
          ? "bg-[#118C4C] text-white shadow"
          : "bg-transparent border border-green-700 hover:bg-[#118C4C]/10"
      }`}
    >
      Testnet
    </Button>
  </div>
</div>


        <Card>
          <CardHeader className="pb-4 bg-gradient-to-br from-green-100 via-blue-100 to-green-50">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
                <p className="text-sm text-muted-foreground">
                  Recent transactions on the {selectedChain.id === base.id ? "Base" : "Base Sepolia"} network.
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
                    key={txn.hash}
                    txn={txn}
                    userAddress={user!.wallet!.address}
                    ethToUsdcRate={ethToUsdcRate}
                    ethToNgnRate={ethToNgnRate}
                    selectedChain={selectedChain}
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
            {parseFloat(withdrawAmount) > 0 && ethToUsdcRate && ethToNgnRate && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>~${(parseFloat(withdrawAmount) * ethToUsdcRate).toFixed(2)} USDC</p>
                <p>~₦{(parseFloat(withdrawAmount) * ethToNgnRate).toFixed(2)} NGN</p>
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
              {ethToUsdcRate && ethToNgnRate && (
                <div className="mt-1 text-sm text-muted-foreground">
                  <p>~${(parseFloat(withdrawAmount) * ethToUsdcRate).toFixed(2)} USDC</p>
                  <p>~₦{(parseFloat(withdrawAmount) * ethToNgnRate).toFixed(2)} NGN</p>
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