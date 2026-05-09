"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { authFetch } from "@/lib/authFetch"

declare global {
  interface Window {
    MetaMapWebSdk?: {
      init: (opts: { clientId: string; flowId: string; metadata: Record<string, string>; onFinish?: (data: any) => void; onError?: (err: any) => void }) => void
      show: () => void
    }
  }
}

function NewListingPage() {
  const router = useRouter()
  const { user: privyUser, getAccessToken } = usePrivy()
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [imageBase64, setImageBase64] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [descLength, setDescLength] = useState(0)

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [verifyStep, setVerifyStep] = useState<"prompt" | "kyc" | "pending">("prompt")
  const pendingDataRef = useRef<ProductListingFormData | null>(null)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProductListingFormData>({
    resolver: zodResolver(productListingSchema),
  })

  // Load MetaMap SDK when modal opens
  useEffect(() => {
    if (!showVerifyModal || sdkReady) return
    if (document.getElementById("metamap-sdk")) { setSdkReady(true); return }
    const script = document.createElement("script")
    script.id = "metamap-sdk"
    script.src = "https://web-button.getmati.com/button.js"
    script.async = true
    script.onload = () => setSdkReady(true)
    document.body.appendChild(script)
  }, [showVerifyModal, sdkReady])

  // Init MetaMap once SDK ready and we're on kyc step
  useEffect(() => {
    if (verifyStep !== "kyc" || !sdkReady || !currentUser) return
    const clientId = process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID
    const flowId = process.env.NEXT_PUBLIC_METAMAP_FLOW_ID
    if (!clientId || !flowId) return
    const t = setTimeout(() => {
      window.MetaMapWebSdk?.init({
        clientId,
        flowId,
        metadata: { userId: currentUser.id },
        onFinish: () => setVerifyStep("pending"),
        onError: () => setVerifyStep("pending"),
      })
    }, 300)
    return () => clearTimeout(t)
  }, [verifyStep, sdkReady, currentUser])

  const submitProduct = async (data: ProductListingFormData) => {
    setIsSubmitting(true)
    try {
      if (!privyUser?.id || !currentUser) throw new Error("User session not found.")

      let imageUrl = imageBase64 || data.image
      if (imageBase64?.startsWith("data:image/")) {
        const uploadRes = await authFetch(getAccessToken, "/api/storage/product-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: imageBase64, fileName: data.productName }),
        })
        if (!uploadRes.ok) throw new Error((await uploadRes.json().catch(() => ({}))).error || "Failed to upload image")
        imageUrl = (await uploadRes.json()).imageUrl || imageUrl
      }

      const res = await authFetch(getAccessToken, "/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to create product")

      toast.success("Product listed successfully!")
      setTimeout(() => router.push("/marketplace"), 1500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to list product.")
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: ProductListingFormData) => {
    if (!currentUser?.isVerified) {
      // Save form data, show verification modal
      pendingDataRef.current = data
      setShowVerifyModal(true)
      setVerifyStep("prompt")
      return
    }
    await submitProduct(data)
  }

  if (!currentUser) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">List New Product</h1>
        <p className="text-muted-foreground mb-8">Add your product to the marketplace and reach more customers</p>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput label="Product Name" {...register("productName")} error={errors.productName?.message} placeholder="e.g., Fresh Tomatoes" required />

              <FormSelect
                label="Category"
                {...register("category")}
                error={errors.category?.message}
                options={[{ value: "", label: "Select a category" }, ...Object.keys(CATEGORY_PRODUCTS).map((cat) => ({ value: cat, label: cat }))]}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormNumber label="Quantity" {...register("quantity", { valueAsNumber: true })} error={errors.quantity?.message} placeholder="100" min="1" required />
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

              <FormNumber label="Price per Unit (₦)" {...register("pricePerUnit", { valueAsNumber: true })} error={errors.pricePerUnit?.message} placeholder="500" min="1" required />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs ${descLength > 500 ? "text-red-500" : "text-muted-foreground"}`}>{descLength}/500</span>
                </div>
                <textarea
                  id="description"
                  {...register("description", { onChange: (e) => setDescLength(e.target.value.length) })}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent ${errors.description ? "border-red-500" : "border-input"}`}
                  placeholder="Describe your product, its quality, and any special features..."
                />
                {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
              </div>

              <ImageMockUploader
                onImageSelect={(base64) => { setImageBase64(base64); setValue("image", base64) }}
                currentImage={imageBase64}
                label="Product Image"
                error={errors.image?.message}
              />

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${confirmed ? "border-[#118C4C] bg-[#118C4C]/5" : "border-border hover:border-[#118C4C]/50"}`}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#118C4C] flex-shrink-0" />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I confirm that the information provided is accurate and I am the rightful owner or authorised seller of this product. I agree to Foodra&apos;s{" "}
                  <a href="/terms" target="_blank" className="text-[#118C4C] underline underline-offset-2 hover:text-[#0d6d3a]">Terms of Service</a>.
                </span>
              </label>

              <Button type="submit" disabled={isSubmitting || !confirmed} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white disabled:opacity-50">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Listing Product...</> : "List Product"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Verification modal — only shown when needed, after form is filled */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => verifyStep === "prompt" && setShowVerifyModal(false)} />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="h-1 w-full bg-gradient-to-r from-[#118C4C] to-lime-400" />
              <div className="p-6 space-y-5">

                {verifyStep === "prompt" && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-[#118C4C]" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground">One quick step</h2>
                        <p className="text-xs text-muted-foreground">Your product details are saved</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      To keep Foodra safe and trustworthy for all buyers, we need to verify your identity before listing your first product. It takes about 2 minutes.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {["Valid government ID (NIN, passport, or driver's licence)", "Camera access for a quick selfie", "Done — your product lists automatically"].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#118C4C] shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setShowVerifyModal(false)}>Later</Button>
                      <Button className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => setVerifyStep("kyc")}>
                        Verify Now
                      </Button>
                    </div>
                  </>
                )}

                {verifyStep === "kyc" && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-5 w-5 text-[#118C4C]" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-foreground">Identity verification</h2>
                        <p className="text-xs text-muted-foreground">Powered by MetaMap</p>
                      </div>
                    </div>
                    {!sdkReady ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-[#118C4C]" /> Loading...
                      </div>
                    ) : (
                      <Button className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => window.MetaMapWebSdk?.show()}>
                        <ShieldCheck className="h-4 w-4 mr-2" /> Start Verification
                      </Button>
                    )}
                  </>
                )}

                {verifyStep === "pending" && (
                  <div className="text-center space-y-4 py-2">
                    <CheckCircle2 className="h-12 w-12 text-[#118C4C] mx-auto" />
                    <div>
                      <h2 className="text-base font-bold text-foreground mb-1">Verification submitted!</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We're reviewing your details — usually takes a few minutes. Your product will be listed automatically once approved.
                      </p>
                    </div>
                    <Button className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white" onClick={() => { setShowVerifyModal(false); router.push("/marketplace") }}>
                      Go to Marketplace
                    </Button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default withAuth(NewListingPage)
