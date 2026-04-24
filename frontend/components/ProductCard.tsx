"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Share2, ShoppingCart, EyeOff, Eye, Trash2, Check, PackagePlus, X, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { useUser } from "@/lib/useUser";
import { generateAvatarUrl } from "@/lib/avatarGenerator";
import { ShareOptionsModal } from "@/components/ShareOptionsModal";
import { WishlistButton } from "@/components/WishlistButton";
import { formatTimeAgo } from "@/lib/timeUtils";
import { useToast } from "@/lib/toast";
import { usePrivy } from "@privy-io/react-auth";
import { authFetch } from "@/lib/authFetch";

interface ProductCardProps {
  product: Product;
  onRefresh?: () => void;
}

export function ProductCard({ product, onRefresh }: ProductCardProps) {
  const { addToCart, cart } = useCart();
  const { currentUser } = useUser();
  const { authenticated, getAccessToken } = usePrivy();
  const { toast, confirm } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(product.quantity);
  const [isAvailable, setIsAvailable] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockQty, setRestockQty] = useState(product.quantity);
  const [restockPrice, setRestockPrice] = useState(product.pricePerUnit);

  const isOwnProduct = currentUser?.id === product.farmerId;
  const isLowStock = availableQuantity > 0 && availableQuantity <= 10;
  const isOutOfStock = availableQuantity <= 0;

  useEffect(() => {
    const cartItem = cart.find((item) => item.productId === product.id);
    const inCart = cartItem?.quantity || 0;
    setAvailableQuantity(product.quantity - inCart);
  }, [cart, product.id, product.quantity]);

  const handleAddToCart = () => {
    if (!authenticated) {
      toast.warning("Please sign in to add products to your cart.");
      return;
    }
    if (isOwnProduct) {
      toast.warning("You can't add your own product to cart.");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is out of stock.");
      return;
    }
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleToggle = async () => {
    const ok = await confirm({
      message: `${isAvailable ? "Deactivate" : "Activate"} this listing?`,
      confirmLabel: isAvailable ? "Deactivate" : "Activate",
      danger: isAvailable,
    });
    if (!ok) return;
    setActionLoading(true);
    const res = await authFetch(getAccessToken, `/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !isAvailable }),
    });
    setActionLoading(false);
    if (res.ok) {
      setIsAvailable((v) => !v);
      toast.success(isAvailable ? "Listing deactivated" : "Listing activated");
      onRefresh?.();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || "Failed to update listing.");
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Listing",
      message: "Permanently delete this product? This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setActionLoading(true);
    const res = await authFetch(getAccessToken, `/api/products/${product.id}`, { method: "DELETE" });
    setActionLoading(false);
    if (res.ok) {
      toast.success("Product deleted");
      onRefresh?.();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || "Failed to delete product.");
    }
  };

  const handleRestock = async () => {
    setActionLoading(true);
    const res = await authFetch(getAccessToken, `/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: restockQty, price: restockPrice, is_available: restockQty > 0 }),
    });
    setActionLoading(false);
    if (res.ok) {
      setAvailableQuantity(restockQty);
      setRestockOpen(false);
      toast.success("Product updated");
      onRefresh?.();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error || "Failed to update product.");
    }
  };

  return (
    <>
      {/* Restock modal */}
      {restockOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setRestockOpen(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Edit Listing</h3>
              <button onClick={() => setRestockOpen(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4 truncate font-medium">{product.productName}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Quantity ({product.unit || "unit"})
                </label>
                <input
                  type="number"
                  min="0"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Price per {product.unit || "unit"} (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockPrice}
                  onChange={(e) => setRestockPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]"
                />
              </div>
            </div>
            <Button
              onClick={handleRestock}
              disabled={actionLoading}
              className="w-full mt-4 bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
            >
              {actionLoading ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${product.productName} on Foodra`}
        text={`Check out this product: ${product.productName}`}
        url={typeof window !== "undefined" ? `${window.location.origin}/marketplace/${product.id}` : ""}
      />

      {/* Card — no wrapping Link; navigation handled by the View button */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="relative group rounded-2xl overflow-hidden border border-[#118C4C]/20 hover:border-[#118C4C]/50 hover:shadow-xl hover:shadow-[#118C4C]/10 transition-all bg-card flex flex-col"
      >
        {/* Image */}
        <div className="relative h-44 w-full bg-muted flex-shrink-0 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.productName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-1">
            <span className="bg-[#118C4C]/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
              {formatTimeAgo(product.createdAt)}
            </span>
            <span className="bg-card/95 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#118C4C]/30 backdrop-blur-sm">
              {product.category}
            </span>
          </div>

          {/* Stock badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-2 left-2">
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Only {availableQuantity} left
              </span>
            </div>
          )}

          {/* Wishlist button — always visible */}
          {!isOwnProduct && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
              <WishlistButton
                productId={product.id}
                productName={product.productName}
                image={product.image}
                pricePerUnit={product.pricePerUnit}
                className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white h-8 w-8 p-0"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col gap-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{product.productName}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
          </div>

          {/* Farmer */}
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.farmerAvatar || generateAvatarUrl(product.farmerId)}
              alt={product.farmerName}
              className="h-5 w-5 rounded-full object-cover border border-[#118C4C]/30 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs text-muted-foreground truncate">{product.farmerName}</span>
            <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
              <MapPin className="h-3 w-3 text-[#118C4C]" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{product.location}</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-lg font-bold text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/ {product.unit || "unit"}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{availableQuantity} avail.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3 flex gap-1.5">
          {isOwnProduct ? (
            <>
              <Button
                onClick={() => { setRestockQty(product.quantity); setRestockPrice(product.pricePerUnit); setRestockOpen(true); }}
                disabled={actionLoading}
                size="sm"
                variant="ghost"
                className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900"
              >
                <PackagePlus className="h-3.5 w-3.5 mr-1" />Edit
              </Button>
              <Button
                onClick={handleToggle}
                disabled={actionLoading}
                size="sm"
                variant="ghost"
                className={`flex-1 text-xs border ${isAvailable ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900" : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950/20 dark:border-green-900"}`}
              >
                {isAvailable ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</> : <><Eye className="h-3.5 w-3.5 mr-1" />Show</>}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={actionLoading}
                size="sm"
                variant="ghost"
                className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-950/20 dark:border-red-900"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
              </Button>
            </>
          ) : (
            <>
              <Link href={`/marketplace/${product.id}`} className="flex-1">
                <button className="w-full border border-[#118C4C]/50 hover:bg-[#118C4C] hover:text-white duration-200 rounded-xl text-[#118C4C] text-center py-2 bg-transparent font-medium text-xs">
                  View
                </button>
              </Link>
              <Button
                onClick={handleAddToCart}
                disabled={isAdding || isOutOfStock}
                size="sm"
                className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-sm disabled:opacity-50 text-xs"
              >
                {isAdding ? <Check className="h-3.5 w-3.5 mr-1" /> : <ShoppingCart className="h-3.5 w-3.5 mr-1" />}
                {isOutOfStock ? "Sold Out" : isAdding ? "Added!" : "Add"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-[#118C4C]/30 hover:bg-[#118C4C]/10 px-2"
                onClick={() => setIsShareModalOpen(true)}
                aria-label="Share"
              >
                <Share2 className="h-3.5 w-3.5 text-[#118C4C]" />
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
