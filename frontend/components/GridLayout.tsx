import type React from "react"
interface GridLayoutProps {
  children: React.ReactNode
  className?: string
}

export function GridLayout({ children, className = "" }: GridLayoutProps) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>{children}</div>
}
