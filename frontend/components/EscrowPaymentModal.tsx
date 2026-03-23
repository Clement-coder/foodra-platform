"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { useEscrow } from "@/lib/useEscrow";
import { ngnToUsdc } from "@/lib/escrow";
import type { CartItem } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessClose: () => void;
  cart: (CartItem & { farmerWallet?: string })[];
  totalNgn: number;
  supabaseOrderId: string;
  onSuccess: (escrowResults: EscrowResult[]) => Promise<void>;
}

export interface EscrowResult {
  productId: string;
  orderId: string;
  txHash: string;
  usdcAmount: bigint;
  rate: number;
}

type Step = "preview" | "signing" | "success" | "error";

export function EscrowPaymentModal({ isOpen, onClose, onSuccessClose, cart, totalNgn, supabaseOrderId, onSuccess }: Props) {
  const { createEscrows, loading, error } = useEscrow();
  const [step, setStep] = useState<Step>("preview");
  const [usdcPreview, setUsdcPreview] = useState<string>("...");
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) { setStep("preview"); return; }
    setUsdcPreview("...");
    ngnToUsdc(totalNgn).then(({ usdcAmount, rate }) => {
      const usdc = Number(usdcAmount) / 1_000_000;
      setUsdcPreview(usdc > 0 ? usdc.toFixed(4) : "< 0.0001");
      setRate(rate);
    }).catch(() => setUsdcPreview("error"));
  }, [isOpen, totalNgn]);

  // Auto-navigate to orders 3s after success
  useEffect(() => {
    if (step === "success") {
      const t = setTimeout(() => onSuccessClose(), 3000);
      return () => clearTimeout(t);
    }
  }, [step, onSuccessClose]);

  const handlePay = async () => {
    setStep("signing");
    const results = await createEscrows(
      supabaseOrderId,
      cart.map((i) => ({ ...i, farmerWallet: i.farmerWallet ?? "" })),
      totalNgn
    );
    if (results) {
      await onSuccess(results as EscrowResult[]);
      setStep("success");
    } else {
      setStep("error");
    }
  };

  const title =
    step === "success" ? "🎉 Payment Secured!" :
    step === "error"   ? "Payment Failed" :
    "Confirm Escrow Payment";

  return (
    <Modal isOpen={isOpen} onClose={step === "signing" || step === "success" ? () => {} : onClose} title={title}>
      {step === "preview" && (
        <div className="space-y-5">
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-foreground">{item.productName} ×{item.quantity}</span>
                <span className="font-medium">₦{(item.pricePerUnit * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total (NGN)</span>
              <span className="font-semibold">₦{totalNgn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span>₦{rate.toLocaleString()} / USDC</span>
            </div>
            <div className="flex justify-between border-t border-[#118C4C]/20 pt-2">
              <span className="font-semibold text-foreground">You pay (USDC)</span>
              <span className="font-bold text-[#118C4C] text-lg">{usdcPreview} USDC</span>
            </div>
          </div>
          <div className="flex gap-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[#118C4C] flex-shrink-0 mt-0.5" />
            <p>Your USDC is held in a secure escrow contract. Funds are only released to the farmer after you confirm delivery.</p>
          </div>
          <Button onClick={handlePay} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2" size="lg" disabled={loading}>
            Pay {usdcPreview} USDC via Escrow <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="relative w-16 h-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full">
              <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]" />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 m-auto w-10 h-10 bg-[#118C4C] rounded-full opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-[#118C4C] animate-spin" />
            </div>
          </div>
          <p className="font-semibold text-foreground text-lg">Processing payment...</p>
          <p className="text-sm text-muted-foreground text-center">
            Approve the transaction in your wallet on <span className="font-medium text-foreground">Base Sepolia</span>.
          </p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-[#118C4C]/10 border-4 border-[#118C4C] flex items-center justify-center"
            >
              <motion.svg
                className="w-12 h-12 text-[#118C4C]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </motion.svg>
            </motion.div>
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-[#118C4C]"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.2, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your USDC is locked in escrow. Confirm delivery once you receive your items to release payment to the farmer.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="w-full space-y-2">
            <Button onClick={onSuccessClose} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
              View My Orders
            </Button>
            <p className="text-xs text-muted-foreground">Redirecting automatically in 3 seconds...</p>
          </motion.div>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <AlertCircle className="h-14 w-14 text-red-500" />
          <h3 className="text-xl font-bold text-foreground">Transaction Failed</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{error || "Something went wrong. Please try again."}</p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => setStep("preview")} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Try Again</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
