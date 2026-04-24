"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormInput } from "@/components/FormInput"
import { FormNumber } from "@/components/FormNumber"
import { FormSelect } from "@/components/FormSelector"
import { ImageMockUploader } from "@/components/ImageMockUploader"
import { productListingSchema, type ProductListingFormData, CATEGORY_PRODUCTS } from "@/lib/schemas"
import withAuth from "@/components/withAuth"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import { useToast } from "@/lib/toast"
import type { Product } from "@/lib/types"
import { authFetch } from "@/lib/authFetch"

function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user: privyUser, getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const { toast, confirm } = useToast()
  const [imageBase64, setImageBase64] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [descLength, setDescLength] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProductListingFormData>({
    resolver: zodResolver(productListingSchema),
  })

  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((p: Product) => {
        setProduct(p)
        reset({
          productName: p.productName,
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          pricePerUnit: p.pricePerUnit,
          description: p.description,
          image: p.image,
        })
        setDescLength(p.description?.length || 0)
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false))
  }, [id])

  // Guard: only the farmer who owns this product can edit it
  useEffect(() => {
    if (!loading && product && currentUser && product.farmerId !== currentUser.id && currentUser.role !== "admin") {
      toast.error("You can only edit your own products.")
      router.push("/marketplace")
    }
  }, [loading, product, currentUser])

  const onSubmit = async (data: ProductListingFormData) => {
    setIsSubmitting(true)
    try {
      let imageUrl = imageBase64 || data.image
      if (imageBase64?.startsWith("data:image/")) {
        const uploadRes = await authFetch(getAccessToken, "/api/storage/product-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: imageBase64, fileName: data.productName }),
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          imageUrl = uploadData?.imageUrl || imageUrl
        }
      }

      const res = await authFetch(getAccessToken, `/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.productName,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          price: data.pricePerUnit,
          description: data.description,
          image_url: imageUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update product")
      }

      toast.success("Product updated successfully!")
      router.push(`/marketplace/${id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Product",
      message: "Are you sure you want to permanently delete this product? This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    })
    if (!ok) return
    setIsDeleting(true)
    const res = await authFetch(getAccessToken, `/api/products/${id}`, { method: "DELETE" })
    setIsDeleting(false)
    if (res.ok) {
      toast.success("Product deleted.")
      router.push("/marketplace")
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || "Failed to delete product")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#118C4C]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button onClick={() => router.push("/marketplace")} className="mt-4">Back to Marketplace</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
        <p className="text-muted-foreground mb-8">Update your product listing details</p>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                label="Product Name"
                {...register("productName")}
                error={errors.productName?.message}
                placeholder="e.g., Fresh Tomatoes"
                required
              />

              <FormSelect
                label="Category"
                {...register("category")}
                error={errors.category?.message}
                options={[
                  { value: "", label: "Select a category" },
                  ...Object.keys(CATEGORY_PRODUCTS).map((cat) => ({ value: cat, label: cat })),
                ]}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormNumber
                  label="Quantity"
                  {...register("quantity", { valueAsNumber: true })}
                  error={errors.quantity?.message}
                  placeholder="100"
                  min="1"
                  required
                />
                <FormSelect
                  label="Unit"
                  {...register("unit")}
                  error={errors.unit?.message}
                  options={[
                    { value: "", label: "Select unit" },
                    { value: "kg", label: "Kilogram (kg)" },
                    { value: "g", label: "Gram (g)" },
                    { value: "tonne", label: "Tonne" },
                    { value: "bag", label: "Bag" },
                    { value: "crate", label: "Crate" },
                    { value: "basket", label: "Basket" },
                    { value: "bunch", label: "Bunch" },
                    { value: "piece", label: "Piece" },
                    { value: "dozen", label: "Dozen" },
                    { value: "litre", label: "Litre (L)" },
                    { value: "unit", label: "Unit" },
                  ]}
                  required
                />
              </div>

              <FormNumber
                label="Price per Unit (₦)"
                {...register("pricePerUnit", { valueAsNumber: true })}
                error={errors.pricePerUnit?.message}
                placeholder="500"
                min="1"
                required
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${descLength > 500 ? "text-red-500" : "text-muted-foreground"}`}>
                    {descLength}/500
                  </span>
                </div>
                <textarea
                  {...register("description", {
                    onChange: (e) => setDescLength(e.target.value.length),
                  })}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#118C4C] ${errors.description ? "border-red-500" : "border-input"}`}
                  placeholder="Describe your product..."
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <ImageMockUploader
                onImageSelect={(base64) => { setImageBase64(base64); setValue("image", base64) }}
                currentImage={imageBase64 || product.image}
                label="Product Image"
                error={errors.image?.message}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                ) : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(EditListingPage)
