"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormInput } from "@/components/FormInput"
import { FormNumber } from "@/components/FormNumber"
import { FormSelect } from "@/components/FormSelector"
import { ImageMockUploader } from "@/components/ImageMockUploader"
import { productListingSchema, type ProductListingFormData, CATEGORY_PRODUCTS } from "@/lib/schemas"
import withAuth from "../../../components/withAuth"
import { usePrivy } from "@privy-io/react-auth"
import { useUser } from "@/lib/useUser"
import { useToast } from "@/lib/toast"

function NewListingPage() {
  const router = useRouter()
  const { user: privyUser } = usePrivy()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [imageBase64, setImageBase64] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProductListingFormData>({
    resolver: zodResolver(productListingSchema),
  })

  const onSubmit = async (data: ProductListingFormData) => {
    setIsSubmitting(true)

    try {
      if (!privyUser?.id || !currentUser) {
        throw new Error("User session not found. Please sign in again.")
      }

      const farmerId = currentUser.id

      let imageUrl = imageBase64 || data.image
      if (imageBase64?.startsWith("data:image/")) {
        const uploadResponse = await fetch('/api/storage/product-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: imageBase64, fileName: data.productName }),
        })
        if (!uploadResponse.ok) {
          const errorBody = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorBody?.error || 'Failed to upload product image')
        }
        const uploadData = await uploadResponse.json()
        imageUrl = uploadData?.imageUrl || imageUrl
      }

      // Create product in Supabase
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          productName: data.productName,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          pricePerUnit: data.pricePerUnit,
          description: data.description,
          image: imageUrl,
          location: currentUser.location || "Nigeria",
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error || 'Failed to create product')
      }

      toast.success("Product listed successfully! Redirecting to marketplace...")
      setTimeout(() => router.push("/marketplace"), 2000)
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(error instanceof Error ? error.message : "Failed to list product. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">List New Product</h1>
        <p className="text-muted-foreground mb-8">Add your product to the marketplace and reach more customers</p>

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
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Description
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent ${
                    errors.description ? "border-red-500" : "border-input"
                  }`}
                  placeholder="Describe your product, its quality, and any special features..."
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
              </div>

              <ImageMockUploader
                onImageSelect={(base64) => {
                  setImageBase64(base64)
                  setValue("image", base64)
                }}
                currentImage={imageBase64}
                label="Product Image"
                error={errors.image?.message}
              />

              {/* Confirmation checkbox */}
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${confirmed ? "border-[#118C4C] bg-[#118C4C]/5" : "border-border hover:border-[#118C4C]/50"}`}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#118C4C] flex-shrink-0"
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I confirm that the information provided above is accurate and truthful. I agree that this listing complies with Foodra&apos;s{" "}
                  <a href="/terms" target="_blank" className="text-[#118C4C] underline underline-offset-2 hover:text-[#0d6d3a]">Terms of Service</a>
                  {" "}and that I am the rightful owner or authorised seller of this product.
                </span>
              </label>

              <Button
                type="submit"
                disabled={isSubmitting || !confirmed}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white disabled:opacity-50"
              >
                {isSubmitting ? "Listing Product..." : "List Product"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(NewListingPage);
