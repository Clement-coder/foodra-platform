"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BadgeCheck, Edit, LogOut, Share2, UserIcon, Wallet, Copy, Check, MapPin, CalendarDays, ShieldCheck, Camera, Loader2, Package, ShoppingBag } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
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
import ThemeToggle from "@/components/ThemeToggle"
import { authFetch } from "@/lib/authFetch"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { MembershipBadge } from "@/components/MembershipBadge"
import { computeMembership } from "@/lib/membership"

type Tab = "orders" | "wishlist" | "ratings"

function ProfilePage() {
  const { currentUser: user, isLoading, updateUser } = useUser()
  const { logout, user: privyUser, getAccessToken } = usePrivy()
  const { toast } = useToast()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [showWallet, setShowWallet] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab>("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [loadingTab, setLoadingTab] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  })

  const locationValue = watch("location")
  const [selectedCountry, setSelectedCountry] = useState("")
  useEffect(() => {
    if (locationValue && locationValue !== selectedCountry) {
      setSelectedCountry(locationValue)
      const country = africanCountries.find(c => c.name === locationValue)
      if (country) {
        const currentPhone = watch("phone") || ""
        if (!currentPhone || !currentPhone.startsWith("+")) setValue("phone", country.dialCode)
      }
    }
  }, [locationValue, selectedCountry, setValue, watch])

  useEffect(() => {
    if (user) {
      setValue("name", user.name || "")
      setValue("phone", user.phone || "")
      setValue("location", user.location || "")
      setValue("accountType", user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer")
    }
  }, [user, setValue])

  // Fetch tab data
  useEffect(() => {
    if (!user?.id) return
    setLoadingTab(true)
    if (tab === "orders") {
      authFetch(getAccessToken, `/api/orders?userId=${user.id}`)
        .then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingTab(false))
    } else if (tab === "wishlist") {
      fetch(`/api/wishlist?userId=${user.id}`)
        .then(r => r.json()).then(d => setWishlist(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoadingTab(false))
    } else {
      setLoadingTab(false)
    }
  }, [tab, user?.id])
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
      const res = await authFetch(getAccessToken, "/api/users/avatar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      })
      if (!res.ok) throw new Error()
      const { avatarUrl } = await res.json()
      await authFetch(getAccessToken, "/api/users/sync", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: `${avatarUrl}?t=${Date.now()}` }),
      })
      window.location.reload()
    } catch {
      toast.error("Failed to upload avatar.")
    } finally {
      setAvatarUploading(false)
      e.target.value = ""
    }
  }

  const getDisplayName = () => {
    const linked = privyUser?.linkedAccounts?.find((a: any) => a.type === "google_oauth") as any
    return linked?.name || privyUser?.email?.address?.split("@")[0] || user?.name || "User"
  }

  const getEmail = () => {
    const linked = privyUser?.linkedAccounts?.find((a: any) => a.type === "google_oauth") as any
    return linked?.email || privyUser?.email?.address || user?.email || ""
  }

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      const ok = await updateUser({ phone: data.phone, location: data.location, role: data.accountType === "Farmer" ? "farmer" : "buyer" })
      if (!ok) throw new Error()
      setIsEditModalOpen(false)
      reset()
      toast.success("Profile updated!")
    } catch {
      toast.error("Failed to update profile.")
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#118C4C]" />
      </div>
    )
  }

  const displayName = getDisplayName()
  const profileCompletion = calculateProfileCompletion(user)
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const membership = computeMembership({
    hasName: !!user.name,
    hasPhone: !!user.phone,
    hasLocation: !!user.location,
    hasAvatar: !!user.avatar,
    createdAt: user.createdAt,
    ordersCount: orders.length,
    hasDisputes: false, // disputes not fetched client-side; defaults to clean
    isVerified: !!user.isVerified,
  })

  const TABS: { key: Tab; label: string }[] = [
    { key: "orders", label: "Orders" },
    { key: "wishlist", label: "Wishlist" },
    { key: "ratings", label: "Ratings" },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <ShareOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        title={`${displayName} on Foodra`} text={`Check out ${displayName}'s Foodra profile.`}
        url={typeof window !== "undefined" ? `${window.location.origin}/users/${user.id}` : ""} />
      <SignOutModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} logout={logout} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Cover + Avatar */}
        <div className="relative">
          {/* Cover — matches wallet card style */}
          <div className="relative h-36 sm:h-48 w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/5" />
          </div>

          {/* Avatar */}
          <div className="absolute left-4 sm:left-6 -bottom-14">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
                {user.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={displayName} />
                  : <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-3xl font-bold">{displayName[0].toUpperCase()}</div>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Top-right actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex justify-end gap-2 px-4 pt-3 pb-1">
          <Button onClick={() => setIsShareModalOpen(true)} variant="outline" size="sm" className="rounded-full gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button onClick={() => { setValue("name", user.name || displayName); setValue("phone", user.phone || ""); setValue("location", user.location || ""); setValue("accountType", user.role === "farmer" || user.role === "admin" ? "Farmer" : "Buyer"); setIsEditModalOpen(true) }}
            size="sm" className="rounded-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5">
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{profileCompletion < 100 ? `Complete (${profileCompletion}%)` : "Edit Profile"}</span>
          </Button>
          {user.role === "admin" && (
            <a href="/admin">
              <Button size="sm" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </a>
          )}
          <Button onClick={() => setIsSignOutModalOpen(true)} variant="outline" size="sm" className="rounded-full text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Name + bio */}
        <div className="px-4 sm:px-6 mt-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#118C4C]/10 text-[#118C4C] px-2 py-0.5 rounded-full font-medium">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{user.role || "user"}</span>
            <MembershipBadge score={membership} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {joinedDate}</span>
          </div>

          {/* Membership progress — own profile only */}
          <div className="mt-4 p-4 rounded-2xl border border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Membership Progress</p>
            <MembershipBadge score={membership} showProgress />
          </div>

          {/* Wallet */}
          <div className="mt-3">
            {user.wallet ? (
              <button onClick={() => setShowWallet(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Wallet className="h-3.5 w-3.5 text-[#118C4C]" />
                {showWallet ? (
                  <span className="font-mono">{user.wallet.slice(0, 6)}…{user.wallet.slice(-4)}</span>
                ) : "Show wallet"}
              </button>
            ) : null}
            {showWallet && user.wallet && (
              <div className="mt-2 flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-xs font-mono">
                <span className="flex-1 truncate">{user.wallet}</span>
                <button onClick={() => { navigator.clipboard.writeText(user.wallet!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                  {copied ? <Check className="h-3.5 w-3.5 text-[#118C4C]" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mt-5 mx-4" />

        {/* Tabs */}
        <div className="flex border-b border-border mt-1 px-4">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.key ? "border-[#118C4C] text-[#118C4C]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-5">
          {loadingTab ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#118C4C]" /></div>
          ) : tab === "orders" ? (
            orders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No orders yet</p>
                <a href="/marketplace" className="mt-3 inline-block text-xs text-[#118C4C] hover:underline">Browse marketplace →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o: any) => (
                  <a key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-[#118C4C]/40 hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium">Order #{o.id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(o.created_at || o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#118C4C]">₦{(o.totalAmount || o.total_amount || 0).toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${o.status === "delivered" ? "bg-green-100 text-green-700" : o.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {o.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )
          ) : tab === "wishlist" ? (
            wishlist.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Your wishlist is empty</p>
                <a href="/marketplace" className="mt-3 inline-block text-xs text-[#118C4C] hover:underline">Browse marketplace →</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {wishlist.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          ) : (
            <div className="py-2">
              <RatingSummary farmerId={user.id} detail />
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit modal */}
      <ProfileCompletionModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#118C4C]">
                {user.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                  : <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-2xl font-bold">{displayName[0].toUpperCase()}</div>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Click to change photo</p>
          </div>
          <FormInput label="Full Name" {...register("name")} error={errors.name?.message} placeholder="Your full name" required readOnly />
          <FormInput label="Email" value={getEmail()} placeholder="Your email" required readOnly />
          <FormInput label="Phone Number" {...register("phone")} error={errors.phone?.message} placeholder="+234XXXXXXXXX" required />
          <FormSelect label="Country" {...register("location")} error={errors.location?.message}
            options={africanCountries.map(c => ({ value: c.name, label: c.name }))} required />
          <FormSelect label="Account Type" {...register("accountType")} error={errors.accountType?.message}
            options={[{ value: "Farmer", label: "Farmer" }, { value: "Buyer", label: "Buyer" }]} required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-[#118C4C] hover:bg-[#0d6d3a] text-white">Save Changes</Button>
          </div>
        </form>
      </ProfileCompletionModal>
    </div>
  )
}

export default withAuth(ProfilePage)
