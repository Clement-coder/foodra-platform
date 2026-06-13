"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Share2, MapPin, CalendarDays, ShieldCheck, Package,
  Wallet, BadgeCheck, ExternalLink, Sprout, Phone, ShoppingBag, Mail,
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
  const isFoodra = user.role === "admin" || user.role === "owner"
  const shortWallet = user.wallet ? `${user.wallet.slice(0, 6)}…${user.wallet.slice(-4)}` : null

  const stats = [
    { label: "Products", value: products.length, icon: <Package className="h-4 w-4" /> },
    { label: isFoodra ? "Listed" : "Orders", value: ordersCount, icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Since", value: new Date(user.createdAt).getFullYear(), icon: <CalendarDays className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-xl mx-auto pb-16">
      <ShareOptionsModal
        isOpen={shareOpen} onClose={() => setShareOpen(false)}
        title={`${user.name} on Foodra`}
        text={`Check out ${user.name}'s profile on Foodra.`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Hero ── */}
        <div className="relative">
          <div className="h-48 sm:h-56 w-full overflow-hidden bg-gradient-to-br from-[#063d1e] via-[#118C4C] to-[#20c46a] relative">
            {/* Decorative shapes */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-8 right-1/3 w-20 h-20 rounded-full bg-white/5" />
            {/* Foodra brand strip */}
            {isFoodra && (
              <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-gradient-to-t from-black/40 to-transparent flex items-center gap-2">
                <Sprout className="h-4 w-4 text-white/80" />
                <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Official Foodra Vendor</span>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="absolute left-5 -bottom-16">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-[5px] border-background overflow-hidden bg-muted shadow-2xl">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#118C4C] to-[#063d1e] text-white text-5xl font-black">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                )}
              </div>
              {/* Badge */}
              <div className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 border-background flex items-center justify-center shadow-lg
                ${user.isVerified || isFoodra ? "bg-[#118C4C]" : "bg-muted"}`}>
                {user.isVerified || isFoodra
                  ? <BadgeCheck className="h-5 w-5 text-white" />
                  : <ShieldCheck className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </div>

          {/* Nav */}
          <button onClick={() => router.back()}
            className="absolute top-3 left-3 flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-black/30 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <button onClick={() => setShareOpen(true)}
            className="absolute top-3 right-3 flex items-center gap-1.5 text-white/90 hover:text-white text-sm bg-black/30 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>

        {/* ── Identity ── */}
        <div className="px-5 mt-20">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight truncate">{user.name}</h1>
                {isFoodra && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#118C4C] text-white flex-shrink-0">
                    <Sprout className="h-3 w-3" /> Official
                  </span>
                )}
                {user.isVerified && !isFoodra && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 flex-shrink-0">
                    <ShieldCheck className="h-3 w-3" /> Verified Farmer
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground/80 capitalize">
                  {isFoodra ? "Platform Vendor" : user.role || "Member"}
                </span>
                {user.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>
                )}
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Joined {joinedDate}</span>
                {user.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>
                )}
              </div>
            </div>

            <MembershipBadge score={membership} />
          </div>

          {/* Wallet — hidden for official Foodra accounts */}
          {shortWallet && !isFoodra && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/70 border border-border text-xs font-mono text-muted-foreground">
              <Wallet className="h-3.5 w-3.5 text-[#118C4C] flex-shrink-0" />
              <span>{shortWallet}</span>
              <a href={`https://basescan.org/address/${user.wallet}`} target="_blank" rel="noopener noreferrer"
                className="text-[#118C4C] hover:opacity-70 transition-opacity">
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 px-5 mt-5">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5 p-3.5 rounded-2xl bg-card border border-border shadow-sm text-center">
              <span className="text-[#118C4C]">{s.icon}</span>
              <span className="text-xl font-black text-foreground">{s.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── About Foodra card ── */}
        {isFoodra && (
          <div className="mx-5 mt-5 p-4 rounded-2xl border border-[#118C4C]/25 bg-gradient-to-br from-[#118C4C]/8 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="h-4 w-4 text-[#118C4C]" />
              <span className="text-sm font-bold text-[#118C4C]">About Foodra</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Foodra is Nigeria's leading AgriTech marketplace. All products listed here are curated and managed directly by the Foodra team — ensuring quality, fair pricing, and reliable delivery for buyers and farmers alike.
            </p>
          </div>
        )}

        {/* ── Contact info (Foodra only) ── */}
        {isFoodra && (
          <div className="mx-5 mt-4 grid grid-cols-1 gap-3">
            <a href="mailto:support@foodramarket.com"
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-[#118C4C]/40 hover:bg-[#118C4C]/5 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-[#118C4C]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Support Email</p>
                <p className="text-sm font-semibold text-foreground truncate">support@foodramarket.com</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
            <a href="tel:+2348003663727"
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-[#118C4C]/40 hover:bg-[#118C4C]/5 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-4 w-4 text-[#118C4C]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Support Phone</p>
                <p className="text-sm font-semibold text-foreground">+234 800 FOODRA</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card">
              <div className="w-9 h-9 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-[#118C4C]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-semibold text-foreground">Benue State, Nigeria</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Products grid ── */}
        {products.length > 0 && (
          <div className="px-5 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-[#118C4C]" />
                {isFoodra ? "Foodra Products" : "Listings"}
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{products.length}</span>
              </h2>
              <Link href="/marketplace" className="text-xs text-[#118C4C] hover:underline flex items-center gap-1 font-medium">
                See all <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 6).map((p) => (
                <Link key={p.id} href={`/marketplace/${p.id}`}>
                  <div className="group rounded-2xl border border-border overflow-hidden hover:border-[#118C4C]/50 hover:shadow-lg transition-all bg-card">
                    <div className="relative h-32 bg-muted overflow-hidden">
                      {p.image ? (
                        <Image src={p.image} alt={p.productName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/50 text-white backdrop-blur-sm">
                          {p.category}
                        </span>
                        {isFoodra && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#118C4C] text-white flex items-center gap-0.5">
                            <Sprout className="h-2.5 w-2.5" /> Foodra
                          </span>
                        )}
                      </div>
                      {p.quantity === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Out of stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm truncate leading-tight">{p.productName}</p>
                      <p className="text-xs text-[#118C4C] font-bold mt-0.5">₦{Number(p.pricePerUnit).toLocaleString()}<span className="font-normal text-muted-foreground"> / {p.unit}</span></p>
                      {p.location && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <MapPin className="h-2.5 w-2.5 flex-shrink-0" />{p.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {products.length > 6 && (
              <Link href="/marketplace"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm text-[#118C4C] hover:underline font-semibold py-2.5 rounded-xl border border-[#118C4C]/25 bg-[#118C4C]/5 hover:bg-[#118C4C]/10 transition-colors">
                View {products.length - 6} more products <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}

      </motion.div>
    </div>
  )
}
