"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { useScrollLock } from "@/lib/useScrollLock"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 60, 260], [0.6, 0.6, 0])
  const contentRef = useRef<HTMLDivElement>(null)

  useScrollLock(isOpen)

  useEffect(() => { if (isOpen) y.set(0) }, [isOpen, y])

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) onClose()
    else y.set(0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet — slides up from bottom, capped so page is always visible behind it */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.5 }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{ y, maxHeight: "min(74vh, 680px)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 28, stiffness: 300 } }}
              exit={{ y: "100%", transition: { type: "spring", damping: 32, stiffness: 300 } }}
              className="pointer-events-auto w-full max-w-lg bg-background rounded-t-3xl shadow-2xl flex flex-col touch-none"
              role="dialog"
              aria-modal="true"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 shrink-0">
                <h2 className="text-xl font-bold">{title}</h2>
                <button onClick={onClose}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div ref={contentRef} className="overflow-y-auto flex-1 px-6 pb-10 touch-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
