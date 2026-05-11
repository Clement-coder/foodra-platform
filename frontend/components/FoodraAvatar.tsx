interface FoodraAvatarProps {
  size?: number
  className?: string
}

/** Reusable Foodra logo avatar — used wherever admin/Foodra identity is shown */
export function FoodraAvatar({ size = 32, className = "" }: FoodraAvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/foodra_logo.jpeg"
      alt="Foodra"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-full object-contain border-2 border-[#118C4C] flex-shrink-0 bg-white p-0.5 ${className}`}
    />
  )
}
