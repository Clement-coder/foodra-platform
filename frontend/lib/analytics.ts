"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Lightweight analytics hook.
 * Tracks page views to Vercel Analytics (already installed) and
 * optionally logs custom events to Supabase for internal dashboards.
 */
export function usePageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    // Vercel Analytics auto-tracks — this is for custom internal logging
    if (typeof window === "undefined") return
    try {
      const views = JSON.parse(sessionStorage.getItem("foodra_page_views") || "[]")
      views.push({ path: pathname, ts: Date.now() })
      sessionStorage.setItem("foodra_page_views", JSON.stringify(views.slice(-50)))
    } catch { /* non-critical */ }
  }, [pathname])
}

/** Track a custom event (e.g. "add_to_cart", "checkout_started") */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  try {
    // Vercel Analytics custom event
    if ((window as any).va) {
      (window as any).va("event", { name, ...props })
    }
    // Console in dev
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${name}`, props)
    }
  } catch { /* non-critical */ }
}
