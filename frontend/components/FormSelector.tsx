"use client"

import { forwardRef, useState, useRef, useEffect, useId } from "react"
import { ChevronDown, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ValidationError } from "./ValidationError"

interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  label: string
  error?: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  required?: boolean
  disabled?: boolean
  name?: string
  id?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, value, defaultValue, onChange, required, disabled, name, id }, ref) => {
    const uid = useId()
    const selectId = id || uid
    const [open, setOpen] = useState(false)
    const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "")
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync controlled value
    useEffect(() => {
      if (value !== undefined) setInternalValue(value)
    }, [value])

    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [])

    const selected = options.find((o) => o.value === internalValue)

    const handleSelect = (optValue: string) => {
      setInternalValue(optValue)
      setOpen(false)
      // Fire synthetic change event for react-hook-form compatibility
      if (onChange) {
        const nativeInput = document.getElementById(selectId) as HTMLSelectElement | null
        if (nativeInput) {
          Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set?.call(nativeInput, optValue)
          nativeInput.dispatchEvent(new Event("change", { bubbles: true }))
        }
      }
    }

    return (
      <div className="space-y-2 relative" ref={containerRef}>
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Hidden native select for react-hook-form ref */}
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={internalValue}
          onChange={(e) => { setInternalValue(e.target.value); onChange?.(e) }}
          required={required}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Custom trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent ${
            error ? "border-red-500" : open ? "border-[#118C4C]" : "border-input"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-[#118C4C]/60"}`}
        >
          <span className={selected && selected.value !== "" ? "text-foreground" : "text-muted-foreground"}>
            {selected?.label || options[0]?.label || "Select…"}
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.span>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.ul
              role="listbox"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-50 mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto rounded-xl border border-border bg-background shadow-lg shadow-black/10 py-1"
              style={{ width: containerRef.current?.offsetWidth }}
            >
              {options.map((o) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={internalValue === o.value}
                  onClick={() => handleSelect(o.value)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    internalValue === o.value
                      ? "bg-[#118C4C]/10 text-[#118C4C] font-medium"
                      : "text-foreground hover:bg-muted"
                  } ${o.value === "" ? "text-muted-foreground" : ""}`}
                >
                  {o.label}
                  {internalValue === o.value && o.value !== "" && (
                    <Check className="h-3.5 w-3.5 text-[#118C4C]" />
                  )}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {error && <ValidationError message={error} />}
      </div>
    )
  }
)

FormSelect.displayName = "FormSelect"
