"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BadgeCheck, Edit, LogOut, Share2, UserIcon, Wallet, Copy, Check, MapPin, CalendarDays, ShieldCheck, Camera, Loader2, Package, ShoppingBag, LayoutGrid, List, Settings } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/FormInput"
import { PhoneInput } from "@/components/PhoneInput"
import { useToast } from "@/lib/toast"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import { profileUpdateSchema, type ProfileUpdateFormData } from "@/lib/schemas"
import { usePrivy } from "@privy-io/react-auth"
import withAuth from "@/components/withAuth"
import { SignOutModal } from "@/components/SignOutModal"
import { ProfileCompletionModal } from "@/components/ProfileCompletionModal"
import { useUser } from "@/lib/useUser"
import { ProductCard } from "@/components/ProductCard"
import { OrderCard, ORDER_STATUS } from "@/components/OrderCard"
import type { Product, Order, User } from "@/lib/types"
import ThemeToggle from "@/components/ThemeToggle"
import { authFetch } from "@/lib/authFetch"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { MembershipBadge } from "@/components/MembershipBadge"
import { computeMembership } from "@/lib/membership"
import { ProfilePageSkeleton, OrderCardSkeleton } from "@/components/Skeleton"
type Tab = "orders" | "wishlist" | "membership" | "settings"
const ORDER_TABS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"] as const
type OTab = typeof ORDER_TABS[number]

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
  const [orderTab, setOrderTab] = useState<OTab>("All")
  const [orderLayout, setOrderLayout] = useState<"list" | "compact">("list")
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [membership, setMembership] = useState<any>(null)
  const [loadingTab, setLoadingTab] = useState(true)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
  })

  useEffect(() => {
    if (user) {
      setValue("name", user.name || "")
      setValue("phone", user.phone || "")
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

  // Fetch membership data once when user is available
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/users/${user.id}/membership`)
      .then(r => r.json())
      .then(d => {
        // Only use the response if it's a valid MembershipScore (has a tier field)
        if (d && d.tier && d.breakdown) setMembership(d)
      })
      .catch(() => {})
  }, [user?.id])
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
      const ok = await updateUser({ name: data.name, phone: data.phone, role: "buyer" })
      if (!ok) throw new Error()
      setIsEditModalOpen(false)
      reset()
      toast.success("Profile updated!")
    } catch {
      toast.error("Failed to update profile.")
    }
  }

  if (isLoading || !user) {
    return <ProfilePageSkeleton />
  }

  const displayName = getDisplayName()
  const createdAtDate = user.createdAt ? new Date(user.createdAt) : new Date()
  const joinedDate = isNaN(createdAtDate.getTime()) ? "Unknown" : createdAtDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  // Use server-side membership data if available, otherwise compute client-side
  const membershipScore = (membership && membership.tier && membership.breakdown)
    ? membership
    : computeMembership({
        hasName: !!user.name,
        hasPhone: !!user.phone,
        hasLocation: !!user.location,
        hasAvatar: !!user.avatar,
        createdAt: user.createdAt,
        ordersCount: 0,
        hasDisputes: false,
        isVerified: !!user.isVerified,
      })

  const TABS: { key: Tab; label: string }[] = [
    { key: "orders", label: "Orders" },
    { key: "wishlist", label: "Wishlist" },
    { key: "membership", label: "Membership" },
    { key: "settings", label: "Settings" },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <ShareOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        title={`${displayName} on Foodra`} text={`Check out ${displayName}'s Foodra profile.`}
        url={typeof window !== "undefined" ? `${window.location.origin}/users/${user.id}` : ""} />
      <SignOutModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} logout={logout} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Cover + Avatar — matches /users/[id] layout */}
        <div className="relative">
          <div className="relative h-36 sm:h-48 w-full rounded-b-3xl overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/5" />
          </div>

          {/* Avatar */}
          <div className="absolute left-4 sm:left-6 -bottom-12">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
                {user.avatar
                  ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={displayName} />
                  : <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-3xl font-bold">{(displayName[0] || "U").toUpperCase()}</div>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background flex items-center justify-center shadow ${user.isVerified ? "bg-[#118C4C]" : "bg-muted"}`}>
                {user.isVerified ? <BadgeCheck className="h-4 w-4 text-white" /> : <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </div>
          </div>

          {/* Top-right actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <button onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-black/30 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
          </div>
        </div>

        {/* Name + identity — matches /users/[id] layout */}
        <div className="px-4 sm:px-6 mt-16">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight truncate">{displayName}</h1>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 flex-shrink-0">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                {user.role !== "admin" && (
                  <span className="font-semibold text-foreground/80 capitalize">
                    {user.role === "owner" ? "Platform Vendor" : user.role || "Member"}
                  </span>
                )}
                {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {joinedDate}</span>
              </div>
            </div>
            <MembershipBadge score={membershipScore} />
          </div>

          {/* Edit / Admin / Logout actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={() => { setValue("name", user.name || displayName); setValue("phone", user.phone || ""); setIsEditModalOpen(true) }}
              size="sm" className="rounded-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
            {(user.role === "admin" || user.role === "owner") && (
              <a href="/admin">
                <Button size="sm" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Admin
                </Button>
              </a>
            )}
            <Button onClick={() => setIsSignOutModalOpen(true)} variant="outline" size="sm" className="rounded-full text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>

          {/* Wallet */}
          {user.wallet && (
            <div className="mt-3">
              <button onClick={() => setShowWallet(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Wallet className="h-3.5 w-3.5 text-[#118C4C]" />
                {showWallet ? <span className="font-mono">{user.wallet.slice(0, 6)}…{user.wallet.slice(-4)}</span> : "Show wallet"}
              </button>
              {showWallet && (
                <div className="mt-2 flex items-center gap-2 bg-muted rounded-xl px-3 py-2 text-xs font-mono">
                  <span className="flex-1 truncate">{user.wallet}</span>
                  <button onClick={() => { navigator.clipboard.writeText(user.wallet!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                    {copied ? <Check className="h-3.5 w-3.5 text-[#118C4C]" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              )}
            </div>
          )}
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
            <div className="space-y-3">{[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}</div>
          ) : tab === "orders" ? (
            orders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No orders yet</p>
                <a href="/marketplace" className="mt-3 inline-block text-xs text-[#118C4C] hover:underline">Browse marketplace →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Order filter + layout toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 scrollbar-none">
                    {ORDER_TABS.map(t => {
                      const count = t === "All" ? orders.length : orders.filter(o => o.status === t).length
                      const active = orderTab === t
                      const s = t !== "All" ? ORDER_STATUS[t] : null
                      return (
                        <button key={t} onClick={() => setOrderTab(t)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border flex-shrink-0
                            ${active ? "bg-[#118C4C] text-white border-[#118C4C]" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}>
                          {s && <span className={active ? "text-white/80" : s.text}>{s.icon}</span>}
                          {t}
                          {count > 0 && <span className={`text-[9px] px-1 rounded-full font-bold ${active ? "bg-white/20" : "bg-muted"}`}>{count}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={() => setOrderLayout(l => l === "list" ? "compact" : "list")}
                    className="flex-shrink-0 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
                    {orderLayout === "list" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                </div>
                {/* Order cards */}
                {(orderTab === "All" ? orders : orders.filter(o => o.status === orderTab)).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No {orderTab} orders.</p>
                ) : (
                  <div className="space-y-3">
                    {(orderTab === "All" ? orders : orders.filter((o: Order) => o.status === orderTab)).map((o: Order) => (
                      <OrderCard key={o.id} order={o} compact={orderLayout === "compact"} />
                    ))}
                  </div>
                )}
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
          ) : tab === "membership" ? (
            <div className="py-4">
              <MembershipBadge score={membershipScore} showProgress />
            </div>
          ) : (
            /* Settings tab */
            <div className="py-4 space-y-3">
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Appearance</p>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium">Language</span>
                    <LanguageSwitcher compact />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</p>
                </div>
                <div className="divide-y divide-border">
                  <a href="/wallet" className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Wallet</span>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </a>
                  {(user.role === "admin" || user.role === "owner") && (
                    <a href="/admin" className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">Admin Dashboard</span>
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-red-200 dark:border-red-900/40 overflow-hidden">
                <button
                  onClick={() => setIsSignOutModalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-500"
                >
                  <span className="text-sm font-medium">Sign Out</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
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
                  : <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-2xl font-bold">{(displayName[0] || "U").toUpperCase()}</div>
                }
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Click to change photo</p>
          </div>
          <FormInput label="Full Name" {...register("name")} error={errors.name?.message} placeholder="Your full name" required />
          <FormInput label="Email" value={getEmail()} placeholder="Your email" required readOnly />
          <PhoneInput
            value={watch("phone") || ""}
            onChange={v => setValue("phone", v, { shouldValidate: true })}
            error={errors.phone?.message}
            required
          />
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
