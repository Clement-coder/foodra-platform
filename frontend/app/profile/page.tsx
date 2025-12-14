"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { Edit, LogOut, UserIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { FormInput } from "@/components/FormInput"
import { NotificationDiv } from "@/components/NotificationDiv"
import { FarmerProfileSummary } from "@/components/FarmerProfileSummary"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/schemas"
import type { User } from "@/lib/types"
import { loadFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from "@/lib/localStorage"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

  useEffect(() => {
    // Check if user is logged in
  const storedUser = loadFromLocalStorage<User | null>("foodra_user", null)
    if (!storedUser) {
      router.push("/")
      return
    }
    setUser(storedUser)
  }, [router])

  const handleSignOut = () => {
    removeFromLocalStorage("foodra_user")
    router.push("/")
  }

  const handleEditProfile = () => {
    if (!user) return

    // Pre-fill form with current user data
    setValue("name", user.name)
    setValue("phone", user.phone)
    setValue("location", user.location)
    setIsEditModalOpen(true)
  }

  const onSubmit = (data: ProfileUpdateFormData) => {
    if (!user) return

    try {
      // Update user data
      const updatedUser: User = {
        ...user,
        name: data.name,
        phone: data.phone,
        location: data.location,
      }

      saveToLocalStorage("foodra_user", updatedUser)
      setUser(updatedUser)
      setIsEditModalOpen(false)
      reset()

      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      })
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to update profile. Please try again.",
      })
    }
  }

  if (!user) {
    return null
  }

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
        <Card className="mb-8 p-6">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {user.avatar ? (
                  <Image src={user.avatar || "/placeholder.svg"} alt={user.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">{user.name}</h1>
                <div className="space-y-1 text-muted-foreground">
                  <p>{user.phone}</p>
                  <p>{user.location}</p>
                  {user.role && (
                    <span className="inline-block bg-[#118C4C]/10 text-[#118C4C] text-xs font-semibold px-2 py-1 rounded-full">
                      {user.role === "admin" ? "Admin" : "Farmer"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleEditProfile} variant="outline" className="gap-2 bg-transparent w-full">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span> <span>Profile</span>
                </Button>
                <Button onClick={handleSignOut} variant="outline" className="gap-2 bg-transparent text-red-600 w-full">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Summary Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Your Activity</h2>
          <FarmerProfileSummary user={user} />
        </div>

        {/* Account Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium text-foreground">Farmer Account</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium text-foreground">January 2025</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Authentication</span>
                <span className="font-medium text-foreground">Privy (Simulated)</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a demo application. In production, user authentication would be handled
                by Privy with secure session management. To switch users or test different scenarios, clear your
                browser's localStorage.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
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

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white w-full">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1 w-full">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
