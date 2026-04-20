"use client"

import { useOnlineStatus } from "@/lib/useOnlineStatus"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl">
      <WifiOff className="h-4 w-4 text-red-400" />
      You're offline — some features may be unavailable
    </div>
  )
}
