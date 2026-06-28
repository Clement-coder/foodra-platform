import type React from "react"

interface GridLayoutProps {
  children: React.ReactNode
  className?: string
  cols?: 2 | 3
}

export function GridLayout({ children, className = "", cols = 2 }: GridLayoutProps) {
  const grid = cols === 3
    ? "grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
  return <div className={`grid ${grid} gap-3 sm:gap-4 ${className}`}>{children}</div>
}
