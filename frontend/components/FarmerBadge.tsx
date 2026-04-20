import { ShieldCheck } from "lucide-react"

interface Props {
  yearsExperience?: number
  orderCount?: number
  className?: string
}

export function FarmerBadge({ yearsExperience = 0, orderCount = 0, className = "" }: Props) {
  const level =
    orderCount >= 50 || yearsExperience >= 10
      ? { label: "Elite Farmer", color: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800" }
      : orderCount >= 10 || yearsExperience >= 3
        ? { label: "Verified Farmer", color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" }
        : { label: "New Farmer", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${level.color} ${className}`}>
      <ShieldCheck className="h-3 w-3" />
      {level.label}
    </span>
  )
}
