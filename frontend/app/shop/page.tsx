"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, ShieldCheck, Truck, Tag, PackageOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { EscrowPaymentModal, type EscrowResult } from "@/components/EscrowPaymentModal";
import { DeliveryAddressModal } from "@/components/DeliveryAddressModal";
import withAuth from "../../components/withAuth";
import { useCart, useOrders } from "@/lib/useCart";
import { usePrivy } from "@privy-io/react-auth";
import { useUser } from "@/lib/useUser";
import { calculateProfileCompletion } from "@/lib/profileUtils";
import type { CartItem, DeliveryAddress } from "@/lib/types";
import { authFetch } from "@/lib/authFetch";

function ShopPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const { createOrder } = useOrders();
  const { authenticated, getAccessToken } = usePrivy();
  const { currentUser } = useUser();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [preparingCheckout, setPreparingCheckout] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [enrichedCartItems, setEnrichedCartItems] = useState<(CartItem & { farmerWallet: string })[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryAddress | null>(null);

  const handleEscrowError = async (orderId: string) => {
    await authFetch(getAccessToken, "/api/orders/payment-failed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
    setPendingOrderId(null);
  };

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

    const enrichedCart = await Promise.all(
      cart.map(async (item) => {
        try {
          const res = await fetch(`/api/products/${item.productId}`);
          const product = await res.json();
          const userRes = await fetch(`/api/users/${product.farmerId}`);
          const farmer = await userRes.json();
          return { ...item, farmerWallet: farmer.wallet || "" };
        } catch {
          return { ...item, farmerWallet: "" };
        }
      })
    );

    const missingWallet = enrichedCart.find((i) => !i.farmerWallet);
    if (missingWallet) {
      setPreparingCheckout(false);
      toast.error(`Farmer wallet not found for "${missingWallet.productName}".`);
      return;
    }

    const order = await createOrder(enrichedCart, totalAmount);
    setPreparingCheckout(false);
    if (!order) {
      toast.error("Failed to create order. Please try again.");
      return;
    }
    setEnrichedCartItems(enrichedCart);
    setPendingOrderId(order.id);
    setIsCheckoutModalOpen(true);
  };

  const handleEscrowSuccess = async (results: EscrowResult[]) => {
    if (!pendingOrderId) return;
    await authFetch(getAccessToken, `/api/orders/${pendingOrderId}/escrow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        escrowTxHash: results[0]?.txHash,
        escrowStatus: "locked",
        usdcAmount: Number(results[0]?.usdcAmount) / 1_000_000,
        items: results.map((r) => ({ productId: r.productId, escrowOrderId: r.orderId, farmerWallet: r.farmerWallet })),
        deliveryFullName: selectedDelivery?.fullName,
        deliveryPhone: selectedDelivery?.phone,
        deliveryAddress: selectedDelivery?.addressLine,
        deliveryStreet2: selectedDelivery?.streetLine2,
        deliveryLandmark: selectedDelivery?.landmark,
        deliveryCity: selectedDelivery?.city,
        deliveryState: selectedDelivery?.state,
        deliveryCountry: selectedDelivery?.country,
      }),
    });
    clearCart();
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
                  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Escrow Protected" },
                  { icon: <Truck className="h-3.5 w-3.5" />, label: "Direct from Farmers" },
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

      {/* Escrow Payment Modal */}
      {pendingOrderId && (
        <EscrowPaymentModal
          isOpen={isCheckoutModalOpen}
          onClose={async () => {
            if (pendingOrderId) {
              await authFetch(getAccessToken, `/api/orders?orderId=${pendingOrderId}&userId=${currentUser?.id}`, { method: "DELETE" }).catch(() => {});
            }
            setIsCheckoutModalOpen(false);
            setPendingOrderId(null);
          }}
          onSuccessClose={() => {
            setIsCheckoutModalOpen(false);
            setPendingOrderId(null);
            router.push("/orders");
          }}
          cart={enrichedCartItems}
          totalNgn={totalAmount}
          supabaseOrderId={pendingOrderId}
          onSuccess={handleEscrowSuccess}
          onError={handleEscrowError}
        />
      )}
    </div>
  );
}

export default withAuth(ShopPage);
