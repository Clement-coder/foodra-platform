"use client"

import React, { useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { X } from "lucide-react"

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function ProfileCompletionModal({ isOpen, onClose, children }: ProfileCompletionModalProps) {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 60, 260], [0.5, 0.5, 0])
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => { if (isOpen) y.set(0) }, [isOpen, y])

  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    if (info.offset.y > 100 || info.velocity.y > 400) onClose()
    else y.set(0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Mobile: bottom sheet */}
          <div className="fixed inset-0 z-50 flex items-end sm:hidden pointer-events-none">
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.02, bottom: 0.5 }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              style={{ y }}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 30, stiffness: 300 } }}
              exit={{ y: "100%", transition: { type: "spring", damping: 35, stiffness: 300 } }}
              className="pointer-events-auto w-full bg-background rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col touch-none"
            >
              <div className="flex justify-center pt-3 pb-2 shrink-0">
                <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                <h2 className="text-lg font-semibold">Edit Profile</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div ref={contentRef} className="overflow-y-auto flex-1 p-5 touch-auto">{children}</div>
            </motion.div>
          </div>

          {/* Desktop: centered dialog */}
          <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <h2 className="text-xl font-semibold">Edit Profile</h2>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
