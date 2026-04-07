"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Share2, ShoppingCart, UserIcon, X } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/Skeleton"
import { useToast } from "@/lib/toast"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import type { Product, CartItem } from "@/lib/types"
import { useCart } from "@/lib/useCart"
import { useUser } from "@/lib/useUser"
import { ProductComments } from "@/components/ProductComments"
import { RatingSummary } from "@/components/RatingSummary"

function ProductDetailPage() {
  const router = useRouter()
  const params = useParams();
  const id = params.id as string;
  const { currentUser } = useUser()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isImageFullScreen, setIsImageFullScreen] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${id}`)
        setProduct(res.ok ? await res.json() : null)
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({ productId: product.id, productName: product.productName, pricePerUnit: product.pricePerUnit, quantity: 1, image: product.image })
  }

  const isOwnProduct = currentUser?.id === product?.farmerId

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
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${product.productName} on Foodra`}
        text={`Check out this product: ${product.productName}`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Full Screen Image Modal */}
      {isImageFullScreen && product.image && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsImageFullScreen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setIsImageFullScreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="relative w-full h-full max-w-7xl max-h-[90vh]">
            <Image
              src={product.image}
              alt={product.productName}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div 
            className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden bg-muted border-2 border-[#118C4C]/20 cursor-pointer hover:border-[#118C4C]/40 transition-colors"
            onClick={() => product.image && setIsImageFullScreen(true)}
          >
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
            {product.image && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="text-white text-sm bg-black/50 px-4 py-2 rounded-full">Click to view full size</span>
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
              <span className="text-muted-foreground">per {product.unit || 'unit'}</span>
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
                    <p className="text-lg font-semibold text-[#118C4C]">{product.quantity} {product.unit || 'unit'}{product.quantity !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isOwnProduct && (
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 mb-4 shadow-lg shadow-[#118C4C]/20"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            )}

            {isOwnProduct && (
              <div className="w-full p-4 mb-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                  This is your product. You cannot add it to cart.
                </p>
              </div>
            )}

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
                  <span className="font-medium text-[#118C4C]">{product.quantity} {product.unit || 'unit'}{product.quantity !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Price per {product.unit || 'unit'}:</span>
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
                    <div className="mt-1"><RatingSummary farmerId={product.farmerId} /></div>
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

        {/* Comments */}
        <Card className="mt-4 border-[#118C4C]/20">
          <CardContent className="p-6">
            <ProductComments productId={product.id} currentUserId={currentUser?.id} productOwnerId={product.farmerId} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default ProductDetailPage;
