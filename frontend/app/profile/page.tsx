"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  BadgeCheck,
  Edit,
  LogOut,
  Share2,
  UserIcon,
  Wallet,
  Copy,
  Check,
  ShoppingBag,
  Activity,
  CalendarDays,
  Package,
  TrendingUp,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { FormInput } from "@/components/FormInput"
import { FormSelect } from "@/components/FormSelector"
import { NotificationDiv } from "@/components/NotificationDiv"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/schemas"
import { usePrivy } from "@privy-io/react-auth"
import withAuth from "@/components/withAuth"
import { SignOutModal } from "@/components/SignOutModal"
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal"
import { useUser } from "@/lib/useUser"
import { supabase } from "@/lib/supabase"
import { ProductCard } from "@/components/ProductCard"
import type { Product } from "@/lib/types"

function ProfilePage() {
  const { currentUser: user, isLoading, updateUser } = useUser()
  const { logout, user: privyUser } = usePrivy()
  const privyUserAny = privyUser as any
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null)
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  })

  const getUserDisplayName = () => {
    if (!privyUser && !user) return "User"
    return (
      privyUserAny?.google?.name ||
      privyUserAny?.github?.name ||
      privyUserAny?.twitter?.name ||
      privyUserAny?.discord?.username ||
      privyUserAny?.farcaster?.username ||
      user?.name ||
      "User"
    )
  }

  const getUserEmail = () => {
    return (
      privyUserAny?.google?.email ||
      privyUserAny?.github?.email ||
      privyUser?.email?.address ||
      user?.email ||
      "N/A"
    )
  }

  useEffect(() => {
    if (user) {
      setValue("name", user.name || "Unnamed User")
      setValue("phone", user.phone || "")
      setValue("location", user.location || "")
      setValue("accountType", user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer")
    }
  }, [user, setValue])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user?.id) return
      setLoadingProducts(true)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("farmer_id", user.id)
        .eq("is_available", true)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setUserProducts(
          data.map((p) => ({
            id: p.id,
            productName: p.name,
            category: p.category,
            quantity: p.quantity,
            pricePerUnit: p.price,
            description: p.description || "",
            image: p.image_url || "",
            location: p.location || "",
            farmerId: p.farmer_id,
            farmerName: user.name,
            farmerAvatar: user.avatar,
            createdAt: p.created_at,
          }))
        )
      }
      setLoadingProducts(false)
    }
    fetchProducts()
  }, [user])

  const handleSignOut = () => setIsSignOutModalOpen(true)

  const handleEditProfile = () => {
    if (!user) return
    setValue("name", user.name || getUserDisplayName())
    setValue("phone", user.phone || "")
    setValue("location", user.location || "")
    setValue("accountType", user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer")
    setIsEditModalOpen(true)
  }

  const handleShareProfile = () => setIsShareModalOpen(true)

  const handleCopy = () => {
    if (!user?.wallet) return
    navigator.clipboard.writeText(user.wallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = async (data: ProfileUpdateFormData) => {
    if (!user) return

    try {
      const ok = await updateUser({
        phone: data.phone,
        location: data.location,
        role: data.accountType === "Farmer" ? "farmer" : "buyer",
      })

      if (!ok) throw new Error("Update failed")

      setIsEditModalOpen(false)
      reset()

      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      })

      setTimeout(() => setNotification(null), 3000)
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
  const totalProducts = userProducts.length
  const totalUnits = userProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const avgPrice =
    totalProducts > 0
      ? userProducts.reduce((sum, p) => sum + Number(p.pricePerUnit || 0), 0) / totalProducts
      : 0
  const categories = Array.from(new Set(userProducts.map((p) => p.category).filter(Boolean)))

  const recentActivities = [
    {
      id: 1,
      activity: "Joined Foodra",
      date: new Date(user.createdAt).toDateString(),
    },
    ...(userProducts.length
      ? [
          {
            id: 2,
            activity: `Listed ${userProducts.length} product(s)`,
            date: new Date(userProducts[0].createdAt).toDateString(),
          },
        ]
      : []),
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${displayName} on Foodra`}
        text={`Check out ${displayName}'s Foodra profile.`}
        url={typeof window !== "undefined" ? `${window.location.origin}/users/${user.id}` : ""}
      />
      <SignOutModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} logout={logout} />
      {notification && (
        <NotificationDiv
          type={notification.type}
          message={notification.message}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <span>{displayName}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-xs px-2.5 py-1 font-semibold">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3">
                    <p className="text-xs font-semibold text-sky-700 mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-800 break-all">{userEmail}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Location</p>
                    <p className="text-sm font-medium text-slate-800">{user.location || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 px-4 py-3">
                    <p className="text-xs font-semibold text-violet-700 mb-1 flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Account Type
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Joined
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={handleEditProfile} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button onClick={handleShareProfile} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={() => setShowWallet(!showWallet)} variant="outline" disabled={!user.wallet}>
                  <Wallet className="h-4 w-4 mr-2" />
                  {showWallet ? "Hide Wallet" : "Show Wallet"}
                </Button>
                <Button onClick={handleSignOut} variant="outline" className="text-red-600 hover:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {showWallet && user.wallet && (
              <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between">
                <p className="break-all">{user.wallet}</p>
                <Button onClick={handleCopy} size="icon">
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex gap-2">
              <ShoppingBag /> Products
            </h2>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="text-xs px-3 py-1 rounded-full bg-[#118C4C]/10 text-[#118C4C] font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {loadingProducts ? (
              <p className="text-muted-foreground">Loading products...</p>
            ) : userProducts.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No products listed yet.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex gap-2">
              <Activity /> Activity
            </h2>

            <div className="grid grid-cols-1 gap-3 mb-4">
              <Card>
                <CardContent className="py-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Total Listings
                  </span>
                  <span className="font-semibold">{totalProducts}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Units Available
                  </span>
                  <span className="font-semibold">{totalUnits}</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Average Price
                  </span>
                  <span className="font-semibold">
                    ₦{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent>
                <ul className="space-y-4">
                  {recentActivities.map((a) => (
                    <li key={a.id}>
                      <p className="font-medium">{a.activity}</p>
                      <p className="text-sm text-muted-foreground">{a.date}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      <ProfileCompletionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Full Name"
            {...register("name")}
            error={errors.name?.message}
            placeholder="Your full name"
            required
            readOnly
          />

          <FormInput label="Email" value={userEmail} placeholder="Your email address" required readOnly />

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
            placeholder="Your location"
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

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </ProfileCompletionModal>
    </div>
  )
}

export default withAuth(ProfilePage)
