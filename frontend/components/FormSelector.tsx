"use client"

import type React from "react"

import { forwardRef } from "react"
import { ValidationError } from "./ValidationError"

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, id, ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="space-y-2">
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-describedby={error ? `${selectId}-error` : undefined}
          aria-invalid={!!error}
          className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent ${
            error ? "border-red-500" : "border-input"
          }`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <ValidationError message={error} />}
      </div>
    )
  },
)

FormSelect.displayName = "FormSelect"
