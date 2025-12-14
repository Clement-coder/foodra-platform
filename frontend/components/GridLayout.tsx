import type React from "react"
interface GridLayoutProps {
  children: React.ReactNode
  className?: string
}

export function GridLayout({ children, className = "" }: GridLayoutProps) {
  return <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 ${className}`}>{children}</div>
}
