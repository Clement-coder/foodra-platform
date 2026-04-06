"use client"

import type React from "react"
import { useEffect } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dragControls = useDragControls()
  const y = useMotionValue(0)
  const sheetOpacity = useTransform(y, [0, 300], [1, 0])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose()
    else y.set(0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur layer — always full opacity so blur never disappears */}
          <div className="fixed inset-0 z-40 backdrop-blur-sm" />

          {/* Dim layer — fades in/out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* ── Mobile: bottom sheet ── */}
          <div className="fixed inset-0 z-50 flex items-end sm:hidden pointer-events-none">
            <motion.div
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.3 }}
              onDragEnd={handleDragEnd}
              style={{ y, opacity: sheetOpacity }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="pointer-events-auto w-full bg-background rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Drag handle */}
              <div
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={e => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1 p-5">{children}</div>
            </motion.div>
          </div>

          {/* ── Desktop: centered dialog ── */}
          <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title-desktop"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <h2 id="modal-title-desktop" className="text-xl font-semibold text-foreground">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="overflow-y-auto flex-1 p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
