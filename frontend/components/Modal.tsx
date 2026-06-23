"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const y = useMotionValue(0)
  // Only start dimming backdrop after dragging 60px, fully gone at 260px
  const backdropOpacity = useTransform(y, [0, 60, 260], [0.5, 0.5, 0])
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Reset y whenever sheet opens so it always starts at 0
  useEffect(() => { if (isOpen) y.set(0) }, [isOpen, y])

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose()
    } else {
      // Snap back with spring
      y.set(0)
    }
  }

  // Prevent drag from firing when user is scrolling the inner content
  const handlePointerDown = (e: React.PointerEvent) => {
    const el = contentRef.current
    if (el && el.scrollTop > 0) return // already scrolled inside — don't drag
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blur layer */}
          <div className="fixed inset-0 z-40 backdrop-blur-sm" />

          {/* Dim layer — fades with drag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* ── Mobile: bottom sheet ── */}
          <div className="fixed inset-0 z-50 flex items-end sm:hidden pointer-events-none">
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.5 }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              onPointerDown={handlePointerDown}
              style={{ y }}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 30, stiffness: 300 } }}
              exit={{ y: "100%", transition: { type: "spring", damping: 35, stiffness: 300 } }}
              className="pointer-events-auto w-full bg-background rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col touch-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Drag handle — visually indicates the whole sheet is swipeable */}
              <div className="flex justify-center pt-3 pb-2 shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                <h2 id="modal-title" className="text-lg font-semibold text-foreground">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Inner scroll area — touch-auto so scrolling works inside */}
              <div ref={contentRef} className="overflow-y-auto flex-1 p-5 touch-auto">{children}</div>
            </motion.div>
          </div>

          {/* ── Desktop: centered dialog ── */}
          <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
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
