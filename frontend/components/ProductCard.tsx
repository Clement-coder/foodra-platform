"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share2, ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { ShareOptionsModal } from "@/components/ShareOptionsModal";
import { WishlistButton } from "@/components/WishlistButton";
import { formatTimeAgo } from "@/lib/timeUtils";
import { useToast } from "@/lib/toast";
import { usePrivy } from "@privy-io/react-auth";

interface ProductCardProps {
  product: Product;
  onRefresh?: () => void;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const { authenticated } = usePrivy();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(product.quantity);

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
    if (isOutOfStock) {
      toast.error("This product is out of stock.");
      return;
    }
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <>
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${product.productName} on Foodra`}
        text={`Check out this product: ${product.productName}`}
        url={typeof window !== "undefined" ? `${window.location.origin}/marketplace/${product.id}` : ""}
      />

      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="relative group rounded-2xl overflow-hidden border border-[#118C4C]/20 hover:border-[#118C4C]/50 hover:shadow-xl hover:shadow-[#118C4C]/10 transition-all bg-card flex flex-col cursor-pointer"
        onClick={() => router.push(`/marketplace/${product.id}`)}
      >
        {/* Image */}
        <div className="relative h-32 sm:h-44 w-full bg-muted flex-shrink-0 overflow-hidden">
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

          <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-1">
            <span className="bg-[#118C4C]/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
              {formatTimeAgo(product.createdAt)}
            </span>
            <span className="bg-card/95 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#118C4C]/30 backdrop-blur-sm">
              {product.category}
            </span>
          </div>

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
        </div>

        {/* Content */}
        <div className="flex-1 p-2 sm:p-3 flex flex-col gap-1.5">
          <div>
            <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 text-foreground">{product.productName}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
          </div>

          <p className="text-[10px] text-muted-foreground">Sold by Foodra</p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-lg font-bold text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">/{product.unit || "unit"}</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <WishlistButton
                productId={product.id}
                productName={product.productName}
                image={product.image}
                pricePerUnit={product.pricePerUnit}
                iconSize="h-5 w-5"
              />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">{availableQuantity} avail.</span>
        </div>

        {/* Actions */}
        <div className="px-2 sm:px-3 pb-2 sm:pb-3 flex gap-1">
          <Link href={`/marketplace/${product.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
            <button className="w-full border border-[#118C4C]/50 hover:bg-[#118C4C] hover:text-white duration-200 rounded-xl text-[#118C4C] text-center py-1.5 sm:py-2 bg-transparent font-medium text-[10px] sm:text-xs">
              View
            </button>
          </Link>
          <Button
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            disabled={isAdding || isOutOfStock}
            size="sm"
            className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-sm disabled:opacity-50 text-[10px] sm:text-xs px-1"
          >
            {isAdding ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
            <span className="ml-0.5 hidden sm:inline">{isOutOfStock ? "Sold Out" : isAdding ? "Added!" : "Add"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-[#118C4C]/30 hover:bg-[#118C4C]/10 px-1.5"
            onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }}
            aria-label="Share"
          >
            <Share2 className="h-3 w-3 text-[#118C4C]" />
          </Button>
        </div>
      </motion.div>
    </>
  );
}
