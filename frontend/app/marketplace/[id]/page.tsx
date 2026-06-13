"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Share2, ShoppingCart, X, Eye, BadgeCheck, Minus, Plus, ChevronRight, Lock, Truck, RotateCcw, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useToast } from "@/lib/toast"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import type { Product } from "@/lib/types"
import { useCart } from "@/lib/useCart"
import { useUser } from "@/lib/useUser"
import { ProductComments } from "@/components/ProductComments"
import { WishlistButton } from "@/components/WishlistButton"
import { productJsonLd } from "@/lib/seo"
import { ProductCard } from "@/components/ProductCard"

function ProductDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
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
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<"description" | "details" | "reviews">("description")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/products/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(p => {
        setProduct(p)
        if (currentUser?.id) fetch(`/api/products/${id}/views?userId=${currentUser.id}`, { method: "POST" }).catch(() => {})
        else fetch(`/api/products/${id}/views`, { method: "POST" }).catch(() => {})
        Promise.all([
          fetch(`/api/products/${id}/related`).then(r => r.json()).catch(() => []),
          fetch(`/api/products/${id}/stats`).then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([rel, stats]) => { setRelated(rel); setProductStats(stats) })
      })
      .catch(e => setError(`Failed to load product: ${e}`))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    addToCart({ productId: product.id, productName: product.productName, pricePerUnit: product.pricePerUnit, quantity: qty, image: product.image })
    toast.success(`${qty} × ${product.productName} added to cart`)
  }

  const isAdminOrOwner = currentUser?.role === "admin" || currentUser?.role === "owner"
  const inStock = product && product.quantity > 0
  const lowStock = product && product.quantity > 0 && product.quantity <= 10

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-48 bg-muted rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="h-[480px] rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-4 w-24 bg-muted rounded-full" />
          <div className="h-10 w-3/4 bg-muted rounded" />
          <div className="h-6 w-1/3 bg-muted rounded" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-14 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">📦</div>
      <h1 className="text-2xl font-bold mb-3">Product Not Found</h1>
      <p className="text-muted-foreground mb-6">{error || "This product doesn't exist or has been removed."}</p>
      <Link href="/marketplace"><Button className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Back to Marketplace</Button></Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 pb-32 lg:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }} />

      <ShareOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        title={`${product.productName} on Foodra`} text={`Check out: ${product.productName}`}
        url={typeof window !== "undefined" ? window.location.href : ""} />

      {/* Fullscreen image */}
      {isImageFullScreen && product.image && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setIsImageFullScreen(false)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full">
            <X className="h-5 w-5" />
          </button>
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image src={product.image} alt={product.productName} fill className="object-contain" unoptimized />
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground py-4">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.productName}</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">

          {/* Image */}
          <div className="relative h-80 sm:h-[480px] rounded-3xl overflow-hidden bg-muted cursor-zoom-in group"
            onClick={() => product.image && setIsImageFullScreen(true)}>
            {product.image
              ? <Image src={product.image} alt={product.productName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
              : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
            }
            {/* Stock badge */}
            <div className="absolute top-3 left-3">
              {!inStock
                ? <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Out of Stock</span>
                : lowStock
                ? <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Only {product.quantity} left</span>
                : <span className="bg-[#118C4C] text-white text-xs font-bold px-2.5 py-1 rounded-full">In Stock</span>
              }
            </div>
            <div className="absolute top-3 right-3">
              <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">{product.category}</span>
            </div>
            {product.image && (
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> Tap to zoom
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{product.productName}</h1>
              <WishlistButton productId={product.id} productName={product.productName} image={product.image} pricePerUnit={product.pricePerUnit}
                className="flex-shrink-0 h-10 w-10 rounded-xl border border-input" iconSize="h-5 w-5" />
            </div>

            {(product.viewCount ?? 0) > 0 && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{product.viewCount?.toLocaleString()} views</span>
                {productStats?.totalSold > 0 && <span className="flex items-center gap-1"><ShoppingCart className="h-3.5 w-3.5" />{productStats.totalSold} sold</span>}
                {productStats?.uniqueBuyers > 0 && <span>👥 {productStats.uniqueBuyers} buyers</span>}
              </div>
            )}

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">/ {product.unit || "unit"}</span>
              </div>
              {qty > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total: <span className="font-bold text-foreground">₦{(product.pricePerUnit * qty).toLocaleString()}</span>
                </p>
              )}
            </div>

            {/* Seller */}
            <Link href={`/users/${product.farmerId}`}>
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-border hover:border-[#118C4C]/40 hover:bg-[#118C4C]/5 transition-all group">
                <div className="relative flex-shrink-0">
                  {product.farmerAvatar
                    ? <img src={product.farmerAvatar} alt={product.farmerName} className="w-10 h-10 rounded-full object-contain border border-border bg-white" />
                    : <div className="w-10 h-10 rounded-full bg-[#118C4C] flex items-center justify-center text-white font-bold">{product.farmerName?.[0]?.toUpperCase()}</div>
                  }
                  {product.farmerIsVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#118C4C] rounded-full flex items-center justify-center border border-background">
                      <BadgeCheck className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{product.farmerName}</p>
                  <p className="text-xs text-muted-foreground">{product.farmerIsVerified ? "✓ Verified Seller" : "Seller"} · {product.location}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </Link>

            {/* Location + stock */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <MapPin className="h-4 w-4 text-[#118C4C] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium truncate">{product.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                <ShoppingCart className="h-4 w-4 text-[#118C4C] flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="font-medium">{product.quantity} {product.unit || "unit"}{product.quantity !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                  className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-40">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))} disabled={qty >= product.quantity}
                  className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-40">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <Button onClick={handleAddToCart} disabled={!inStock} size="lg"
                className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 rounded-2xl shadow-lg shadow-[#118C4C]/20">
                <ShoppingCart className="h-5 w-5" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setIsShareModalOpen(true)} className="rounded-2xl px-4">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {inStock && (
              <Link href="/shop">
                <Button variant="outline" size="lg" className="w-full rounded-2xl border-[#118C4C]/30 hover:bg-[#118C4C]/5 text-[#118C4C] font-semibold">
                  View Cart & Checkout
                </Button>
              </Link>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Lock className="h-4 w-4" />, label: "Secure Escrow" },
                { icon: <Truck className="h-4 w-4" />, label: "Fast Delivery" },
                { icon: <RotateCcw className="h-4 w-4" />, label: "7-day Release" },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-muted/50 text-center">
                  <span className="text-[#118C4C]">{b.icon}</span>
                  <span className="text-[10px] text-muted-foreground font-medium leading-tight">{b.label}</span>
                </div>
              ))}
            </div>

            {isAdminOrOwner && (
              <Link href={`/listing/${product.id}/edit`}>
                <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 rounded-xl">
                  Edit Product (Admin)
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border border-border rounded-3xl overflow-hidden mb-8">
          <div className="flex border-b border-border">
            {(["description", "details", "reviews"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors
                  ${tab === t ? "bg-[#118C4C]/5 text-[#118C4C] border-b-2 border-[#118C4C]" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === "description" && (
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
            )}
            {tab === "details" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {([
                  ["Category", product.category],
                  ["Unit", product.unit || "unit"],
                  ["Price per unit", `₦${product.pricePerUnit.toLocaleString()}`],
                  ["Available stock", `${product.quantity} ${product.unit || "unit"}${product.quantity !== 1 ? "s" : ""}`],
                  ["Location", product.location],
                  ["Listed", product.createdAt ? new Date(product.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" }) : "N/A"],
                  ...(productStats?.totalSold > 0 ? [["Total sold", String(productStats.totalSold)]] : []),
                  ...(productStats?.uniqueBuyers > 0 ? [["Unique buyers", String(productStats.uniqueBuyers)]] : []),
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === "reviews" && (
              <ProductComments productId={product.id} currentUserId={currentUser?.id} productOwnerId={product.farmerId} />
            )}
          </div>
        </div>

        {/* Related Products — horizontal scroll */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#118C4C]" /> More in {product.category}
              </h2>
              <Link href={`/marketplace?category=${product.category}`} className="text-xs text-[#118C4C] hover:underline font-medium">See all</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
              {related.map(p => (
                <div key={p.id} className="flex-shrink-0 w-44">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{product.productName}</p>
          <p className="font-black text-[#118C4C]">₦{(product.pricePerUnit * qty).toLocaleString()}</p>
        </div>
        <Button onClick={handleAddToCart} disabled={!inStock}
          className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 rounded-xl px-6 shadow-lg shadow-[#118C4C]/20">
          <ShoppingCart className="h-4 w-4" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  )
}

export default ProductDetailPage
