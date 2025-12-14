"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DollarSign, History, PlusCircle, MinusCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { NotificationDiv } from "@/components/NotificationDiv"
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  date: string
  description: string
}

interface WalletData {
  balance: number
  transactions: Transaction[]
}

const initialWalletData: WalletData = {
  balance: 0,
  transactions: [],
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData>(initialWalletData)
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false)
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("")
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)

  useEffect(() => {
    const storedWallet = loadFromLocalStorage<WalletData>("foodra_wallet", initialWalletData)
    setWallet(storedWallet)
  }, [])

  const saveWallet = (updatedWallet: WalletData) => {
    setWallet(updatedWallet)
    saveToLocalStorage("foodra_wallet", updatedWallet)
  }

  const handleAddFunds = () => {
    const amount = parseFloat(amountInput)
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: "error", message: "Please enter a valid amount." })
      return
    }

    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: "credit",
      amount: amount,
      date: new Date().toISOString(),
      description: "Funds added to wallet",
    }

    const updatedWallet = {
      balance: wallet.balance + amount,
      transactions: [newTransaction, ...wallet.transactions],
    }
    saveWallet(updatedWallet)
    setIsAddFundsModalOpen(false)
    setAmountInput("")
    setNotification({ type: "success", message: `₦${amount.toLocaleString()} added successfully!` })
  }

  const handleWithdrawFunds = () => {
    const amount = parseFloat(amountInput)
    if (isNaN(amount) || amount <= 0) {
      setNotification({ type: "error", message: "Please enter a valid amount." })
      return
    }
    if (amount > wallet.balance) {
      setNotification({ type: "error", message: "Insufficient balance." })
      return
    }

    const newTransaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: "debit",
      amount: amount,
      date: new Date().toISOString(),
      description: "Funds withdrawn from wallet",
    }

    const updatedWallet = {
      balance: wallet.balance - amount,
      transactions: [newTransaction, ...wallet.transactions],
    }
    saveWallet(updatedWallet)
    setIsWithdrawFundsModalOpen(false)
    setAmountInput("")
    setNotification({ type: "success", message: `₦${amount.toLocaleString()} withdrawn successfully!` })
  }

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

        {/* Wallet Balance */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium text-muted-foreground">Current Balance</h2>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-[#118C4C]">₦{wallet.balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p> {/* Simulated */}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Button onClick={() => setIsAddFundsModalOpen(true)} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Funds
          </Button>
          <Button onClick={() => setIsWithdrawFundsModalOpen(true)} variant="outline" className="gap-2">
            <MinusCircle className="h-5 w-5" />
            Withdraw Funds
          </Button>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-xl font-semibold text-foreground">Transaction History</h2>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4">
            {wallet.transactions.length === 0 ? (
              <p className="p-6 text-muted-foreground text-center">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {wallet.transactions.map((txn) => (
                  <div key={txn.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      {txn.type === "credit" ? (
                        <ArrowUpCircle className="h-5 w-5 text-[#118C4C] flex-shrink-0" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{txn.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(txn.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-bold text-lg ${
                        txn.type === "credit" ? "text-[#118C4C]" : "text-red-600"
                      }`}
                    >
                      {txn.type === "credit" ? "+" : "-"}₦{txn.amount.toLocaleString()}
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
        <div className="space-y-4">
          <p className="text-muted-foreground">Enter the amount you wish to add to your wallet.</p>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
          />
          <Button onClick={handleAddFunds} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
            Confirm Add Funds
          </Button>
        </div>
      </Modal>

      {/* Withdraw Funds Modal */}
      <Modal
        isOpen={isWithdrawFundsModalOpen}
        onClose={() => setIsWithdrawFundsModalOpen(false)}
        title="Withdraw Funds from Wallet"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Enter the amount you wish to withdraw from your wallet.</p>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
          />
          <Button onClick={handleWithdrawFunds} className="w-full bg-red-600 hover:bg-red-700 text-white">
            Confirm Withdraw Funds
          </Button>
        </div>
      </Modal>
    </div>
  )
}
