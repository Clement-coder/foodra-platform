"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, Share2, MapPin, CalendarDays, ShieldCheck,
  BadgeCheck, Sprout, Phone, ShoppingBag, Mail,
} from "lucide-react"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import { MembershipBadge } from "@/components/MembershipBadge"
import type { MembershipScore } from "@/lib/membership"
import type { User, Product } from "@/lib/types"

interface Props {
  user: User
  membership: MembershipScore
  products: Product[]
  ordersCount: number
}

export default function UserProfileClient({ user, membership, products, ordersCount }: Props) {
  const router = useRouter()
  const [shareOpen, setShareOpen] = useState(false)

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const isFoodra = user.role === "owner"

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <ShareOptionsModal
        isOpen={shareOpen} onClose={() => setShareOpen(false)}
        title={`${user.name} on Foodra`}
        text={`Check out ${user.name}'s profile on Foodra.`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* Cover + Avatar */}
        <div className="relative">
          <div className="relative h-36 sm:h-48 w-full rounded-b-3xl overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/5" />
            {isFoodra && (
              <div className="absolute bottom-0 left-0 right-0 px-5 py-2 bg-gradient-to-t from-black/40 to-transparent flex items-center gap-2">
                <Sprout className="h-3.5 w-3.5 text-white/80" />
                <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Official Foodra Vendor</span>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="absolute left-4 sm:left-6 -bottom-12">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    className={`w-full h-full ${isFoodra ? "object-contain p-1" : "object-cover"}`}
                    referrerPolicy="no-referrer"
                    alt={user.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-3xl font-bold">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-background flex items-center justify-center shadow ${user.isVerified || isFoodra ? "bg-[#118C4C]" : "bg-muted"}`}>
                {user.isVerified || isFoodra
                  ? <BadgeCheck className="h-4 w-4 text-white" />
                  : <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          <button onClick={() => router.back()}
            className="absolute top-3 left-3 flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-black/30 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button onClick={() => setShareOpen(true)}
            className="absolute top-3 right-3 flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-black/30 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>

        {/* Identity */}
        <div className="px-4 sm:px-6 mt-16">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
                {isFoodra && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#118C4C] text-white flex-shrink-0">
                    <Sprout className="h-3 w-3" /> Official
                  </span>
                )}
                {user.isVerified && !isFoodra && (
                  <span className="inline-flex items-center gap-1 text-xs bg-[#118C4C]/10 text-[#118C4C] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {user.role !== "admin" && (
                  <span className="capitalize">{user.role === "owner" ? "Platform Vendor" : user.role || "Member"}</span>
                )}
                {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {joinedDate}</span>
              </div>
            </div>
            <MembershipBadge score={membership} />
          </div>

          {/* Foodra Tag placeholder — fetched client-side if needed */}
        </div>

        {/* Divider */}
        <div className="border-t border-border mt-5 mx-4" />

        {/* Tabs — single About tab for all users (Foodra is the sole merchant) */}
        <div className="flex border-b border-border mt-1 px-4">
          <button className="px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px border-[#118C4C] text-[#118C4C]">
            About
          </button>
        </div>

        {/* Tab content */}
        <div className="px-4 pt-5">
          {/* About tab */}
          <div className="space-y-4">
              {isFoodra ? (
                <>
                  <div className="p-4 rounded-2xl border border-[#118C4C]/25 bg-gradient-to-br from-[#118C4C]/8 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                      <Sprout className="h-4 w-4 text-[#118C4C]" />
                      <span className="text-sm font-bold text-[#118C4C]">About Foodra</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Foodra is Nigeria's leading AgriTech marketplace. All products listed here are curated and managed directly by the Foodra team — ensuring quality, fair pricing, and reliable delivery.
                    </p>
                  </div>
                  <a href="mailto:support@foodramarket.com" className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-[#118C4C]/40 hover:bg-[#118C4C]/5 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-[#118C4C]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Support Email</p>
                      <p className="text-sm font-semibold">support@foodramarket.com</p>
                    </div>
                  </a>
                  <a href="tel:+2348003663727" className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-[#118C4C]/40 hover:bg-[#118C4C]/5 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-[#118C4C]" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Support Phone</p>
                      <p className="text-sm font-semibold">+234 800 FOODRA</p>
                    </div>
                  </a>
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  {user.phone && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card">
                      <Phone className="h-4 w-4 text-[#118C4C]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-semibold">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card">
                    <ShoppingBag className="h-4 w-4 text-[#118C4C]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Orders placed</p>
                      <p className="font-semibold">{ordersCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card">
                    <CalendarDays className="h-4 w-4 text-[#118C4C]" />
                    <div>
                      <p className="text-xs text-muted-foreground">Member since</p>
                      <p className="font-semibold">{joinedDate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>

      </motion.div>
    </div>
  )
}
