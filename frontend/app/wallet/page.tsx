"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { usePrivy } from "@privy-io/react-auth"
import { ethers } from "ethers"
import { useSendTransaction } from "wagmi"
import { QRCodeSVG } from "qrcode.react"
import { FormInput } from "@/components/FormInput"
import { DollarSign, History, PlusCircle, MinusCircle, ArrowUpCircle, ArrowDownCircle, Copy, RefreshCcw, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { NotificationDiv } from "@/components/NotificationDiv"
import withAuth from "../../components/withAuth"

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

function WalletPage() {
  const { user } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const [balance, setBalance] = useState<string>("0");
  const [ethToUsdRate, setEthToUsdRate] = useState<number | null>(null);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false)
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false)
  const [isConfirmWithdrawModalOpen, setIsConfirmWithdrawModalOpen] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "send" | "receive">("all");
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  const BASESCAN_API_KEY = "E6TZM8EDB2HT8PT9H37QQ6TT78VWV2MEQ6"; // Provided by the user

  const fetchWalletData = async () => {
    if (user?.wallet?.address) {
      try {
        // Fetch balance
        const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
        const balance = await provider.getBalance(user.wallet.address);
        setBalance(ethers.formatEther(balance));

        // Fetch transactions
        const response = await fetch(
          `https://api-sepolia.basescan.org/api?module=account&action=txlist&address=${user.wallet.address}&startblock=0&endblock=99999999&sort=desc&apikey=${BASESCAN_API_KEY}`
        );
        const data = await response.json();
        if (data.status === "1" && Array.isArray(data.result)) {
          setTransactions(data.result);
        } else if (data.message === "No transactions found") {
          // This is not an error, just no transactions yet
          setTransactions([]);
        } else {
          console.error("Error fetching transactions:", data.message);
          // Don't show error notification for "No transactions found"
          if (data.message !== "No transactions found") {
            setNotification({ type: "error", message: "Error fetching transactions." });
          }
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        setNotification({ type: "error", message: "Error fetching wallet data." });
      }
    }
  };

  const fetchEthRate = async () => {
    try {
      const rateResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
      const rateData = await rateResponse.json();
      if (rateData.ethereum && rateData.ethereum.usd) {
        setEthToUsdRate(rateData.ethereum.usd);
      }
    } catch (error) {
      console.error("Error fetching ETH to USD rate:", error);
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchEthRate();
  }, [user]);

  const handleRefreshWalletData = async () => {
    setIsRefreshingBalance(true);
    await fetchWalletData();
    await fetchEthRate();
    setIsRefreshingBalance(false);
    setNotification({ type: "success", message: "Wallet data refreshed!" });
  };

  const handleRefreshTransactions = async () => {
    setIsRefreshingTransactions(true);
    await fetchWalletData(); // fetchWalletData already includes transaction fetching
    setIsRefreshingTransactions(false);
    setNotification({ type: "success", message: "Transaction history refreshed!" });
  };

  const copyToClipboard = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address);
      setNotification({ type: "success", message: "Address copied to clipboard!" });
    }
  };

  const handleWithdraw = async () => {
    try {
      // Validation
      if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
        setNotification({ type: "error", message: "Please enter a valid recipient address." });
        return;
      }

      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        setNotification({ type: "error", message: "Please enter a valid amount." });
        return;
      }

      if (parseFloat(withdrawAmount) > parseFloat(balance)) {
        setNotification({ type: "error", message: "Insufficient balance." });
        return;
      }

      // Close withdraw modal and open confirmation modal
      setIsWithdrawFundsModalOpen(false);
      setIsConfirmWithdrawModalOpen(true);
    } catch (error) {
      console.error("Error validating withdrawal:", error);
      setNotification({ type: "error", message: "Error processing withdrawal." });
    }
  };

  const confirmWithdraw = async () => {
    try {
      const valueInWei = ethers.parseEther(withdrawAmount);

      await sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: valueInWei,
      });

      setNotification({ type: "success", message: "Transaction submitted successfully!" });
      setIsConfirmWithdrawModalOpen(false);
      setRecipientAddress("");
      setWithdrawAmount("");

      // Refresh wallet data after a short delay
      setTimeout(() => {
        fetchWalletData();
      }, 3000);
    } catch (error) {
      console.error("Error sending transaction:", error);
      setNotification({ type: "error", message: "Transaction failed. Please try again." });
      setIsConfirmWithdrawModalOpen(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    if (!user?.wallet?.address) return false;
    if (transactionFilter === "all") return true;
    if (transactionFilter === "send") {
      return txn.from.toLowerCase() === user.wallet.address.toLowerCase();
    }
    if (transactionFilter === "receive") {
      return txn.to.toLowerCase() === user.wallet.address.toLowerCase();
    }
    return true;
  });

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

        {/* Wallet Address */}
        {user?.wallet?.address && (
          <Card className="mb-8 bg-linear-to-br from-green-50 via-green-100 to-yellow-100">
            <CardHeader className="flex flex-col  sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
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

        {/* Wallet Balance */}
        <Card className="mb-8 bg-linear-to-br from-green-50 via-green-100 to-blue-200">
          <CardHeader className="flex flex-row items-center justify-between  space-y-0 pb-2">
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#118C4C]">{balance} ETH</div>
              {ethToUsdRate && (
                <div className="text-2xl sm:text-3xl font-semibold text-muted-foreground">
                  ~${(parseFloat(balance) * ethToUsdRate).toFixed(2)} USD
                </div>
              )}
            </div>
            {ethToUsdRate && (
              <p className="mt-2 text-sm text-muted-foreground">
                Rate: 1 ETH = ${ethToUsdRate.toFixed(2)} USD
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Button onClick={() => setIsAddFundsModalOpen(true)} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2" title="Add funds to your wallet by scanning the QR code or copying the address.">
            <PlusCircle className="h-5 w-5" />
            Add Funds
          </Button>
          <Button onClick={() => setIsWithdrawFundsModalOpen(true)} variant="outline" className="gap-2" title="Withdraw funds from your wallet to another address.">
            <MinusCircle className="h-5 w-5" />
            Withdraw Funds
          </Button>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-4 bg-linear-to-br from-green-100 via-blue-100">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
                <p className="text-sm text-muted-foreground">Recent transactions on the Base Sepolia network.</p>
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
                  <div key={txn.hash} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-2">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {txn.to.toLowerCase() === user?.wallet?.address.toLowerCase() ? (
                        <ArrowDownCircle className="h-5 w-5 text-[#118C4C] flex-shrink-0" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {txn.to.toLowerCase() === user?.wallet?.address.toLowerCase() ? "Receive" : "Send"} ETH
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {new Date(parseInt(txn.timeStamp) * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-bold text-base sm:text-lg whitespace-nowrap ${
                        txn.to.toLowerCase() === user?.wallet?.address.toLowerCase() ? "text-[#118C4C]" : "text-red-600"
                      }`}
                    >
                      {txn.to.toLowerCase() === user?.wallet?.address.toLowerCase() ? "+" : "-"}
                      {ethers.formatEther(txn.value)} ETH
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Funds Modal */}
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

      {/* Withdraw Funds Modal */}
      <Modal
        isOpen={isWithdrawFundsModalOpen}
        onClose={() => setIsWithdrawFundsModalOpen(false)}
        title="Withdraw Funds from Wallet"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Enter the recipient address and the amount you wish to withdraw.</p>
          <FormInput
            label="Recipient Address"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            required
          />
          <FormInput
            label="Amount (ETH)"
            placeholder="0.0"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
          />
          <Button onClick={handleWithdraw} className="w-full bg-red-600 hover:bg-red-700 text-white">
            Withdraw
          </Button>
        </div>
      </Modal>

      {/* Confirm Withdraw Modal */}
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
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsConfirmWithdrawModalOpen(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmWithdraw} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              Confirm Withdrawal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default withAuth(WalletPage);