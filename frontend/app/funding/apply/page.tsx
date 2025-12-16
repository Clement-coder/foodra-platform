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
import { NotificationDiv } from "@/components/NotificationDiv"
import { fundingApplicationSchema, type FundingApplicationFormData } from "@/lib/schemas"
import type { User, FundingApplication } from "@/lib/types"
import withAuth from "../../../components/withAuth";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"
import { usePrivy } from "@privy-io/react-auth"

function ApplyFundingPage() {
  const router = useRouter()
  const { user: privyUser } = usePrivy() // Get user from Privy
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FundingApplicationFormData>({
    resolver: zodResolver(fundingApplicationSchema),
  })

  useEffect(() => {
    if (!privyUser) {
      router.push("/")
      return;
    }

    // Pre-fill form with user data
    // Full Name from Privy user
    const getUserDisplayName = () => {
      if (!privyUser) return ""
      return (
        privyUser.google?.name ||
        privyUser.github?.name ||
        privyUser.twitter?.name ||
        privyUser.email?.address?.split("@")[0] ||
        ""
      )
    }
    setValue("fullName", getUserDisplayName())

    // Phone Number from localStorage
    const savedPhoneNumber = loadFromLocalStorage<string>("user_phone_number", "")
    if (savedPhoneNumber) {
      setValue("phoneNumber", savedPhoneNumber)
    } else if (privyUser.phone?.number) {
      setValue("phoneNumber", privyUser.phone.number)
    }

    // Location from localStorage
    const savedLocation = loadFromLocalStorage<string>("user_location", "")
    if (savedLocation) {
      setValue("location", savedLocation)
    }
  }, [router, setValue, privyUser])

  const onSubmit = (data: FundingApplicationFormData) => {
    setIsSubmitting(true)
    setNotification(null)

    if (!privyUser) {
      setNotification({
        type: "error",
        message: "User information is missing. Please sign in again.",
      })
      setIsSubmitting(false)
      return
    }

    // Show summary of errors if any
    if (Object.keys(errors).length > 0) {
      setNotification({
        type: "error",
        message: "Please fix the errors in the form before submitting.",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Create new funding application
      const newApplication: FundingApplication = {
        id: `fund-${Date.now()}`,
        userId: privyUser.id,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        location: data.location,
        farmSize: data.farmSize,
        farmType: data.farmType,
        yearsOfExperience: data.yearsOfExperience,
        amountRequested: data.amountRequested,
        expectedOutcome: data.expectedOutcome,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      }

      // Load existing applications and add new one
      const applications = loadFromLocalStorage<FundingApplication[]>("foodra_applications", [])
      applications!.unshift(newApplication)
      saveToLocalStorage("foodra_applications", applications)

      setNotification({
        type: "success",
        message: "Application submitted successfully! Redirecting to funding dashboard...",
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/funding")
      }, 2000)
    } catch (error) {
      setNotification({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  if (!privyUser) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Apply for Funding</h1>
        <p className="text-muted-foreground mb-8">
          Complete this application to access funding opportunities for your farm
        </p>

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
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <FormInput
                    label="Full Name"
                    {...register("fullName")}
                    error={errors.fullName?.message}
                    placeholder="Your full name"
                    required
                    readOnly
                  />

                  <FormInput
                    label="Phone Number"
                    {...register("phoneNumber")}
                    error={errors.phoneNumber?.message}
                    placeholder="+234XXXXXXXXX"
                    helperText="Include country code (e.g., +234)"
                    required
                    readOnly
                  />

                  <FormInput
                    label="Location"
                    {...register("location")}
                    error={errors.location?.message}
                    placeholder="City, State"
                    required
                    readOnly
                  />
                </div>
              </div>

              {/* Farm Information */}
              <div className="pt-4 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Farm Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormNumber
                    label="Farm Size (hectares)"
                    {...register("farmSize", { valueAsNumber: true })}
                    error={errors.farmSize?.message}
                    placeholder="e.g., 5"
                    min="0.1"
                    step="0.1"
                    required
                  />

                  <FormSelect
                    label="Farm Type"
                    {...register("farmType")}
                    error={errors.farmType?.message}
                    options={[
                      { value: "", label: "Select farm type" },
                      { value: "smallholder", label: "Smallholder" },
                      { value: "commercial", label: "Commercial" },
                      { value: "cooperative", label: "Cooperative" },
                    ]}
                    required
                  />

                  <FormNumber
                    label="Years of Experience"
                    {...register("yearsOfExperience", { valueAsNumber: true })}
                    error={errors.yearsOfExperience?.message}
                    placeholder="e.g., 3"
                    min="0"
                    required
                  />

                  <FormNumber
                    label="Amount Requested (₦)"
                    {...register("amountRequested", { valueAsNumber: true })}
                    error={errors.amountRequested?.message}
                    placeholder="e.g., 500000"
                    min="1000"
                    required
                  />
                </div>
              </div>

              {/* Expected Outcome */}
              <div className="pt-4 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Business Plan</h2>
                <div className="space-y-2">
                  <label htmlFor="expectedOutcome" className="block text-sm font-medium text-foreground">
                    Expected Outcome
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    id="expectedOutcome"
                    {...register("expectedOutcome")}
                    rows={6}
                    className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent ${
                      errors.expectedOutcome ? "border-red-500" : "border-input"
                    }`}
                    placeholder="Describe how you plan to use the funding and the expected outcomes for your farm business..."
                  />
                  {errors.expectedOutcome && (
                    <p className="text-sm text-red-600 mt-1">{errors.expectedOutcome.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Include details about your business goals, how the funds will be used, and projected returns.
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Application Process:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Submit your application with accurate information</li>
                  <li>Our team will review your application within 5-7 business days</li>
                  <li>You'll be notified of the decision via your registered phone number</li>
                  <li>Approved applications will receive further instructions for fund disbursement</li>
                </ol>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white"
                size="lg"
              >
                {isSubmitting ? "Submitting Application..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default withAuth(ApplyFundingPage);