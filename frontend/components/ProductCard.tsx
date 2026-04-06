"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Share2, ShoppingCart, EyeOff, Eye, Trash2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { useUser } from "@/lib/useUser";
import { generateAvatarUrl } from "@/lib/avatarGenerator";
import { ShareOptionsModal } from "@/components/ShareOptionsModal";
import { formatTimeAgo } from "@/lib/timeUtils";
import { useToast } from "@/lib/toast";
import { usePrivy } from "@privy-io/react-auth";

interface ProductCardProps {
  product: Product;
  onRefresh?: () => void;
}

export function ProductCard({ product, onRefresh }: ProductCardProps) {
  const { addToCart, cart } = useCart();
  const { currentUser } = useUser();
  const { user: privyUser } = usePrivy();
  const { toast, confirm } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(product.quantity);
  const [isAvailable, setIsAvailable] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isOwnProduct = currentUser?.id === product.farmerId;

  useEffect(() => {
    // Calculate available quantity based on cart
    const cartItem = cart.find(item => item.productId === product.id);
    const inCart = cartItem?.quantity || 0;
    setAvailableQuantity(product.quantity - inCart);
  }, [cart, product.id, product.quantity]);

  const handleAddToCart = () => {
    if (isOwnProduct) {
      toast.warning("You can't add your own product to cart.")
      return
    }
    if (availableQuantity <= 0) {
      toast.error("This product is out of stock.")
      return
    }
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleToggle = async () => {
    const ok = await confirm({ message: `${isAvailable ? "Deactivate" : "Activate"} this listing?`, confirmLabel: isAvailable ? "Deactivate" : "Activate", danger: isAvailable })
    if (!ok) return
    setActionLoading(true)
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorPrivyId: privyUser?.id, is_available: !isAvailable }),
    })
    setActionLoading(false)
    if (res.ok) { setIsAvailable(v => !v); toast.success(isAvailable ? "Listing deactivated" : "Listing activated"); onRefresh?.() }
    else toast.error("Failed to update listing.")
  }

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete Listing", message: "Permanently delete this product? This cannot be undone.", confirmLabel: "Delete", danger: true })
    if (!ok) return
    setActionLoading(true)
    const res = await fetch(`/api/products/${product.id}?actorPrivyId=${privyUser?.id}`, { method: "DELETE" })
    setActionLoading(false)
    if (res.ok) { toast.success("Product deleted"); onRefresh?.() }
    else toast.error("Failed to delete product.")
  }

  return (
    <>
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${product.productName} on Foodra`}
        text={`Check out this product: ${product.productName}`}
        url={typeof window !== "undefined" ? `${window.location.origin}/marketplace/${product.id}` : ""}
      />
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card className="overflow-hidden h-full flex flex-col border-[#118C4C]/20 hover:border-[#118C4C]/40 hover:shadow-lg hover:shadow-[#118C4C]/10 transition-all">
          <div className="relative h-28 sm:h-48 w-full bg-muted">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.productName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <span className="bg-white/95 dark:bg-black/95 text-xs font-semibold px-3 py-1.5 rounded-full border border-[#118C4C]/30 backdrop-blur-sm">
                {product.category}
              </span>
            </div>
            <div className="absolute top-2 left-2">
              <span className="bg-[#118C4C]/90 text-white text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-sm">
                {formatTimeAgo(product.createdAt)}
              </span>
            </div>
          </div>

          <CardContent className="flex-1 p-2 sm:p-4">
            <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2 line-clamp-1">
              {product.productName}
            </h3>
            <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2 hidden sm:block">
              {product.description}
            </p>

            {/* Farmer Info */}
            <div className="flex items-center gap-1.5 mb-2 sm:mb-4 p-1.5 sm:p-2 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.farmerAvatar || generateAvatarUrl(product.farmerId)}
                alt={product.farmerName}
                className="h-5 w-5 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-[#118C4C]/30"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                {product.farmerName}
              </span>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 text-[#118C4C] flex-shrink-0" />
                <span className="truncate">{product.location}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-2xl font-bold text-[#118C4C]">
                  ₦{product.pricePerUnit.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">per unit</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {availableQuantity} units
              </p>
            </div>
          </CardContent>

          <CardFooter className="p-2 sm:p-4 pt-0 flex gap-1.5 sm:gap-2">
            <Link href={`/marketplace/${product.id}`} className="flex-1">
              <button className="w-full border-2 border-[#118C4C] hover:bg-[#118C4C] hover:text-white duration-300 ease-in-out rounded-xl text-[#118C4C] text-center py-2 px-2 bg-transparent font-medium text-xs sm:text-sm whitespace-nowrap">
                View
              </button>
            </Link>
            {isOwnProduct ? (
              <>
                <Button onClick={handleToggle} disabled={actionLoading} size="sm"
                  className={`flex-1 text-xs ${isAvailable ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"}`}
                  variant="ghost">
                  {isAvailable ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</> : <><Eye className="h-3.5 w-3.5 mr-1" />Show</>}
                </Button>
                <Button onClick={handleDelete} disabled={actionLoading} size="sm" variant="ghost"
                  className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-100">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding || availableQuantity <= 0}
                  size="icon"
                  className="shrink-0 sm:flex-1 sm:w-auto sm:px-3 bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-md shadow-[#118C4C]/20 disabled:opacity-50"
                >
                  {isAdding ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  <span className="hidden sm:inline text-sm ml-1">{availableQuantity <= 0 ? "Out of Stock" : isAdding ? "Added!" : "Add"}</span>
                </Button>
                <Button type="button" variant="outline" size="icon"
                  className="shrink-0 sm:flex-1 sm:w-auto sm:px-3 border-[#118C4C]/30 hover:bg-[#118C4C]/10"
                  onClick={() => setIsShareModalOpen(true)}>
                  <Share2 className="h-4 w-4 text-[#118C4C]" />
                  <span className="hidden sm:inline text-sm ml-1 text-[#118C4C]">Share</span>
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
}
