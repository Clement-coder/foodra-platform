"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, BadgeCheck, Copy, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/types"
import { RatingSummary } from "@/components/RatingSummary"

interface UserCardProps {
  user: User
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()

  const shortWallet =
    user.wallet && user.wallet.length > 10
      ? `${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`
      : user.wallet

  const copyWallet = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(user.wallet)
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/users/${user.id}`)}
      className="group cursor-pointer rounded-2xl border border-[#118C4C]/15 bg-white/90 backdrop-blur p-5 shadow-sm hover:shadow-xl hover:border-[#118C4C]/35 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#118C4C]/10 text-[#118C4C] text-[11px] px-2.5 py-1 font-semibold">
          <BadgeCheck className="h-3.5 w-3.5" />
          Verified
        </span>
        <ArrowUpRight className="h-4 w-4 text-[#118C4C] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#118C4C]/20 bg-muted flex items-center justify-center shadow-sm">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base text-slate-900 truncate">{user.name || "Unnamed User"}</h3>
          <p className="text-sm text-slate-600 truncate mt-0.5">{user.email || "No email provided"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <span className="text-xs font-mono text-slate-600">
          {shortWallet || "No wallet"}
        </span>
        {user.wallet && (
          <Copy
            onClick={copyWallet}
            className="h-4 w-4 text-[#118C4C] hover:scale-110 transition cursor-pointer"
          />
        )}
      </div>

      <div className="mt-3 px-1">
        <RatingSummary farmerId={user.id} />
      </div>
    </motion.div>
  )
}
