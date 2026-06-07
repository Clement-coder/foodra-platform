"use client"

import { useSearchParams } from "next/navigation"
import { useUser } from "@/lib/useUser"
import { AlertTriangle, LogOut } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"

/**
 * Drop this component at the top of any protected page that can be linked
 * from an email (orders, funding, training, wallet, profile).
 *
 * Email links should include ?uid=<userId> so we can detect mismatches.
 * Example: https://foodramarket.com/orders/abc?uid=user_123
 */
export function AccountMismatchBanner() {
  const searchParams = useSearchParams()
  const { currentUser } = useUser()
  const { logout } = usePrivy()

  const uid = searchParams.get("uid")
  if (!uid || !currentUser) return null
  if (currentUser.id === uid) return null

  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700 p-4 flex gap-3 items-start">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Wrong account
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
          This link was sent to a different Foodra account. You're currently signed in as <strong>{currentUser.name || currentUser.email || "another user"}</strong>.
          Please sign out and sign in with the correct account to view this page.
        </p>
      </div>
      <button
        onClick={() => logout()}
        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-600 rounded-lg px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign out
      </button>
    </div>
  )
}
