"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, ShoppingCart, UserIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/Skeleton"
import { NotificationDiv } from "@/components/NotificationDiv"
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden bg-muted">
            <Image src={product.image || "/placeholder.svg"} alt={product.productName} fill className="object-cover" />
          </div>

          {/* Info */}
          <div>
            <div className="mb-4">
              <span className="inline-block bg-[#118C4C]/10 text-[#118C4C] text-sm font-semibold px-3 py-1 rounded-full">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.productName}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-4xl font-bold text-[#118C4C]">₦{product.pricePerUnit.toLocaleString()}</span>
              <span className="text-muted-foreground">per unit</span>
            </div>

            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{product.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Sold by {product.farmerName}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">Available Stock</p>
                    <p className="text-lg font-semibold text-foreground">{product.quantity} units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 mb-4"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart
            </Button>

            <Link href="/shop" className="block">
              <Button variant="outline" size="lg" className="w-full bg-transparent">
                View Cart
              </Button>
            </Link>
          </div>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Product Description</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(ProductDetailPage);