"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"
import { CheckCircle, AlertCircle, Info, TriangleAlert, X, AlertTriangle } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    info: (msg: string) => void
    warning: (msg: string) => void
  }
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)
  const resolveRef = useRef<((v: boolean) => void) | null>(null)

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const toast = {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
    warning: (msg: string) => addToast("warning", msg),
  }

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      resolveRef.current = resolve
      setConfirmState({ ...opts, resolve })
    })
  }, [])

  const handleConfirm = (val: boolean) => {
    resolveRef.current?.(val)
    setConfirmState(null)
  }

  const icons: Record<ToastType, React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: TriangleAlert,
  }

  const colors: Record<ToastType, string> = {
    success: "bg-gradient-to-r from-green-600 to-emerald-600 border-green-400/40",
    error: "bg-gradient-to-r from-red-500 to-rose-600 border-red-400/40",
    info: "bg-gradient-to-r from-blue-500 to-cyan-600 border-blue-400/40",
    warning: "bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/40",
  }

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            const Icon = icons[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border text-white text-sm backdrop-blur-sm ${colors[t.type]}`}
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="flex-1 leading-snug">{t.message}</p>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="flex-shrink-0 opacity-70 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmState && (
          <>
            <div className="fixed inset-0 z-[200] backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/50"
              onClick={() => handleConfirm(false)}
            />
            <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className="pointer-events-auto bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6"
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-5 sm:hidden" />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${confirmState.danger ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                  <AlertTriangle className={`w-6 h-6 ${confirmState.danger ? "text-red-600" : "text-amber-600"}`} />
                </div>
                <h3 className="text-base font-bold text-center text-gray-900 dark:text-white mb-2">
                  {confirmState.title || "Are you sure?"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
                  {confirmState.message}
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleConfirm(true)}
                    className={`w-full py-3 rounded-xl text-base font-semibold text-white transition-colors ${confirmState.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#118C4C] hover:bg-[#0d6b3a]"}`}>
                    {confirmState.confirmLabel || "Confirm"}
                  </button>
                  <button onClick={() => handleConfirm(false)}
                    className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  )
}
