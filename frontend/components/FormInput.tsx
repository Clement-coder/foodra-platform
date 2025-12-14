"use client"

import type React from "react"

import { forwardRef } from "react"
import { ValidationError } from "./ValidationError"

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          aria-invalid={!!error}
          className={`w-full px-4 py-2 rounded-lg border bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:border-transparent ${
            error ? "border-red-500" : "border-input"
          }`}
          {...props}
        />
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
        {error && <ValidationError message={error} />}
      </div>
    )
  },
)

FormInput.displayName = "FormInput"
