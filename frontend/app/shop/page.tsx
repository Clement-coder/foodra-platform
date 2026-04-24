"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const deletePendingOrder = async (orderId: string) => {
    if (!currentUser) return;
    await authFetch(getAccessToken, `/api/orders?orderId=${orderId}&userId=${currentUser.id}`, { method: "DELETE" });
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
        items: results.map((r) => ({ productId: r.productId, escrowOrderId: r.orderId })),
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
    // Don't close modal here — let the success screen's button handle navigation
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-muted rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Browse the marketplace and add products to your cart
          </p>
          <Link href="/marketplace">
            <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
              Browse Marketplace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Shopping Cart
        </h1>
        {authenticated && (
          <Link href="/orders">
            <Button variant="outline" className="gap-2">
              View My Orders
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-[#118C4C]/20 hover:border-[#118C4C]/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 border-2 border-[#118C4C]/20">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                        {item.productName}
                      </h3>
                      <p className="text-[#118C4C] font-bold text-xl mb-3">
                        ₦{(item.pricePerUnit * item.quantity).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-[#118C4C]/10 rounded-xl p-1 border border-[#118C4C]/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                            className="h-9 w-9 p-0 hover:bg-[#118C4C]/20 flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4 text-[#118C4C]" />
                          </Button>
                          <span className="w-10 text-center font-medium text-[#118C4C]">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              // Cap at available stock
                              const res = await fetch(`/api/products/${item.productId}`);
                              const prod = res.ok ? await res.json() : null;
                              const max = prod?.quantity ?? item.quantity;
                              if (item.quantity >= max) {
                                return;
                              }
                              updateQuantity(item.productId, item.quantity + 1);
                            }}
                            className="h-9 w-9 p-0 hover:bg-[#118C4C]/20 flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4 text-[#118C4C]" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const ok = await confirm({ message: `Remove "${item.productName}" from cart?`, confirmLabel: "Remove", danger: true });
                            if (ok) removeFromCart(item.productId);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-[#118C4C]/30 shadow-lg shadow-[#118C4C]/10">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-[#118C4C] rounded"></div>
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Items ({cart.length})</span>
                  <span className="font-medium">₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-[#118C4C] font-semibold">
                    Free
                  </span>
                </div>
                <div className="border-t-2 border-[#118C4C]/20 pt-3 flex justify-between p-3 rounded-lg bg-[#118C4C]/10">
                  <span className="font-semibold text-foreground text-lg">
                    Total
                  </span>
                  <span className="font-bold text-[#118C4C] text-2xl">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white mb-3 shadow-lg shadow-[#118C4C]/20"
                size="lg"
                disabled={preparingCheckout}
              >
                {preparingCheckout ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Preparing checkout...</>
                ) : "Proceed to Checkout"}
              </Button>

              <Link href="/marketplace">
                <Button variant="outline" className="w-full bg-transparent">
                  Continue Shopping
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure checkout • Free delivery on all orders
              </p>
            </CardContent>
          </Card>
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
            if (pendingOrderId) await deletePendingOrder(pendingOrderId);
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
        />
      )}
    </div>
  );
}

export default withAuth(ShopPage);
