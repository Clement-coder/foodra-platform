"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Share2, ShoppingCart, UserIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/Skeleton"
import { NotificationDiv } from "@/components/NotificationDiv"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import type { Product, CartItem } from "@/lib/types"
import withAuth from "../../../components/withAuth";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"

function ProductDetailPage() {
  const router = useRouter()
  const params = useParams();
  const id = params.id as string; // Cast id to string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) {
          setProduct(null)
        } else {
          const data = await res.json()
          setProduct(data)
        }
      } catch (error) {
        console.error("Failed to fetch product:", error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return

    const cart = loadFromLocalStorage<CartItem[]>("foodra_cart", [])
    const existingItem = cart.find((item) => item.productId === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        productId: product.id,
        productName: product.productName,
        pricePerUnit: product.pricePerUnit,
        quantity: 1,
        image: product.image,
      })
    }

    saveToLocalStorage("foodra_cart", cart)
    window.dispatchEvent(new Event("cartUpdated"))
    setShowNotification(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 mb-8" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
        <Link href="/marketplace">
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Back to Marketplace</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Notification */}
      {showNotification && (
        <NotificationDiv
          type="success"
          message="Product added to cart successfully!"
          duration={5000}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Product Details */}
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${product.productName} on Foodra`}
        text={`Check out this product: ${product.productName}`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-muted border-2 border-[#118C4C]/20">
            {product.image ? (
              <Image 
                src={product.image} 
                alt={product.productName} 
                fill 
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="mb-4">
              <span className="inline-block bg-[#118C4C]/10 text-[#118C4C] text-sm font-semibold px-4 py-2 rounded-full border border-[#118C4C]/20">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.productName}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
              <span className="text-muted-foreground">per unit</span>
            </div>

            <Card className="mb-6 border-[#118C4C]/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                      <MapPin className="h-4 w-4 text-[#118C4C]" />
                    </div>
                    <span className="text-foreground">{product.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                      <UserIcon className="h-4 w-4 text-[#118C4C]" />
                    </div>
                    <span className="text-foreground">Sold by {product.farmerName}</span>
                  </div>
                  <div className="pt-2 border-t border-[#118C4C]/20">
                    <p className="text-sm text-muted-foreground">Available Stock</p>
                    <p className="text-lg font-semibold text-[#118C4C]">{product.quantity} units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 mb-4 shadow-lg shadow-[#118C4C]/20"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/shop" className="block">
                <Button variant="outline" size="lg" className="w-full border-[#118C4C]/30 hover:bg-[#118C4C]/5">
                  View Cart
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 border-[#118C4C]/30 hover:bg-[#118C4C]/5"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                Share Product
              </Button>
            </div>
          </div>
        </div>

        {/* Description */}
        <Card className="mb-4 border-[#118C4C]/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="h-1 w-8 bg-[#118C4C] rounded"></div>
              Product Description
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-[#118C4C]/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-1 w-6 bg-[#118C4C] rounded"></div>
                Product Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium text-[#118C4C]">{product.category}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Available Stock:</span>
                  <span className="font-medium text-[#118C4C]">{product.quantity} units</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Price per Unit:</span>
                  <span className="font-medium text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{product.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#118C4C]/20">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <div className="h-1 w-6 bg-[#118C4C] rounded"></div>
                Seller Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.farmerAvatar || `https://api.dicebear.com/8.x/bottts/svg?seed=${product.farmerId}`}
                    alt={product.farmerName}
                    className="h-12 w-12 rounded-full object-cover border-2 border-[#118C4C]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-medium text-foreground">{product.farmerName}</p>
                    <p className="text-[#118C4C] text-xs font-medium">✓ Verified Farmer</p>
                  </div>
                </div>
                <Link href={`/users/${product.farmerId}`}>
                  <Button variant="outline" size="sm" className="w-full border-[#118C4C]/30 hover:bg-[#118C4C] hover:text-white transition-colors">
                    View Seller Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}

export default withAuth(ProductDetailPage);
