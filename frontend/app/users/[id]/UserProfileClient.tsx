"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Product } from "@/lib/types"
import { UserIcon, MapPin, CalendarDays, BadgeCheck, Share2, ArrowLeft, ShoppingBag, Star } from "lucide-react"
import { motion } from "framer-motion"
import { ProductCard } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import { RatingSummary } from "@/components/RatingSummary"

interface UserProfileClientProps {
  user: User
  userProducts: Product[]
}

type Tab = "products" | "ratings"

export default function UserProfileClient({ user, userProducts }: UserProfileClientProps) {
  const router = useRouter()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("products")

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const categories = Array.from(new Set(userProducts.map(p => p.category).filter(Boolean)))

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <ShareOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        title={`${user.name} on Foodra`} text={`Check out ${user.name}'s Foodra profile.`}
        url={typeof window !== "undefined" ? window.location.href : ""} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Cover */}
        <div className="relative">
          <div className="h-36 sm:h-48 w-full bg-gradient-to-br from-[#118C4C] via-[#0d7a40] to-lime-500 rounded-b-3xl overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>

          {/* Avatar */}
          <div className="absolute left-4 sm:left-6 -bottom-14">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={user.name} />
                : <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-3xl font-bold">{(user.name || "U")[0].toUpperCase()}</div>
              }
            </div>
          </div>

          {/* Back button */}
          <button onClick={() => router.back()} className="absolute top-3 left-3 flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 px-4 pt-3 pb-1">
          <Button onClick={() => setIsShareModalOpen(true)} variant="outline" size="sm" className="rounded-full gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        </div>

        {/* Name + meta */}
        <div className="px-4 sm:px-6 mt-10">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#118C4C]/10 text-[#118C4C] px-2 py-0.5 rounded-full font-medium">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{user.role || "user"}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {joinedDate}</span>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{userProducts.length}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{userProducts.reduce((s, p) => s + p.quantity, 0)}</p>
              <p className="text-xs text-muted-foreground">Units</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-5 mx-4" />

        {/* Tabs */}
        <div className="flex border-b border-border mt-1 px-4">
          {(["products", "ratings"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${tab === t ? "border-[#118C4C] text-[#118C4C]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "products" ? `Products (${userProducts.length})` : "Ratings"}
            </button>
          ))}
        </div>

        <div className="px-4 pt-5">
          {tab === "products" ? (
            userProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No products listed yet</p>
              </div>
            ) : (
              <>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {categories.map(c => (
                      <span key={c} className="text-xs px-3 py-1 rounded-full bg-[#118C4C]/10 text-[#118C4C] font-medium">{c}</span>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {userProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </>
            )
          ) : (
            <div className="py-2">
              <RatingSummary farmerId={user.id} detail />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
