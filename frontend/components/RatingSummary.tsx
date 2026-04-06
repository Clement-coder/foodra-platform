"use client"

import { useEffect, useState } from "react"
import { Star, AlertTriangle } from "lucide-react"

interface RatingSummaryProps {
  farmerId: string
  detail?: boolean  // show full breakdown + list
}

interface RatingData {
  avg: number
  total: number
  breakdown: Record<number, number>
  ratings: Array<{ id: string; stars: number; created_at: string; users: { name: string; avatar_url: string | null } | null }>
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-4 w-4"
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${cls} ${n <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
      ))}
    </div>
  )
}

export function RatingSummary({ farmerId, detail = false }: RatingSummaryProps) {
  const [data, setData] = useState<RatingData | null>(null)

  useEffect(() => {
    fetch(`/api/ratings?farmerId=${farmerId}${detail ? "&detail=1" : ""}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
  }, [farmerId, detail])

  if (!data || data.total === 0) return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Stars value={0} />
      <span>No ratings yet</span>
    </div>
  )

  const isDefaulter = data.avg < 2 && data.total >= 5

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Stars value={data.avg} size="md" />
        <span className="text-2xl font-bold">{data.avg}</span>
        <span className="text-sm text-muted-foreground">({data.total} rating{data.total !== 1 ? "s" : ""})</span>
        {isDefaulter && (
          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-semibold">
            <AlertTriangle className="h-3 w-3" /> Poor Seller
          </span>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-1">
        {[5, 4, 3, 2, 1].map(n => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right text-muted-foreground">{n}</span>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: data.total ? `${((data.breakdown[n] || 0) / data.total) * 100}%` : "0%" }} />
            </div>
            <span className="w-4 text-muted-foreground">{data.breakdown[n] || 0}</span>
          </div>
        ))}
      </div>

      {/* Detail list */}
      {detail && data.ratings.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          {data.ratings.map(r => (
            <div key={r.id} className="flex items-center gap-3">
              <img
                src={r.users?.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${r.id}`}
                alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{r.users?.name || "Buyer"}</span>
                <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <Stars value={r.stars} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { Stars }
