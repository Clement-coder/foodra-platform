"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { X, ChevronDown } from "lucide-react"
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
  const [showScrollHint, setShowScrollHint] = useState(false)

  useScrollLock(isOpen)

  // Check if content is scrollable and not yet at top
  const checkScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const isScrollable = el.scrollHeight > el.clientHeight + 8
    const isAtTop = el.scrollTop < 10
    setShowScrollHint(isScrollable && isAtTop)
  }, [])

  useEffect(() => {
    if (isOpen) {
      y.set(0)
      const t = setTimeout(checkScroll, 120)
      return () => clearTimeout(t)
    }
  }, [isOpen, y, checkScroll])

  const handleContentScroll = () => {
    const el = contentRef.current
    if (!el) return
    setShowScrollHint(el.scrollTop < 10 && el.scrollHeight > el.clientHeight + 8)
  }

  // Only close if content is scrolled to top — prevents accidental close mid-scroll
  const handleDragEnd = (_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    const el = contentRef.current
    const atTop = !el || el.scrollTop < 4

    if (atTop && (info.offset.y > 120 || info.velocity.y > 500)) {
      onClose()
    } else {
      // Snap back
      y.set(0)
    }
  }

  // Prevent the drag handle from initiating a drag when content isn't at top
  const canDrag = useCallback(() => {
    const el = contentRef.current
    return !el || el.scrollTop < 4
  }, [])

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

          {/* Sheet wrapper — no drag on the outer shell */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
            <motion.div
              style={{ y, maxHeight: "min(74vh, 680px)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { type: "spring", damping: 28, stiffness: 300 } }}
              exit={{ y: "100%", transition: { type: "spring", damping: 32, stiffness: 300 } }}
              className="pointer-events-auto w-full max-w-lg bg-background rounded-t-3xl shadow-2xl flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              {/* ── Drag zone: handle pill + header only ── */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.02, bottom: 0.6 }}
                dragMomentum={false}
                dragListener={true}
                onDragStart={(_, info) => {
                  // Cancel drag if content is not at top and user is swiping down (trying to scroll up)
                  if (!canDrag() && info.delta.y < 0) {
                    y.set(0)
                  }
                }}
                onDrag={(_, info) => {
                  // Only allow downward drag to close, never upward beyond 0
                  if (info.offset.y < 0) y.set(0)
                  else y.set(info.offset.y)
                }}
                onDragEnd={handleDragEnd}
                className="shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
              >
                {/* Drag pill */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3">
                  <h2 className="text-xl font-bold">{title}</h2>
                  <button
                    onClick={onClose}
                    onPointerDown={e => e.stopPropagation()} // prevent drag stealing close button tap
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>

              {/* ── Scrollable body — fully independent of drag ── */}
              <div className="relative flex-1 min-h-0">
                <div
                  ref={contentRef}
                  onScroll={handleContentScroll}
                  className="overflow-y-auto h-full px-6 pb-10 touch-auto overscroll-contain"
                >
                  {children}
                </div>

                {/* Scroll hint — fade gradient + bouncing arrow */}
                <AnimatePresence>
                  {showScrollHint && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="pointer-events-none absolute bottom-0 inset-x-0 flex flex-col items-center justify-end pb-3"
                      style={{
                        background: "linear-gradient(to bottom, transparent 0%, var(--background) 80%)",
                        height: "80px",
                      }}
                    >
                      <motion.div
                        animate={{ y: [0, 5, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/80 border border-border/60 shadow-sm"
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
