"use client"

import { useState, useEffect, useRef } from "react"
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
  ShieldCheck,
  Camera,
  Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal"
import { FormInput } from "@/components/FormInput"
import { FormSelect } from "@/components/FormSelector"
import { useToast } from "@/lib/toast"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/schemas"
import { usePrivy } from "@privy-io/react-auth"
import withAuth from "@/components/withAuth"
import { SignOutModal } from "@/components/SignOutModal"
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal"
import { useUser } from "@/lib/useUser"
import { RatingSummary } from "@/components/RatingSummary"
import { supabase } from "@/lib/supabase"
import { ProductCard } from "@/components/ProductCard"
import type { Product } from "@/lib/types"
import { calculateProfileCompletion } from "@/lib/profileUtils"
import { africanCountries } from "@/lib/countries"
import { formatTimeAgo } from "@/lib/timeUtils"
import ThemeToggle from "@/components/ThemeToggle"

function ProfilePage() {
  const { currentUser: user, isLoading, updateUser } = useUser()
  const { logout, user: privyUser } = usePrivy()
  const { toast } = useToast()
  const privyUserAny = privyUser as any
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setAvatarUploading(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch("/api/users/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, userId: user.id }),
      })
      if (!res.ok) throw new Error("Upload failed")
      const { avatarUrl } = await res.json()
      // Update user record with cache-busted URL so UI refreshes immediately
      const cacheBusted = `${avatarUrl}?t=${Date.now()}`
      await fetch("/api/users/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privyId: privyUser?.id, avatar_url: cacheBusted }),
      })
      // Force re-sync to update currentUser state
      window.location.reload()
      toast.success("Avatar updated!")
    } catch {
      toast.error("Failed to upload avatar. Please try again.")
    } finally {
      setAvatarUploading(false)
      e.target.value = ""
    }
  }
  const [copied, setCopied] = useState(false)
  const [userProducts, setUserProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  })

  const locationValue = watch("location")

  useEffect(() => {
    if (locationValue && locationValue !== selectedCountry) {
      setSelectedCountry(locationValue)
      const country = africanCountries.find(c => c.name === locationValue)
      if (country) {
        const currentPhone = watch("phone") || ""
        // Only set dial code if phone is empty or doesn't start with +
        if (!currentPhone || !currentPhone.startsWith("+")) {
          setValue("phone", country.dialCode)
        }
      }
    }
  }, [locationValue, selectedCountry, setValue, watch])

  const getUserDisplayName = () => {
    if (!privyUser && !user) return "User"
    return (
      privyUserAny?.google?.name ||
      privyUser?.email?.address?.split("@")[0] ||
      user?.name ||
      "User"
    )
  }

  const getUserEmail = () => {
    return (
      privyUserAny?.google?.email ||
      privyUser?.email?.address ||
      user?.email ||
      "N/A"
    )
  }

  const getSignUpMethod = () => {
    if (privyUserAny?.google) return "Google"
    if (privyUser?.email) return "Email"
    return "Unknown"
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
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("farmer_id", user.id)
          .order("created_at", { ascending: false })

        console.log('Profile products fetch:', { userId: user.id, data, error });

        if (!error && data) {
          setUserProducts(
            data.map((p) => ({
              id: p.id,
              productName: p.name,
              category: p.category,
              quantity: p.quantity,
              unit: p.unit || 'unit',
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
      } catch (error) {
        console.error('Error fetching user products:', error);
      } finally {
        setLoadingProducts(false)
      }
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
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
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
  const profileCompletion = calculateProfileCompletion(user)
  const isProfileComplete = profileCompletion === 100

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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-16 h-16 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-16 h-16 rounded-full overflow-hidden border">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                        <UserIcon />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="text-lg sm:text-xl font-bold truncate">{displayName}</h1>
                    <span className="inline-flex items-center rounded-full bg-[#118C4C]/10 text-[#118C4C] p-1 flex-shrink-0" title="Verified">
                      <BadgeCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                      <p className="text-xs font-semibold text-sky-700 mb-1">Email</p>
                      <p className="text-sm font-medium text-foreground break-all">{userEmail}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Location</p>
                      <p className="text-sm font-medium text-foreground">{user.location || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                      <p className="text-xs font-semibold text-violet-700 mb-1 flex items-center gap-1">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Account Type
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                      <p className="text-xs font-semibold text-rose-700 mb-1">Sign Up Method</p>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {getSignUpMethod() === "Google" && (
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                        )}
                        {getSignUpMethod()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Joined
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons — always in a row below the info cards */}
              <div className="flex flex-row flex-wrap gap-2 pt-1 justify-start">
                <Button onClick={handleEditProfile} size="sm" className="bg-[#118C4C] hover:bg-[#0d6b3a] text-white">
                  <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{isProfileComplete ? "Edit" : `Complete (${profileCompletion}%)`}</span>
                </Button>
                <Button onClick={handleShareProfile} variant="outline" size="sm">
                  <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button onClick={() => setShowWallet(!showWallet)} variant="outline" size="sm" disabled={!user.wallet}>
                  <Wallet className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{showWallet ? "Hide" : "Show"}</span>
                </Button>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
                <ThemeToggle />
                {user.role === "admin" && (
                  <a href="/admin">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                      <ShieldCheck className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Admin Panel</span>
                    </Button>
                  </a>
                )}
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

            {/* My Ratings */}
            {user?.id && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#118C4C]" />
                    My Ratings
                  </h3>
                  <RatingSummary farmerId={user.id} detail />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>

      <ProfileCompletionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Avatar upload inside edit modal */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#118C4C]">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-2xl font-bold">
                    {(user?.name || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Click photo to change avatar</p>
          </div>
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

          <FormSelect
            label="Country"
            {...register("location")}
            error={errors.location?.message}
            options={africanCountries.map(country => ({
              value: country.name,
              label: country.name
            }))}
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
