import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button: React.FC<ButtonProps> = ({
  className = "",
  children,
  variant = "default",
  size = "default",
  ...props
}) => {
  const baseStyles =
    "flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#118C4C]/50 disabled:opacity-50 disabled:pointer-events-none"

const variantStyles = {
  default: "bg-[#118C4C] text-white hover:bg-[#0E7A40]",
  secondary:
    "bg-white text-[#118C4C] border border-[#118C4C] hover:bg-[#DCFCE7] shadow-none",
  ghost:
    "bg-transparent text-[#118C4C] hover:bg-[#DCFCE7] shadow-none",
  outline:
    "bg-transparent border border-[#118C4C] text-[#118C4C] hover:bg-[#DCFCE7] shadow-none",
  destructive:
    "bg-red-600 text-white hover:bg-red-700",
}


  const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-4 h-8 text-sm",
    default: "px-6 h-10",
    lg: "px-8 h-12 text-lg",
    icon: "h-9 w-9 p-0",
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export { Button }
