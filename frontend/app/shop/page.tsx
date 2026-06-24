"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, ShieldCheck, Truck, Tag, PackageOpen, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { useToast } from "@/lib/toast";
import { DeliveryAddressModal } from "@/components/DeliveryAddressModal";
import { FundWalletModal } from "@/components/FundWalletModal";
import { WalletSuccessScreen } from "@/components/WalletSuccessScreen";
import withAuth from "../../components/withAuth";
import { useCart, useOrders } from "@/lib/useCart";
import { usePrivy } from "@privy-io/react-auth";
import { useUser } from "@/lib/useUser";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import type { DeliveryAddress } from "@/lib/types";
import { authFetch } from "@/lib/authFetch";

function ShopPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const { createOrder } = useOrders();
  const { authenticated, getAccessToken } = usePrivy();
  const { currentUser } = useUser();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [preparingCheckout, setPreparingCheckout] = useState(false);
  const [paying, setPaying] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryAddress | null>(null);
  const [payStep, setPayStep] = useState<"confirm" | "pin" | "success">("confirm");
  const [payPin, setPayPin] = useState("");

  const handleProceedToCheckout = async () => {
    if (currentUser && calculateProfileCompletion(currentUser) < 100) {
      toast.error("Please complete your profile before making a purchase.");
      setTimeout(() => router.push("/profile"), 2000);
      return;
    }
    setIsDeliveryModalOpen(true);
  };

  const handleDeliveryConfirmed = async (address: DeliveryAddress) => {
    setSelectedDelivery(address);
    setIsDeliveryModalOpen(false);
    setPreparingCheckout(true);
    try {
      const balRes = await authFetch(getAccessToken, "/api/wallet/balance");
      const balData = await balRes.json();
      setWalletBalance(parseFloat(balData.balance_ngn ?? "0"));
      setIsPayConfirmOpen(true);
    } finally {
      setPreparingCheckout(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedDelivery) return;
    if (!payPin || payPin.length !== 4) { toast.error("Enter your 4-digit wallet PIN"); return; }
    setPaying(true);
    try {
      // Create order then pay — both happen only when user confirms with PIN
      const order = await createOrder(cart, totalAmount, {
        fullName:    selectedDelivery.fullName,
        phone:       selectedDelivery.phone,
        addressLine: selectedDelivery.addressLine,
        streetLine2: selectedDelivery.streetLine2 || "",
        landmark:    selectedDelivery.landmark || "",
        city:        selectedDelivery.city,
        state:       selectedDelivery.state,
        country:     selectedDelivery.country,
      });
      if (!order) { toast.error("Failed to create order. Please try again."); return; }

      const res = await authFetch(getAccessToken, `/api/orders/${order.id}/pay-wallet`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: payPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Payment failed — delete the just-created order to avoid orphans
        await authFetch(getAccessToken, `/api/orders?orderId=${order.id}&userId=${currentUser?.id}`, { method: "DELETE" }).catch(() => {});
        if (data.balance !== undefined) {
          setIsPayConfirmOpen(false);
          setIsFundOpen(true);
        } else {
          toast.error(data.error || "Payment failed");
          setPayStep("pin");
        }
        return;
      }
      clearCart();
      setPayStep("success");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  const handleCancelOrder = () => {
    setIsPayConfirmOpen(false);
    setPayStep("confirm");
    setPayPin("");
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[#118C4C]/10 border-2 border-[#118C4C]/20 mb-6">
            <PackageOpen className="h-11 w-11 text-[#118C4C]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm mb-8">Browse the marketplace and add fresh produce from local farmers.</p>
          <Link href="/marketplace">
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 px-8 rounded-full">
              Browse Marketplace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {authenticated && (
            <p className="mt-4 text-xs text-muted-foreground">
              <Link href="/orders" className="text-[#118C4C] underline underline-offset-2">View your orders →</Link>
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Filled cart ──────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-[#118C4C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">My Cart</h1>
            <p className="text-xs text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""} · {cart.length} product{cart.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            const ok = await confirm({ title: "Clear Cart", message: "Remove all items from your cart?", confirmLabel: "Clear", danger: true });
            if (ok) clearCart();
          }}
          className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Cart items ── */}
        <div className="lg:col-span-3 space-y-3">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div key={item.productId} layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, scale: 0.95 }} transition={{ duration: 0.2 }}
              >
                <div className="bg-card rounded-2xl border border-[#118C4C]/15 p-4 flex gap-4 hover:border-[#118C4C]/40 hover:shadow-sm transition-all">
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#118C4C]/5 border-2 border-[#118C4C]/20 flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.productName} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-[#118C4C]/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight truncate mb-0.5">{item.productName}</h3>
                    <p className="text-xs text-muted-foreground mb-2">₦{item.pricePerUnit.toLocaleString()} per unit</p>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-xl overflow-hidden border-2 border-[#118C4C]/30 bg-[#118C4C]/5">
                        <button
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                          className="w-9 h-9 flex items-center justify-center bg-[#118C4C] hover:bg-[#0d6d3a] text-white transition-colors"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-[#118C4C]">{item.quantity}</span>
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/products/${item.productId}`);
                            const prod = res.ok ? await res.json() : null;
                            if (prod && item.quantity >= prod.quantity) {
                              toast.error(`Only ${prod.quantity} unit(s) available.`);
                              return;
                            }
                            updateQuantity(item.productId, item.quantity + 1);
                          }}
                          className="w-9 h-9 flex items-center justify-center bg-[#118C4C] hover:bg-[#0d6d3a] text-white transition-colors"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Subtotal + remove */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#118C4C] text-base">
                          ₦{(item.pricePerUnit * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={async () => {
                            const ok = await confirm({ message: `Remove "${item.productName}"?`, confirmLabel: "Remove", danger: true });
                            if (ok) removeFromCart(item.productId);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Continue shopping */}
          <Link href="/marketplace" className="flex items-center gap-2 text-sm text-[#118C4C] font-medium mt-2 hover:underline">
            <ArrowRight className="h-4 w-4 rotate-180" /> Continue shopping
          </Link>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-[#118C4C]/20 bg-card shadow-lg shadow-[#118C4C]/5 overflow-hidden">
            {/* Summary header */}
            <div className="bg-gradient-to-r from-[#118C4C] to-[#1aaf61] px-5 py-4">
              <h2 className="text-white font-bold text-base flex items-center gap-2">
                <Tag className="h-4 w-4" /> Order Summary
              </h2>
            </div>

            <div className="p-5 space-y-3">
              {/* Per-item lines */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-[60%]">
                      {item.productName} <span className="text-xs">×{item.quantity}</span>
                    </span>
                    <span className="font-medium text-foreground">₦{(item.pricePerUnit * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-[#118C4C]/20 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Delivery</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">Charged on arrival</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#118C4C]/8 border border-[#118C4C]/20 px-4 py-3 flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-black text-[#118C4C] text-2xl">₦{totalAmount.toLocaleString()}</span>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white font-bold rounded-xl h-12 text-base shadow-md shadow-[#118C4C]/25"
                disabled={preparingCheckout}
              >
                {preparingCheckout ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Preparing...</>
                ) : (
                  <>Proceed to Checkout <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>

              {/* Delivery notice */}
              <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-400">
                <Truck className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p><strong>Delivery fee not included.</strong> A separate fee is charged upon arrival and is your responsibility.</p>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Wallet Protected" },
                  { icon: <Truck className="h-3.5 w-3.5" />, label: "Direct from Foodra" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-2">
                    <span className="text-[#118C4C]">{b.icon}</span> {b.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Address Modal */}
      {currentUser && (
        <DeliveryAddressModal
          isOpen={isDeliveryModalOpen}
          onClose={() => setIsDeliveryModalOpen(false)}
          userId={currentUser.id}
          prefill={{ fullName: currentUser.name, phone: currentUser.phone, country: currentUser.location }}
          onConfirm={handleDeliveryConfirmed}
        />
      )}

      {/* Wallet Pay Confirmation Modal */}
      <Modal
        isOpen={isPayConfirmOpen}
        onClose={
          payStep === "success"
            ? () => { setIsPayConfirmOpen(false); setPayStep("confirm"); setPayPin(""); router.push("/orders"); }
            : payStep === "pin"
            ? () => { setPayStep("confirm"); setPayPin(""); }
            : handleCancelOrder
        }
        title={payStep === "pin" ? "Confirm with PIN" : "Confirm Payment"}
      >
        <div className="p-1">

          {payStep === "success" && (
            <WalletSuccessScreen
              title="Order Paid! 🛒"
              subtitle={`₦${totalAmount.toLocaleString()} deducted from your wallet. Your order is being processed.`}
              doneLabel="View Orders"
              onDone={() => { setIsPayConfirmOpen(false); setPayStep("confirm"); setPayPin(""); router.push("/orders"); }}
            />
          )}

          {payStep === "confirm" && (
            <div className="space-y-4">
              {/* Zero-fee notice */}
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-3 py-2.5">
                <Wallet className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                  No charges · Wallet payments on Foodra are 100% free of fees.
                </p>
              </div>
              <div className="rounded-xl bg-[#118C4C]/8 border border-[#118C4C]/20 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Amount to pay</p>
                <p className="text-3xl font-black text-[#118C4C]">₦{totalAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Wallet className="h-3.5 w-3.5" /> from your Foodra Wallet
                </p>
              </div>
              <div className="flex justify-between text-sm px-1">
                <span className="text-muted-foreground">Current balance</span>
                <span className="font-semibold">₦{walletBalance.toLocaleString()}</span>
              </div>
              {walletBalance >= totalAmount && (
                <div className="flex justify-between text-sm px-1">
                  <span className="text-muted-foreground">Balance after</span>
                  <span className="font-semibold text-[#118C4C]">₦{(walletBalance - totalAmount).toLocaleString()}</span>
                </div>
              )}
              {walletBalance < totalAmount && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 p-3 text-sm text-red-600 dark:text-red-400">
                  Insufficient balance. You need ₦{(totalAmount - walletBalance).toLocaleString()} more.
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancelOrder} className="flex-1">Cancel</Button>
                {walletBalance >= totalAmount ? (
                  <Button onClick={() => setPayStep("pin")} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
                    <span className="flex items-center gap-1.5">
                      Continue
                      <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">FREE</span>
                    </span>
                  </Button>
                ) : (
                  <Button onClick={() => { setIsPayConfirmOpen(false); setIsFundOpen(true); }} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
                    Fund Wallet
                  </Button>
                )}
              </div>
            </div>
          )}

          {payStep === "pin" && (
            <div className="space-y-5">
              <div className="rounded-xl bg-[#118C4C]/8 border border-[#118C4C]/20 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Paying for your order</p>
                <p className="text-3xl font-black text-[#118C4C]">₦{totalAmount.toLocaleString()}</p>
                <p className="text-xs text-green-600 font-semibold mt-1">✨ No fees applied</p>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#118C4C]" /> Wallet PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={payPin}
                  autoFocus
                  onChange={(e) => setPayPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] bg-background focus:outline-none focus:ring-2 focus:ring-[#118C4C]/30 focus:border-[#118C4C]"
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-center">Enter your 4-digit wallet PIN to confirm payment</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setPayStep("confirm"); setPayPin(""); }} className="flex-1">Back</Button>
                <Button onClick={handleConfirmPayment} disabled={paying || payPin.length !== 4} className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay Now →"}
                </Button>
              </div>
            </div>
          )}

        </div>
      </Modal>

      {/* Fund Wallet Modal (when balance insufficient) */}
      <FundWalletModal isOpen={isFundOpen} onClose={() => setIsFundOpen(false)} />
    </div>
  );
}

export default withAuth(ShopPage);
