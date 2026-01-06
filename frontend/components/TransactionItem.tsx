"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ethers } from "ethers"
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, ExternalLink } from "lucide-react"

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

import { base, baseSepolia } from "viem/chains";

// ...

interface TransactionItemProps {
  txn: Transaction;
  userAddress: string;
  ethToUsdcRate: number | null;
  ethToNgnRate: number | null;
  selectedChain: any;
}

export function TransactionItem({ txn, userAddress, ethToUsdcRate, ethToNgnRate, selectedChain }: TransactionItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isSender = txn.from.toLowerCase() === userAddress.toLowerCase()
  const isReceiver = txn.to.toLowerCase() === userAddress.toLowerCase()

  const ethValue = parseFloat(ethers.formatEther(txn.value))

  const toggleOpen = () => setIsOpen(!isOpen)

  const basescanUrl = selectedChain.id === base.id ? "https://basescan.org" : "https://sepolia.basescan.org";

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isReceiver ? (
            <ArrowDownCircle className="h-5 w-5 text-[#118C4C] flex-shrink-0" />
          ) : (
            <ArrowUpCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">
              {isReceiver ? "Receive" : "Send"} ETH
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {new Date(parseInt(txn.timeStamp) * 1000).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p
            className={`font-bold text-base sm:text-lg whitespace-nowrap ${
              isReceiver ? "text-[#118C4C]" : "text-red-600"
            }`}
          >
            {isReceiver ? "+" : "-"}
            {ethValue.toFixed(6)} ETH
          </p>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-gray-50 px-4 pb-4 sm:px-8"
          >
            <div className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <p className="font-medium text-muted-foreground">
                  {isReceiver ? "From:" : "To:"}
                </p>
                <p className="font-mono break-all">
                  {isReceiver ? txn.from : txn.to}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium text-muted-foreground">Transaction Hash:</p>
                <a
                  href={`${basescanUrl}/tx/${txn.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <p className="font-mono break-all truncate max-w-[150px] sm:max-w-xs">
                    {txn.hash}
                  </p>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {ethToUsdcRate && (
                <div className="flex justify-between">
                  <p className="font-medium text-muted-foreground">Value (USDC):</p>
                  <p className="font-mono">~${(ethValue * ethToUsdcRate).toFixed(2)}</p>
                </div>
              )}
              {ethToNgnRate && (
                <div className="flex justify-between">
                  <p className="font-medium text-muted-foreground">Value (NGN):</p>
                  <p className="font-mono">~₦{(ethValue * ethToNgnRate).toFixed(2)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
