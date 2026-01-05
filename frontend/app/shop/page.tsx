"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/Modal";
import withAuth from "../../components/withAuth";
import { useCart } from "@/lib/useCart";
import { usePrivy } from "@privy-io/react-auth";

function ShopPage() {
  const {
    cartItems,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    checkout,
  } = useCart();
  const { authenticated } = usePrivy();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleProceedToCheckout = () => {
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      checkout();
      setTimeout(() => {
        setPaymentSuccess(false);
        setIsCheckoutModalOpen(false);
      }, 3000); // Close success message after 3 seconds
    }, 2000); // Simulate 2 seconds payment processing
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.pricePerUnit * item.quantity,
      0
    );
  };

  if (cartItems.length === 0) {
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
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted  flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.productName}
                        fill
                        className="object-cover relative top-4"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                        {item.productName}
                      </h3>
                      <p className="text-[#118C4C] font-bold text-xl mb-3">
                        ₦{(item.pricePerUnit * item.quantity).toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                          <Button
                            variant="ghost"
                            onClick={() => decrementQuantity(item.id)}
                            className="h-8 w-8"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4 text-foreground" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            onClick={() => incrementQuantity(item.id)}
                            className="h-8 w-8"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4 text-foreground" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
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
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items ({cartItems.length})</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-green-600 dark:text-green-400">
                    Free
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground text-lg">
                    Total
                  </span>
                  <span className="font-bold text-[#118C4C] text-2xl">
                    ₦{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white mb-3"
                size="lg"
              >
                Proceed to Checkout
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

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title={
          paymentSuccess ? "Payment Successful!" : "Confirm Your Order"
        }
      >
        {isProcessingPayment ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#118C4C] mb-4"></div>
            <p className="text-lg font-medium text-foreground">
              Processing Payment...
            </p>
            <p className="text-muted-foreground text-sm">
              Please do not close this window.
            </p>
          </div>
        ) : paymentSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="h-16 w-16 text-[#118C4C] mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Order Placed!
            </h3>
            <p className="text-muted-foreground mb-4">
              Your order has been successfully placed and will be processed
              shortly.
            </p>
            <Button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b border-border pb-2 last:border-b-0"
                >
                  <span className="text-foreground">
                    {item.productName} (x{item.quantity})
                  </span>
                  <span className="font-medium text-foreground">
                    ₦{(item.pricePerUnit * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="font-semibold text-foreground text-lg">
                  Total
                </span>
                <span className="font-bold text-[#118C4C] text-2xl">
                  ₦{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              By confirming, you agree to purchase these items. Payment will be
              processed securely.
            </p>
            <Button
              onClick={handleConfirmPayment}
              className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
              size="lg"
            >
              Confirm Payment
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}

export default withAuth(ShopPage);