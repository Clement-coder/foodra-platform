"use client"

import { motion } from "framer-motion"
import { Copy, User as UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { User } from "@/lib/types"

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
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(`/users/${user.id}`)}
      className="cursor-pointer bg-white/5 backdrop-blur border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
    >
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
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

        <div className="flex-1">
          <h3 className="font-semibold text-foreground truncate">
            {user.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Wallet */}
      <div className="flex items-center justify-between bg-muted/40 px-3 py-2 rounded-lg">
        <span className="text-xs font-mono text-muted-foreground">
          {shortWallet || "No wallet"}
        </span>
        {user.wallet && (
          <Copy
            onClick={copyWallet}
            className="h-4 w-4 text-[#118C4C] hover:scale-110 transition cursor-pointer"
          />
        )}
      </div>
    </motion.div>
  )
}
