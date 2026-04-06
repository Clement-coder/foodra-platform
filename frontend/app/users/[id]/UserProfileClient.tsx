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
  X,
} from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ProductCard } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import Image from "next/image"
import { RatingSummary } from "@/components/RatingSummary"

interface UserProfileClientProps {
  user: User
  userProducts: Product[]
}

export default function UserProfileClient({ user, userProducts }: UserProfileClientProps) {
  const router = useRouter()
  const [showWallet, setShowWallet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isImageFullScreen, setIsImageFullScreen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'products' | 'activity' | 'ratings'>('details')
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

      {/* Full Screen Image Modal */}
      {isImageFullScreen && user.avatar && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsImageFullScreen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setIsImageFullScreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="relative w-full h-full max-w-3xl max-h-[90vh]">
            <Image
              src={user.avatar}
              alt={user.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}

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
              <div 
                className="w-16 h-16 rounded-full overflow-hidden border cursor-pointer hover:border-[#118C4C] transition-colors"
                onClick={() => user.avatar && setIsImageFullScreen(true)}
              >
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white">
                    <UserIcon />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h1 className="text-lg sm:text-xl font-bold truncate">{user.name}</h1>
                  <span className="inline-flex items-center rounded-full bg-[#118C4C]/10 text-[#118C4C] p-1 flex-shrink-0" title="Verified">
                    <BadgeCheck className="h-4 w-4" />
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

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-[#118C4C] border-b-2 border-[#118C4C]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'products'
                  ? 'text-[#118C4C] border-b-2 border-[#118C4C]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Products ({totalProducts})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'text-[#118C4C] border-b-2 border-[#118C4C]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('ratings')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'ratings'
                  ? 'text-[#118C4C] border-b-2 border-[#118C4C]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ratings
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        )}

        {activeTab === 'products' && (
          <div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No products listed yet.</p>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
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
        )}

        {activeTab === 'ratings' && (
          <Card>
            <CardContent className="p-6">
              <RatingSummary farmerId={user.id} detail />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
