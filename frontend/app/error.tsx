"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Foodra Error]", error)
  }, [error])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Faded Foodra logo watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <Image
          src="/foodra.png"
          alt=""
          width={320}
          height={320}
          className="opacity-[0.06] dark:opacity-[0.04] object-contain"
          aria-hidden
        />
      </div>

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-5 border border-red-200 dark:border-red-800 mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-xs font-semibold tracking-widest text-[#118C4C] uppercase mb-1">Foodra</p>
        <h1 className="text-xl font-bold mb-2">Ran into a problem</h1>
        <p className="text-muted-foreground text-sm max-w-xs mb-6 mx-auto">
          {error?.message?.includes("fetch")
            ? "A network error occurred. Check your connection and try again."
            : "Something unexpected happened. Please refresh the page."}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={handleRefresh} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"} className="gap-2">
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </div>
        {error?.digest && (
          <p className="mt-4 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
