"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/types"
import { ArrowLeft, CalendarDays, Share2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ShareOptionsModal } from "@/components/ShareOptionsModal"
import { MembershipBadge } from "@/components/MembershipBadge"
import type { MembershipScore } from "@/lib/membership"

interface UserProfileClientProps {
  user: User
  membership: MembershipScore
}

export default function UserProfileClient({ user, membership }: UserProfileClientProps) {
  const router = useRouter()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="max-w-md mx-auto pb-12">
      <ShareOptionsModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        title={`${user.name} on Foodra`} text={`Check out ${user.name}'s Foodra profile.`}
        url={typeof window !== "undefined" ? window.location.href : ""} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Cover */}
        <div className="relative">
          <div className="relative h-36 sm:h-44 w-full rounded-3xl overflow-hidden bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35] shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/5" />
          </div>

          {/* Avatar */}
          <div className="absolute left-4 sm:left-6 -bottom-12">
            <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={user.name} />
                : <div className="w-full h-full flex items-center justify-center bg-[#118C4C] text-white text-3xl font-bold">{(user.name || "U")[0].toUpperCase()}</div>
              }
            </div>
          </div>

          {/* Back */}
          <button onClick={() => router.back()} className="absolute top-3 left-3 flex items-center gap-1.5 text-white/80 hover:text-white text-sm bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>

        {/* Share button */}
        <div className="flex justify-end px-4 pt-3 pb-1">
          <Button onClick={() => setIsShareModalOpen(true)} variant="outline" size="sm" className="rounded-full gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        {/* Info */}
        <div className="px-4 sm:px-6 mt-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            <MembershipBadge score={membership} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span className="capitalize">{user.role || "member"}</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Member since {joinedDate}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
