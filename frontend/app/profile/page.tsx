"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit, LogOut, UserIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { FormInput } from "@/components/FormInput"
import { FormSelect } from "@/components/FormSelector"
import { NotificationDiv } from "@/components/NotificationDiv"
import { FarmerProfileSummary } from "@/components/FarmerProfileSummary"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/schemas"
import { usePrivy } from "@privy-io/react-auth"
import withAuth from "@/components/withAuth"
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/localStorage"
import { SignOutModal } from "@/components/SignOutModal"

function ProfilePage() {
  const router = useRouter()
  const { user, logout } = usePrivy()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [accountType, setAccountType] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  })

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!user) return "User"
    return (
      user.google?.name ||
      user.github?.name ||
      user.twitter?.name ||
      user.email?.address?.split("@")[0] ||
      "User"
    )
  }

  // Helper function to get user email
  const getUserEmail = () => {
    if (!user) return "N/A"
    return user.google?.email || user.email?.address || "N/A"
  }

  // Helper function to get user profile picture
  const getUserProfilePicture = () => {
    if (!user) return null
    // Updated to use 'picture' instead of 'profilePictureUrl'
    return  (user.github as any)?.picture || (user.twitter as any)?.picture || null
  }

  const calculateProfileCompletion = () => {
    if (!user) return 0

    let completedFields = 0
    const totalFields = 5 // name, email, phone, location, accountType

    console.log("Calculating profile completion...")

    // Name field
    if (getUserDisplayName() !== "User") {
      completedFields++
      console.log("Name field is complete.")
    }

    // Email field
    if (getUserEmail() !== "N/A") {
      completedFields++
      console.log("Email field is complete.")
    }

    // Phone field
    if (phoneNumber) {
      completedFields++
      console.log("Phone field is complete.")
    }

    // Location field
    if (location) {
      completedFields++
      console.log("Location field is complete.")
    }

    // Account type field
    if (accountType) {
      completedFields++
      console.log("Account type field is complete.")
    }

    const percentage = Math.round((completedFields / totalFields) * 100)
    console.log(`Profile completion: ${percentage}%`)
    return percentage
  }

  const profileCompletion = user ? calculateProfileCompletion() : 0
  const isProfileComplete = profileCompletion === 100

  useEffect(() => {
    if (user) {
      console.log("Privy user object:", JSON.stringify(user, null, 2))

      // Set name
      setValue("name", getUserDisplayName())

      // Load phone number
      let savedPhoneNumber = loadFromLocalStorage<string>("user_phone_number", "")
      // Normalize non-string values (in case something else was stored)
      if (typeof savedPhoneNumber !== "string") {
        try {
          if (savedPhoneNumber && typeof savedPhoneNumber === "object" && "number" in savedPhoneNumber) {
        savedPhoneNumber = (savedPhoneNumber as any).number
          } else {
        savedPhoneNumber = savedPhoneNumber ? String(savedPhoneNumber) : ""
          }
        } catch {
          savedPhoneNumber = ""
        }
      }
      if (typeof savedPhoneNumber === "string" && savedPhoneNumber) {
        setValue("phone", savedPhoneNumber)
        setPhoneNumber(savedPhoneNumber)
      } else if (user.phone?.number) {
        setValue("phone", user.phone.number)
        setPhoneNumber(user.phone.number)
      }

      // Load location
      const savedLocation = loadFromLocalStorage<string>("user_location", "")
      if (typeof savedLocation === "string" && savedLocation) {
        setValue("location", savedLocation)
        setLocation(savedLocation)
      }

      // Load account type
      const savedAccountType = loadFromLocalStorage<string>("account_type", "")
      const validAccountTypes = ["Farmer", "Buyer"]
      if (typeof savedAccountType === "string" && validAccountTypes.includes(savedAccountType)) {
        setValue("accountType", savedAccountType as "Farmer" | "Buyer")
        setAccountType(savedAccountType)
      } else {
        setValue("accountType", "Farmer")
        setAccountType("Farmer")
      }
    }
  }, [user, setValue])

  const handleSignOut = () => {
    setIsSignOutModalOpen(true)
  }

  const handleEditProfile = () => {
    if (!user) return

    // Pre-fill form with current user data
    setValue("name", getUserDisplayName())

   const savedPhoneNumber = loadFromLocalStorage("user_phone_number", "")
const savedLocation = loadFromLocalStorage("user_location", "")
const savedAccountType = loadFromLocalStorage("account_type", "Farmer")
    setIsEditModalOpen(true)
  }

  const onSubmit = (data: ProfileUpdateFormData) => {
    if (!user) return

    try {
      // Save phone number
      if (data.phone) {
        saveToLocalStorage("user_phone_number", data.phone)
        setPhoneNumber(data.phone)
      }

      // Save location
      saveToLocalStorage("user_location", data.location)
      setLocation(data.location)

      // Save account type
      saveToLocalStorage("account_type", data.accountType)
      setAccountType(data.accountType)

      console.log("Updating user profile:", data)

      setIsEditModalOpen(false)
      reset()

      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      })

      // Auto-dismiss notification after 3 seconds
      setTimeout(() => {
        setNotification(null)
      }, 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setNotification({
        type: "error",
        message: "Failed to update profile. Please try again.",
      })
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#118C4C] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const profilePicture = getUserProfilePicture()
  const displayName = getUserDisplayName()
  const userEmail = getUserEmail()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {notification && (
        <NotificationDiv
          type={notification.type}
          message={notification.message}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-border">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={displayName}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">{displayName}</h1>
                <div className="space-y-1 text-muted-foreground">
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs">📧</span>
                    {userEmail}
                  </p>
                  {phoneNumber && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs">📱</span>
                      {phoneNumber}
                    </p>
                  )}
                  {location && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs">📍</span>
                      {location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  className="gap-2 bg-transparent hover:bg-accent transition-colors w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4" />
                  <span>{isProfileComplete ? "Edit Profile" : "Complete Setup"}</span>
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="gap-2 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Completion Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">Profile Completion</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-2 overflow-hidden">
              <motion.div
                className="bg-[#118C4C] h-4 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-right">{profileCompletion}% Complete</p>
            {!isProfileComplete && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-400 flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>Please complete your profile to unlock all features.</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Summary Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Your Activity</h2>
      <FarmerProfileSummary
  user={{
    id: user.id,
    name: displayName,
    role: "farmer",
    phone: phoneNumber || "",        // Added
    location: location || "",        // Added
    avatar: profilePicture || undefined,  // Added
  }}
/>
        </div>

        {/* Account Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium text-foreground">{accountType || "Not set"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Authentication Provider</span>
                <span className="font-medium text-foreground">Privy</span>
              </div>

              {/* Login Methods */}
              {user.github && (
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Linked Account</span>
                  <span className="font-medium text-foreground flex items-center gap-2">
                    GitHub
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  </span>
                </div>
              )}
              {user.google && (
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Linked Account</span>
                  <span className="font-medium text-foreground flex items-center gap-2">
                    Google
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  </span>
                </div>
              )}
              {user.twitter && (
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Linked Account</span>
                  <span className="font-medium text-foreground flex items-center gap-2">
                    Twitter
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  </span>
                </div>
              )}
              {user.phone && (
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground">Phone Verified</span>
                  <span className="font-medium text-foreground">{user.phone.number}</span>
                </div>
              )}
              {user.email && (
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{user.email.address}</span>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Note:</strong> Your authentication is securely managed by Privy.
                Profile data is stored locally for this demo. In production, this would be synced with a backend
                database.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={isProfileComplete ? "Edit Profile" : "Complete Profile Setup"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Full Name"
            {...register("name")}
            error={errors.name?.message}
            placeholder="Your full name"
            required
          />

          <FormInput
            label="Phone Number"
            {...register("phone")}
            error={errors.phone?.message}
            placeholder="+234XXXXXXXXX"
            helperText="Include country code (e.g., +234)"
            required
          />

          <FormInput
            label="Location"
            {...register("location")}
            error={errors.location?.message}
            placeholder="City, State"
            required
          />

          <FormSelect
            label="Account Type"
            {...register("accountType")}
            error={errors.accountType?.message}
            options={[
              { value: "Farmer", label: "Farmer" },
              { value: "Buyer", label: "Buyer" },
            ]}
            required
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white transition-colors w-full"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 w-full hover:bg-accent transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        logout={logout}
      />
    </div>
  )
}

export default withAuth(ProfilePage)