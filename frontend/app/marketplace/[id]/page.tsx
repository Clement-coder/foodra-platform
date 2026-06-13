"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Share2, ShoppingCart, X, Eye } from "lucide-react"
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
import { WishlistButton } from "@/components/WishlistButton"
import { productJsonLd } from "@/lib/seo"
import { FoodraAvatar } from "@/components/FoodraAvatar"
import { GridLayout } from "@/components/GridLayout"
import { ProductCard } from "@/components/ProductCard"

function ProductDetailPage() {
  const router = useRouter()
  const params = useParams();
  const id = params.id as string;
  const { currentUser } = useUser()
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [productStats, setProductStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isImageFullScreen, setIsImageFullScreen] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) {
          setError(`Failed to load product: ${res.status}`)
          return
        }
        const p = await res.json()
        setProduct(p)
        if (p) {
          // Track product view
          if (currentUser?.id) {
            fetch(`/api/products/${id}/views?userId=${currentUser.id}`, { method: "POST" }).catch(() => {})
          } else {
            fetch(`/api/products/${id}/views`, { method: "POST" }).catch(() => {})
          }
          // Fetch related products and stats
          Promise.all([
            fetch(`/api/products/${id}/related`).then(r => r.json()).catch(() => []),
            fetch(`/api/products/${id}/stats`).then(r => r.ok ? r.json() : null).catch(() => null)
          ]).then(([relatedData, statsData]) => {
            setRelated(relatedData)
            setProductStats(statsData)
          })
        }
      } catch (err) {
        setError(`Error loading product: ${err}`)
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

  const isAdmin = currentUser?.role === "admin"

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Skeleton className="h-[500px] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
          <span className="text-3xl">📦</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">{error || "The product you're looking for doesn't exist or has been removed."}</p>
        <Link href="/marketplace">
          <Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Back to Marketplace</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD structured data */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
        />
      )}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={product ? `${product.productName} on Foodra` : "Product on Foodra"}
        text={product ? `Check out this product: ${product.productName}` : "Check out this product"}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Full Screen Image Modal */}
      {isImageFullScreen && product?.image && (
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

            {product.viewCount != null && product.viewCount > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{product.viewCount.toLocaleString()} view{product.viewCount !== 1 ? "s" : ""}</span>
                </div>
                {productStats?.totalSold > 0 && (
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{productStats.totalSold} sold</span>
                  </div>
                )}
                {productStats?.uniqueBuyers > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span>👥</span>
                    <span>{productStats.uniqueBuyers} member{productStats.uniqueBuyers !== 1 ? "s" : ""} bought this</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-bold text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
              <span className="text-muted-foreground">per {product.unit || 'unit'}</span>
              <WishlistButton
                productId={product.id}
                productName={product.productName}
                image={product.image}
                pricePerUnit={product.pricePerUnit}
                className="ml-auto h-10 w-10 rounded-xl border border-input"
                iconSize="h-6 w-6"
              />
            </div>

            <Card className="mb-6 border-[#118C4C]/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#118C4C]/10 rounded-lg">
                      <MapPin className="h-4 w-4 text-[#118C4C]" />
                    </div>
                    <div className="flex-1">
                      <span className="text-foreground font-medium">{product.location}</span>
                      <p className="text-xs text-muted-foreground">Seller location</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#118C4C]/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Available Stock</p>
                        <p className="text-lg font-semibold text-[#118C4C]">{product.quantity} {product.unit || 'unit'}{product.quantity !== 1 ? 's' : ''}</p>
                      </div>
                      {product.quantity > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            In Stock
                          </p>
                        </div>
                      )}
                    </div>
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
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                  <div className="relative">
                    {product.farmerAvatar ? (
                      <Image
                        src={product.farmerAvatar}
                        alt={product.farmerName}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#118C4C] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {product.farmerName?.[0]?.toUpperCase() || 'F'}
                        </span>
                      </div>
                    )}
                    {product.farmerIsVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#118C4C] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/users/${product.farmerId}`} className="hover:underline">
                      <p className="font-medium text-[#118C4C] flex items-center gap-1">
                        {product.farmerName}
                        {product.farmerIsVerified && <span className="text-xs">✓</span>}
                      </p>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {product.farmerIsVerified ? "Verified Farmer" : "Farmer"}
                    </p>
                  </div>
                </div>
                
                {productStats && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Total Products</p>
                      <p className="font-semibold text-[#118C4C]">{productStats.farmerProductCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Member Since</p>
                      <p className="font-semibold">
                        {product.createdAt ? new Date(product.createdAt).getFullYear() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
                
                <Link href={`/users/${product.farmerId}`}>
                  <Button variant="outline" size="sm" className="w-full border-[#118C4C]/30 hover:bg-[#118C4C]/5">
                    View Farmer Profile
                  </Button>
                </Link>
                
                {isAdmin && (
                  <Link href={`/listing/${product.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full border-orange-300 hover:bg-orange-50 text-orange-700 mt-2">
                      Edit Product (Admin)
                    </Button>
                  </Link>
                )}
              </div>
                
            </CardContent>
          </Card>
        </div>

        {/* Product Performance Section */}
        {productStats && (productStats.totalSold > 0 || productStats.uniqueBuyers > 0) && (
          <Card className="mb-4 border-[#118C4C]/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-[#118C4C] rounded"></div>
                Product Performance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                  <div className="text-2xl font-bold text-[#118C4C]">{productStats.totalSold}</div>
                  <div className="text-sm text-muted-foreground">Total Sold</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                  <div className="text-2xl font-bold text-[#118C4C]">{productStats.uniqueBuyers}</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20">
                  <div className="text-2xl font-bold text-[#118C4C]">{product.viewCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card className="mt-4 border-[#118C4C]/20">
          <CardContent className="p-6">
            <ProductComments productId={product.id} currentUserId={currentUser?.id} productOwnerId={product.farmerId} />
          </CardContent>
        </Card>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="h-1 w-8 bg-[#118C4C] rounded" />
              More in {product.category}
            </h2>
            <GridLayout>
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </GridLayout>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ProductDetailPage;
