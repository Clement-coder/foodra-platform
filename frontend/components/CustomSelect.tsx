"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Option { value: string; label: string }

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
  disabled?: boolean
}

export function CustomSelect({ value, onChange, options, className = "", disabled }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-2 w-full text-sm border border-border dark:border-border rounded-xl px-3 py-2 bg-card dark:bg-gray-800 text-foreground dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${open ? "border-green-500" : "hover:border-green-400"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 top-full mt-1 w-full min-w-[140px] max-h-52 overflow-y-auto rounded-xl border border-border dark:border-border bg-card dark:bg-gray-800 shadow-lg shadow-black/10 py-1"
          >
            {options.map((o) => (
              <li
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                  value === o.value
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium"
                    : "text-foreground dark:text-gray-300 hover:bg-muted dark:hover:bg-gray-700"
                }`}
              >
                {o.label}
                {value === o.value && <Check className="h-3 w-3 text-green-600 flex-shrink-0" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
