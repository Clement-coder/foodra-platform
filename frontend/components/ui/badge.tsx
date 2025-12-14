import React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "green" | "blue" | "yellow" | "red" | "gray"
}

const Badge: React.FC<BadgeProps> = ({
  className = "",
  children,
  variant = "default",
  ...props
}) => {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

  const variantStyles = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    green: "border-transparent bg-green-500 text-white shadow hover:bg-green-500/80",
    blue: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-500/80",
    yellow: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-500/80",
    red: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
    gray: "border-transparent bg-gray-500 text-white shadow hover:bg-gray-500/80",
  }

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}

export { Badge }
