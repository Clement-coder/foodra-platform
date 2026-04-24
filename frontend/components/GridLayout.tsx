import type React from "react"
interface GridLayoutProps {
  children: React.ReactNode
  className?: string
}

export function GridLayout({ children, className = "" }: GridLayoutProps) {
  return <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 ${className}`}>{children}</div>
}
