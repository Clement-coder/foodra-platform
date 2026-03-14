"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { useEscrow } from "@/lib/useEscrow";
import { ngnToUsdc } from "@/lib/escrow";
import type { CartItem } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cart: (CartItem & { farmerWallet?: string })[];
  totalNgn: number;
  supabaseOrderId: string;
  onSuccess: (escrowResults: EscrowResult[]) => void;
}

export interface EscrowResult {
  productId: string;
  orderId: string;
  txHash: string;
  usdcAmount: bigint;
  rate: number;
}

type Step = "preview" | "signing" | "success" | "error";

export function EscrowPaymentModal({ isOpen, onClose, cart, totalNgn, supabaseOrderId, onSuccess }: Props) {
  const { createEscrows, loading, error } = useEscrow();
  const [step, setStep] = useState<Step>("preview");
  const [usdcPreview, setUsdcPreview] = useState<string>("...");
  const [rate, setRate] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) { setStep("preview"); return; }
    ngnToUsdc(totalNgn).then(({ usdcAmount, rate }) => {
      setUsdcPreview((Number(usdcAmount) / 1_000_000).toFixed(2));
      setRate(rate);
    });
  }, [isOpen, totalNgn]);

  const handlePay = async () => {
    setStep("signing");
    const results = await createEscrows(
      supabaseOrderId,
      cart.map((i) => ({ ...i, farmerWallet: i.farmerWallet || "" })),
      totalNgn
    );
    if (results) {
      setStep("success");
      onSuccess(results as EscrowResult[]);
    } else {
      setStep("error");
    }
  };

  const title =
    step === "success" ? "Payment Secured!" :
    step === "error"   ? "Payment Failed" :
    "Confirm Escrow Payment";

  return (
    <Modal isOpen={isOpen} onClose={step === "signing" ? () => {} : onClose} title={title}>
      {step === "preview" && (
        <div className="space-y-5">
          {/* Items */}
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-foreground">{item.productName} ×{item.quantity}</span>
                <span className="font-medium">₦{(item.pricePerUnit * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
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

          {/* Escrow explanation */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[#118C4C] flex-shrink-0 mt-0.5" />
            <p>Your USDC is held in a secure escrow contract. Funds are only released to the farmer after you confirm delivery. You can raise a dispute if there's an issue.</p>
          </div>

          <Button
            onClick={handlePay}
            className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2"
            size="lg"
            disabled={loading}
          >
            Pay {usdcPreview} USDC via Escrow
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <Loader2 className="h-14 w-14 text-[#118C4C] animate-spin" />
          <p className="font-semibold text-foreground text-lg">Waiting for wallet signature...</p>
          <p className="text-sm text-muted-foreground text-center">
            Please approve the transactions in your wallet. Do not close this window.
          </p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
          <CheckCircle className="h-16 w-16 text-[#118C4C]" />
          <h3 className="text-xl font-bold text-foreground">Order Placed & Secured!</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your USDC is locked in escrow. Once you receive your items, confirm delivery to release payment to the farmer.
          </p>
          <Button onClick={onClose} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white mt-2">
            View My Orders
          </Button>
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
