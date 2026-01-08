"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/useCart";
import { generateAvatarUrl } from "@/lib/avatarGenerator";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative h-48 w-full bg-muted">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.productName}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className="bg-white/90 dark:bg-black/90 text-xs font-semibold px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>
        </div>

        <CardContent className="flex-1 p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
            {product.productName}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Farmer Info */}
          <div className="flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={generateAvatarUrl(product.farmerId)}
              alt={product.farmerName}
              className="h-8 w-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-foreground">
              {product.farmerName}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{product.location}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#118C4C]">
                ₦{product.pricePerUnit.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">per unit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {product.quantity} units available
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2">
          <Link href={`/marketplace/${product.id}`} className="flex-1">
            <button className="w-full border border-green-700 flex items-center gap-1 justify-center hover:bg-green-100 duration-300 ease-in-out rounded-xl text-green-600 text-center py-2 px-4  bg-transparent">
              <span>View</span> <span>Details</span>
            </button>
          </Link>
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdding ? "Added!" : "Add"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
