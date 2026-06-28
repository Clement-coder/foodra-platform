"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { africanCountries } from "@/lib/countries"
import { ValidationError } from "./ValidationError"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

function getFlagEmoji(code: string) {
  return code
    .toUpperCase()
    .split("")
    .map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("")
}

export function PhoneInput({ value, onChange, error, required }: PhoneInputProps) {
  const defaultCountry = africanCountries.find(c => c.code === "NG")!
  const [selected, setSelected] = useState(defaultCountry)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync selected country from existing value on mount
  useEffect(() => {
    if (value) {
      const match = africanCountries
        .slice()
        .sort((a, b) => b.dialCode.length - a.dialCode.length)
        .find(c => value.startsWith(c.dialCode))
      if (match) setSelected(match)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setSearch("")
  }, [open])

  const filtered = africanCountries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search)
  )

  function selectCountry(country: typeof defaultCountry) {
    setSelected(country)
    setOpen(false)
    // Replace dial code prefix in the current number
    const digits = value.replace(/^\+\d+\s?/, "")
    onChange(`${country.dialCode}${digits ? " " + digits : ""}`)
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Keep dial code prefix, user edits the number part
    const digits = raw.replace(selected.dialCode, "").trimStart()
    onChange(`${selected.dialCode}${digits ? " " + digits.replace(/^\s+/, "") : ""}`)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        Phone Number{required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className={`flex items-stretch rounded-lg border overflow-hidden bg-background transition-colors focus-within:ring-2 focus-within:ring-[#118C4C] focus-within:border-transparent ${error ? "border-red-500" : "border-input"}`}>
        {/* Country code button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 hover:bg-muted border-r border-input transition-colors flex-shrink-0"
        >
          <span className="text-lg leading-none">{getFlagEmoji(selected.code)}</span>
          <span className="text-sm font-medium text-foreground">{selected.dialCode}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={value.replace(selected.dialCode, "").trimStart()}
          onChange={handleNumberChange}
          placeholder="800 000 0000"
          className="flex-1 px-3 py-2 bg-transparent text-foreground focus:outline-none text-sm"
          aria-invalid={!!error}
        />
      </div>

      {error && <ValidationError message={error} />}

      {/* Country picker modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">Select Country Code</h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filtered.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => selectCountry(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left ${selected.code === country.code ? "bg-[#118C4C]/10" : ""}`}
                >
                  <span className="text-xl leading-none">{getFlagEmoji(country.code)}</span>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">{country.name}</span>
                  <span className={`text-sm font-mono flex-shrink-0 ${selected.code === country.code ? "text-[#118C4C] font-bold" : "text-muted-foreground"}`}>
                    {country.dialCode}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No countries found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
