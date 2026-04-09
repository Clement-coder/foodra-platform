"use client"

import { useEffect } from "react"
import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface NotificationDivProps {
  type: "error" | "success" | "info" | "warning"
  message: string
  title?: string
  duration?: number
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
}

export function NotificationDiv({
  type,
  message,
  title,
  duration = 6000,
  actionLabel,
  onAction,
  onClose,
}: NotificationDivProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    error: {
      container: "bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-400/50",
      actionButton: "bg-card text-red-600 hover:bg-red-50",
      icon: AlertCircle,
    },
    success: {
      container: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/50",
      actionButton: "bg-card text-green-700 hover:bg-green-50",
      icon: CheckCircle,
    },
    info: {
      container: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border border-blue-400/50",
      actionButton: "bg-card text-blue-700 hover:bg-blue-50",
      icon: Info,
    },
    warning: {
      container: "bg-gradient-to-r from-orange-500 to-red-500 text-white border border-orange-400/50",
      actionButton: "bg-card text-orange-600 hover:bg-orange-50",
      icon: TriangleAlert,
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        role={type === "error" ? "alert" : "status"}
        aria-live={type === "error" ? "assertive" : "polite"}
        className={`fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-md rounded-lg shadow-2xl backdrop-blur-sm p-4 ${style.container}`}
      >
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{title || (type === "success" ? "Success" : type === "error" ? "Something went wrong" : type === "warning" ? "Action needed" : "Notice")}</h3>
            <p className="text-xs text-white/90 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {actionLabel && onAction && (
          <div className="mt-3">
            <button
              onClick={onAction}
              className={`w-full font-medium text-xs py-2 px-4 rounded-md transition-colors ${style.actionButton}`}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
