"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ]

  const CurrentIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor
  
  if (!compact) {
    return (
      <div className={`flex items-center gap-1 rounded-xl bg-muted p-1 ${className}`}>
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              theme === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <button className="flex items-center justify-center p-2 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors">
        <CurrentIcon className="h-4 w-4" />
      </button>
      
      {/* Hover Dropdown */}
      <div className="absolute right-0 top-full mt-1 flex-col gap-1 bg-card border border-border rounded-xl p-1 shadow-lg hidden group-hover:flex z-50 min-w-max">
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
              theme === value
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
