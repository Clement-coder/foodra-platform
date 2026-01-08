"use client"

import { useState, useEffect } from "react"
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
import { NotificationDiv } from "@/components/NotificationDiv"
import { productListingSchema, type ProductListingFormData } from "@/lib/schemas"
import type { User, Product } from "@/lib/types"
import withAuth from "../../../components/withAuth";
import { usePrivy } from "@privy-io/react-auth";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"
import { generateAvatarUrl } from "@/lib/avatarGenerator"

function NewListingPage() {
  const router = useRouter()
  const { user: privyUser } = usePrivy();
  const [user, setUser] = useState<User | null>(null)
  const [imageBase64, setImageBase64] = useState("")
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProductListingFormData>({
    resolver: zodResolver(productListingSchema),
  })

  useEffect(() => {
    if (privyUser) {
      const storedUser = loadFromLocalStorage<User | null>(`foodra_user_${privyUser.id}`, null);
      if (storedUser) {
        setUser(storedUser);
      } else {
        const newUser: User = {
          id: privyUser.id,
          name: privyUser.google?.name || privyUser.email?.address || "Unnamed User",
          phone: privyUser.phone?.number || "",
          location: "Nigeria", // Default location
          avatar: generateAvatarUrl(privyUser.id),
          role: "farmer", // Default role
        };
        saveToLocalStorage(`foodra_user_${privyUser.id}`, newUser);
        setUser(newUser);
      }
    }
  }, [privyUser]);




  const onSubmit = (data: ProductListingFormData) => {
    setIsSubmitting(true)
    setNotification(null)

    try {
      // Create new product
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        productName: data.productName,
        category: data.category,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit,
        description: data.description,
        image: data.image,
        location: user?.location || "Nigeria",
        farmerId: user?.id || "unknown",
        farmerName: user?.name || "Unknown Farmer",
        farmerAvatar: user?.avatar || "",
        createdAt: new Date().toISOString(),
      }

      // Load existing products and add new one
const products = loadFromLocalStorage<Product[]>("foodra_products", [])
      products.unshift(newProduct)
      saveToLocalStorage("foodra_products", products)

      setNotification({
        type: "success",
        message: "Product listed successfully! Redirecting to marketplace...",
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/marketplace")
      }, 2000)
    } catch (error) {
      setNotification({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  if (!user) {
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

        {notification && (
          <NotificationDiv
            type={notification.type}
            message={notification.message}
            duration={notification.type === "success" ? 5000 : 6000}
            onClose={() => setNotification(null)}
          />
        )}

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
                  { value: "Vegetables", label: "Vegetables" },
                  { value: "Fruits", label: "Fruits" },
                  { value: "Grains", label: "Grains" },
                  { value: "Tubers", label: "Tubers" },
                  { value: "Poultry", label: "Poultry" },
                  { value: "Livestock", label: "Livestock" },
                  { value: "Others", label: "Others" },
                ]}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormNumber
                  label="Quantity (units)"
                  {...register("quantity", { valueAsNumber: true })}
                  error={errors.quantity?.message}
                  placeholder="100"
                  min="1"
                  required
                />

                <FormNumber
                  label="Price per Unit (₦)"
                  {...register("pricePerUnit", { valueAsNumber: true })}
                  error={errors.pricePerUnit?.message}
                  placeholder="500"
                  min="1"
                  required
                />
              </div>

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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
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