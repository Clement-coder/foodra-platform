"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Share2, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { useUser } from "@/lib/useUser";
import { generateAvatarUrl } from "@/lib/avatarGenerator";
import { ShareOptionsModal } from "@/components/ShareOptionsModal";
import { formatTimeAgo } from "@/lib/timeUtils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, cart } = useCart();
  const { currentUser } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(product.quantity);

  const isOwnProduct = currentUser?.id === product.farmerId;

  useEffect(() => {
    // Calculate available quantity based on cart
    const cartItem = cart.find(item => item.productId === product.id);
    const inCart = cartItem?.quantity || 0;
    setAvailableQuantity(product.quantity - inCart);
  }, [cart, product.id, product.quantity]);

  const handleAddToCart = () => {
    if (availableQuantity <= 0 || isOwnProduct) return;
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
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || availableQuantity <= 0 || isOwnProduct}
              size="icon"
              className="shrink-0 bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-md shadow-[#118C4C]/20 disabled:opacity-50 h-9 w-9"
            >
              {isAdding ? <span className="text-xs">✓</span> : <ShoppingCart className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 border-[#118C4C]/30 hover:bg-[#118C4C]/10 h-9 w-9"
              onClick={() => setIsShareModalOpen(true)}
              aria-label={`Share ${product.productName}`}
            >
              <Share2 className="h-4 w-4 text-[#118C4C]" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
}
