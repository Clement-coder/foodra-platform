"use client"

import { useEffect, useState } from "react"
import { Download, Bell, RefreshCw, X } from "lucide-react"
import { useUser } from "@/lib/useUser"

export default function PWAManager() {
  const { currentUser } = useUser()
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showPushBanner, setShowPushBanner] = useState(false)
  const [wb, setWb] = useState<any>(null)

  // Capture install prompt
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true) }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // SW update detection
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing
        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShowUpdate(true)
            setWb(newWorker)
          }
        })
      })
    })
  }, [])

  // Show push banner if logged in + not yet granted
  useEffect(() => {
    if (!currentUser) return
    if (typeof Notification === "undefined") return
    if (Notification.permission === "default") {
      const dismissed = sessionStorage.getItem("push_banner_dismissed")
      if (!dismissed) setShowPushBanner(true)
    }
  }, [currentUser])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "accepted") setShowInstall(false)
  }

  const handlePushEnable = async () => {
    setShowPushBanner(false)
    const permission = await Notification.requestPermission()
    if (permission !== "granted" || !currentUser) return

    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })

    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), userId: currentUser.id }),
    })
  }

  const handleUpdate = () => {
    wb?.postMessage({ type: "SKIP_WAITING" })
    window.location.reload()
  }

  return (
    <>
      {/* Install banner */}
      {showInstall && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-80 z-[200] bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-[#118C4C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Foodra</p>
            <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
          </div>
          <div className="flex gap-1">
            <button onClick={handleInstall} className="px-3 py-1.5 rounded-lg bg-[#118C4C] text-white text-xs font-medium">Install</button>
            <button onClick={() => setShowInstall(false)} className="p-1.5 rounded-lg hover:bg-accent"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      )}

      {/* Push notification banner */}
      {showPushBanner && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-80 z-[200] bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#118C4C]/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-[#118C4C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Stay updated</p>
            <p className="text-xs text-muted-foreground">Get notified about orders & funding</p>
          </div>
          <div className="flex gap-1">
            <button onClick={handlePushEnable} className="px-3 py-1.5 rounded-lg bg-[#118C4C] text-white text-xs font-medium">Enable</button>
            <button onClick={() => { setShowPushBanner(false); sessionStorage.setItem("push_banner_dismissed", "1") }} className="p-1.5 rounded-lg hover:bg-accent"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      )}

      {/* Update banner */}
      {showUpdate && (
        <div className="fixed top-16 left-3 right-3 z-[200] bg-[#118C4C] text-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">New version available!</p>
          <button onClick={handleUpdate} className="px-3 py-1.5 rounded-lg bg-white text-[#118C4C] text-xs font-bold">Update</button>
          <button onClick={() => setShowUpdate(false)} className="p-1"><X className="h-4 w-4" /></button>
        </div>
      )}
    </>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
