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
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal"
import { calculateProfileCompletion } from "@/lib/profileUtils"
import { format } from "date-fns"
import { EmailCompletionModal } from "@/components/EmailCompletionModal"
import { useUser } from "@/lib/useUser"

function ProfilePage() {
  const router = useRouter()
  const { currentUser: user, isLoading, updateUser, isEmailMissing, dismissEmailMissing } = useUser()
  const { logout } = usePrivy()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)

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
      user.name ||
      (user as any).google?.name ||
      (user as any).github?.name ||
      (user as any).twitter?.name ||
      (user as any).email?.address?.split("@")[0] ||
      "User"
    )
  }

  // Helper function to get user email
    const getUserEmail = () => {
      if (!user) return "N/A"
      return (user as any).google?.email || (typeof user.email === "string" ? user.email : (user.email as any)?.address) || "N/A"
    }

  const profileCompletion = user ? calculateProfileCompletion(user) : 0
  const isProfileComplete = profileCompletion === 100

  useEffect(() => {
    if (user) {
      // Set name from user object
      setValue("name", user.name || "Unnamed User")

      // Set phone number from user object
      setValue("phone", user.phone || "")

      // Set location from user object
      setValue("location", user.location || "")

      // Set account type from user object
      setValue("accountType", (user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer"))
    }
  }, [user, setValue])

  const handleSignOut = () => {
    setIsSignOutModalOpen(true)
  }

  const handleEditProfile = () => {
    if (!user) return

    // Pre-fill form with current user data
    setValue("name", user.name || getUserDisplayName())
    setValue("phone", user.phone || "")
    setValue("location", user.location || "")
    setValue("accountType", (user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer"))
    setIsEditModalOpen(true)
  }

  const onSubmit = (data: ProfileUpdateFormData) => {
    if (!user) return

    try {
      // Update user state
      updateUser({
        name: data.name,
        phone: data.phone,
        location: data.location,
        role: data.accountType === "Farmer" ? "farmer" : "buyer",
      })

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

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#118C4C] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const displayName = getUserDisplayName()
  const userEmail = getUserEmail()
  const userPhoneNumber = user.phone || ""
  const userLocation = user.location || ""
  const userAccountType = user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer"

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Modal isOpen={isEmailMissing} onClose={dismissEmailMissing} title="Complete Your Profile">
        <EmailCompletionModal onClose={dismissEmailMissing} />
      </Modal>
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
                {user.avatar ? (
                  <img
                    src={user.avatar}
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
                  {userPhoneNumber && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs">📱</span>
                      {userPhoneNumber}
                    </p>
                  )}
                  {userLocation && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs">📍</span>
                      {userLocation}
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
    phone: userPhoneNumber,
    location: userLocation,
    avatar: user.avatar,
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
                <span className="font-medium text-foreground">{userAccountType || "Not set"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium text-foreground">
                  {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Authentication Provider</span>
                <span className="font-medium text-foreground">Privy</span>
              </div>

              {/* Login Methods */}
              {user.linked_accounts?.map((account: any) => (
                <div className="flex justify-between py-3 border-b border-border" key={account.type}>
                  <span className="text-muted-foreground">Linked Account</span>
                  <span className="font-medium text-foreground flex items-center gap-2">
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                      Connected
                    </span>
                  </span>
                </div>
              ))}

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
      <ProfileCompletionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Full Name"
            {...register("name")}
            error={errors.name?.message}
            placeholder="Your full name"
            required
            readOnly
          />

          <FormInput
            label="Email"
            value={userEmail}
            placeholder="Your email address"
            required
            readOnly
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
      </ProfileCompletionModal>

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