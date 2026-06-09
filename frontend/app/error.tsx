"use client"

import { useEffect } from "react"
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

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-5 border border-red-200 dark:border-red-800">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">
        {error?.message?.includes("fetch")
          ? "A network error occurred. Check your connection and try again."
          : "An unexpected error occurred. Our team has been notified."}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button onClick={reset} className="bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
          <RefreshCcw className="h-4 w-4" /> Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = "/"} className="gap-2">
          <Home className="h-4 w-4" /> Go Home
        </Button>
      </div>
      {error?.digest && (
        <p className="mt-4 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
      )}
    </div>
  )
}
