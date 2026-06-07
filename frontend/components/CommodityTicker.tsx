"use client"

import { useEffect, useRef, useState } from "react"
import { TrendingUp, RefreshCcw } from "lucide-react"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"

function PriceTag({ item }: { item: CommodityPrice }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="text-white/60 text-xs font-medium">{item.displayName}</span>
      <span className="text-white font-bold text-sm">
        ₦{item.price.toLocaleString()}
        <span className="text-white/50 font-normal text-xs">/{item.unit}</span>
      </span>
      <span className="w-px h-3 bg-white/20" />
    </span>
  )
}

export function CommodityTicker() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/commodity-prices")
      if (res.ok) {
        const data = await res.json()
        setPrices(data)
        const at = res.headers.get("X-Fetched-At")
        if (at) setFetchedAt(at)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch_() }, [])

  if (loading) {
    return (
      <div className="bg-[#0d6d3a] h-9 flex items-center px-4 gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-white/60 animate-pulse" />
        <span className="text-white/50 text-xs">Loading market prices…</span>
      </div>
    )
  }

  if (!prices.length) return null

  // Duplicate for seamless loop
  const items = [...prices, ...prices]

  return (
    <div
      className="fixed left-0 right-0 z-40 bg-[#0d6d3a] border-b border-[#118C4C]/40 h-9 flex items-center overflow-hidden select-none"
      style={{ top: "var(--navbar-height)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      title="Hover to pause. Source: WFP Food Prices, Nigeria (monthly)"
    >
      {/* Label */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-white/20 h-full bg-[#118C4C]">
        <TrendingUp className="h-3.5 w-3.5 text-white" />
        <span className="text-white text-xs font-bold tracking-wide hidden sm:block">MARKET</span>
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={trackRef}
          className="flex items-center"
          style={{
            animation: paused ? "none" : `ticker ${prices.length * 4}s linear infinite`,
            willChange: "transform",
          }}
        >
          {items.map((item, i) => (
            <PriceTag key={`${item.commodity}-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Refresh + date */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 border-l border-white/20 h-full">
        {fetchedAt && (
          <span className="text-white/40 text-xs hidden md:block">
            {new Date(fetchedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
          </span>
        )}
        <button onClick={fetch_} title="Refresh prices" className="text-white/50 hover:text-white transition-colors">
          <RefreshCcw className="h-3 w-3" />
        </button>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
