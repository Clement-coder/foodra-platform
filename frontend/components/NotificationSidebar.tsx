"use client"

import { useEffect, useRef } from "react"
import { X, Bell, ShoppingBag, DollarSign, GraduationCap, MessageCircle, Megaphone, Info, CheckCheck } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import type { Notification } from "@/lib/useNotifications"
import { formatTimeAgo } from "@/lib/timeUtils"

const TYPE_ICON: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="w-4 h-4" />,
  funding: <DollarSign className="w-4 h-4" />,
  training: <GraduationCap className="w-4 h-4" />,
  support: <MessageCircle className="w-4 h-4" />,
  broadcast: <Megaphone className="w-4 h-4" />,
  system: <Info className="w-4 h-4" />,
}

const TYPE_COLOR: Record<string, string> = {
  order: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  funding: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  training: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  support: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  broadcast: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  system: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

interface Props {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkRead: (id?: string) => void
}

export function NotificationSidebar({ open, onClose, notifications, onMarkRead }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const handleClick = (n: Notification) => {
    if (!n.is_read) onMarkRead(n.id)
    if (n.link) window.location.href = n.link
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            ref={ref}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-900 dark:text-white">Notifications</h2>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
                    {notifications.filter(n => !n.is_read).length} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.some(n => !n.is_read) && (
                  <button onClick={() => onMarkRead()} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" />Mark all read
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <Bell className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.is_read ? "bg-green-50/50 dark:bg-green-900/10" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${TYPE_COLOR[n.type] || TYPE_COLOR.system}`}>
                        {TYPE_ICON[n.type] || TYPE_ICON.system}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-snug ${!n.is_read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                            {n.title}
                          </p>
                          {!n.is_read && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(n.created_at)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
