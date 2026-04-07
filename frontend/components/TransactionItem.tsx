"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, ExternalLink, Download } from "lucide-react"
import { downloadReceiptImage } from "@/lib/receipt"

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

interface TransactionItemProps {
  txn: Transaction;
  userAddress: string;
  usdNgnRate: number | null;
}

export function TransactionItem({ txn, userAddress, usdNgnRate }: TransactionItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  const isSender = txn.from.toLowerCase() === userAddress.toLowerCase()
  const isUsdc = txn.type === "usdc"
  const decimals = Number(txn.tokenDecimals ?? 6)

  const displayValue = isUsdc
    ? (Number(txn.value) / Math.pow(10, decimals)).toFixed(4)
    : parseFloat((Number(txn.value) / 1e18).toFixed(8)).toString()

  const ngnValue = isUsdc && usdNgnRate
    ? (Number(txn.value) / Math.pow(10, decimals)) * usdNgnRate
    : null

  const label = isUsdc
    ? `${isSender ? "Sent" : "Received"} USDC`
    : `${isSender ? "Sent" : "Received"} ETH`

  const symbol = isUsdc ? (txn.tokenSymbol || "USDC") : "ETH"
  const date = new Date(parseInt(txn.timeStamp) * 1000)

  const handleDownloadReceipt = (e: React.MouseEvent) => {
    e.stopPropagation()
    const counterparty = isSender ? txn.to : txn.from
    const shortHash = `${txn.hash.slice(0, 10)}...${txn.hash.slice(-8)}`
    downloadReceiptImage({
      title: "TX RECEIPT",
      subtitle: label,
      lines: [
        { label: "Date", value: date.toLocaleString("en-NG") },
        { label: "Type", value: label },
        { label: isSender ? "To" : "From", value: `${counterparty.slice(0, 8)}...${counterparty.slice(-6)}` },
        { label: "Amount", value: `${displayValue} ${symbol}`, bold: true, green: true },
        ...(ngnValue !== null ? [{ label: "NGN equivalent", value: `₦${ngnValue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, small: true }] : []),
        { label: "Tx Hash", value: shortHash, small: true },
        { label: "Network", value: "Base Sepolia", small: true },
      ],
      filename: `foodra-tx-${txn.hash.slice(-8)}`,
    })
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className="flex items-center justify-between p-3 sm:p-4 gap-2 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {isSender
            ? <ArrowUpCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            : <ArrowDownCircle className="h-5 w-5 text-[#118C4C] flex-shrink-0" />
          }
          <div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground">{date.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className={`font-bold text-sm ${isSender ? "text-red-500" : "text-[#118C4C]"}`}>
              {isSender ? "-" : "+"}{displayValue} {symbol}
            </p>
            {ngnValue !== null && (
              <p className="text-xs text-muted-foreground">≈ ₦{ngnValue.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            )}
          </div>
          <button onClick={handleDownloadReceipt} title="Download receipt"
            className="p-1.5 rounded-lg hover:bg-[#118C4C]/10 transition-colors flex-shrink-0">
            <Download className="h-3.5 w-3.5 text-[#118C4C]" />
          </button>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-muted/20 px-4 pb-4 sm:px-8 space-y-2 text-sm"
          >
            <div className="pt-3 flex justify-between gap-4">
              <span className="text-muted-foreground">{isSender ? "To:" : "From:"}</span>
              <span className="font-mono text-xs break-all">{isSender ? txn.to : txn.from}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Tx Hash:</span>
              <a
                href={`https://sepolia.basescan.org/tx/${txn.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#118C4C] hover:underline font-mono text-xs truncate max-w-[180px]"
              >
                {txn.hash.slice(0, 12)}...{txn.hash.slice(-8)}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
