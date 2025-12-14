"use client"

import { useEffect } from "react"
import { AlertCircle, CheckCircle, Info, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface NotificationDivProps {
  type: "error" | "success" | "info"
  message: string
  duration?: number
  onClose?: () => void
}

export function NotificationDiv({ type, message, duration = 6000, onClose }: NotificationDivProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    error: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-l-4 border-red-500",
      text: "text-red-900 dark:text-red-200",
      icon: AlertCircle,
    },
    success: {
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-l-4 border-green-500",
      text: "text-green-900 dark:text-green-200",
      icon: CheckCircle,
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-l-4 border-blue-500",
      text: "text-blue-900 dark:text-blue-200",
      icon: Info,
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        role={type === "error" ? "alert" : "status"}
        aria-live={type === "error" ? "assertive" : "polite"}
        className={`${style.bg} ${style.border} ${style.text} p-4 rounded-md shadow-md flex items-start gap-3 mb-4`}
      >
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
