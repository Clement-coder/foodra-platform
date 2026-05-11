import Image from "next/image"

interface FoodraAvatarProps {
  size?: number
  className?: string
}

/** Reusable Foodra logo avatar — used wherever admin/Foodra identity is shown */
export function FoodraAvatar({ size = 32, className = "" }: FoodraAvatarProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden border-2 border-[#118C4C] flex-shrink-0 bg-white ${className}`}
    >
      <Image src="/foodra.png" alt="Foodra" width={size} height={size} className="object-cover w-full h-full" />
    </div>
  )
}
