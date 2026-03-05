"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Product } from "@/lib/types"
import {
  UserIcon,
  Wallet,
  Copy,
  Check,
  Share2,
  ShoppingBag,
  Activity,
  CalendarDays,
  BadgeCheck,
  Package,
  TrendingUp,
  ArrowLeft,
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ProductCard } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"

interface UserProfileClientProps {
  user: User
  userProducts: Product[]
}

export default function UserProfileClient({ user, userProducts }: UserProfileClientProps) {
  const router = useRouter()
  const [showWallet, setShowWallet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const totalProducts = userProducts.length
  const totalUnits = userProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const avgPrice =
    totalProducts > 0
      ? userProducts.reduce((sum, p) => sum + Number(p.pricePerUnit || 0), 0) / totalProducts
      : 0
  const categories = Array.from(new Set(userProducts.map((p) => p.category).filter(Boolean)))

  const handleCopy = () => {
    if (!user.wallet) return
    navigator.clipboard.writeText(user.wallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareProfile = () => setIsShareModalOpen(true)

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
      <Button 
        onClick={() => router.back()} 
        variant="ghost" 
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`${user.name} on Foodra`}
        text={`Check out ${user.name}'s Foodra profile.`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mb-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-xs px-2.5 py-1 font-semibold">
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-4 py-3">
                    <p className="text-xs font-semibold text-sky-700 mb-1">Email</p>
                    <p className="text-sm font-medium text-slate-800 break-all">{user.email || "N/A"}</p>
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

              <div className="flex items-center gap-2">
                <Button onClick={handleShareProfile} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
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

            {userProducts.length ? (
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
                  <span className="font-semibold">₦{avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
    </div>
  )
}
