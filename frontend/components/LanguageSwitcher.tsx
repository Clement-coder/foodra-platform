"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { LOCALES, type Locale, useTranslation } from "@/lib/i18n"

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Change language"
      >
        <Globe className="h-4 w-4" />
        {!compact && <span className="font-medium">{current.nativeLabel}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code as Locale); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-accent ${
                  l.code === locale ? "bg-[#118C4C]/10 text-[#118C4C] font-semibold" : "text-foreground"
                }`}
              >
                <span className="font-medium">{l.nativeLabel}</span>
                {l.code !== locale && <span className="text-muted-foreground ml-1 text-xs">({l.label})</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
