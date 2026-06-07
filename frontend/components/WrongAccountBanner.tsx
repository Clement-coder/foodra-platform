"use client"

import { useSearchParams } from "next/navigation"
import { useUser } from "@/lib/useUser"
import { AlertTriangle } from "lucide-react"
import { usePrivy } from "@privy-io/react-auth"

/**
 * Shows a warning banner when the ?uid= in the URL doesn't match the
 * currently logged-in user — e.g. clicking an order email link while
 * signed in as a different account.
 */
export function WrongAccountBanner() {
  const params = useSearchParams()
  const uid = params.get("uid")
  const { currentUser, isLoading } = useUser()
  const { logout } = usePrivy()

  if (!uid || isLoading || !currentUser) return null
  if (currentUser.id === uid) return null

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3.5 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="font-semibold text-amber-800 dark:text-amber-300">Wrong account</p>
        <p className="mt-0.5 text-amber-700 dark:text-amber-400">
          This link was sent to a different account. You're currently signed in as{" "}
          <span className="font-medium">{currentUser.name || currentUser.email || "another user"}</span>.
          Please switch to the correct account to view this page.
        </p>
        <button
          onClick={() => logout()}
          className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Sign out &amp; switch account
        </button>
      </div>
    </div>
  )
}
