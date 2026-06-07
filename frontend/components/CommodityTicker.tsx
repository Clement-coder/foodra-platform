"use client"

import { useEffect, useState } from "react"
import { TrendingUp, RefreshCcw, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"

function PriceTag({ item }: { item: CommodityPrice }) {
  return (
    <span className="inline-flex items-center gap-3 px-4 whitespace-nowrap shrink-0">
      <span className="text-white/70 text-xs font-medium">{item.displayName}</span>
      <span className="text-white font-bold text-xs">
        ₦{item.price.toLocaleString()}
        <span className="text-white/50 font-normal">/{item.unit}</span>
      </span>
      <span className="text-white/20 text-xs">•</span>
    </span>
  )
}

export function CommodityTicker() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/commodity-prices")
      if (res.ok) {
        setPrices(await res.json())
        const at = res.headers.get("X-Fetched-At")
        if (at) setFetchedAt(at)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="fixed left-0 right-0 z-40 h-9 bg-[#0d6d3a] flex items-center px-4 gap-2" style={{ top: "var(--navbar-height)" }}>
        <TrendingUp className="h-3.5 w-3.5 text-white/60 animate-pulse shrink-0" />
        <span className="text-white/50 text-xs">Loading market prices…</span>
      </div>
    )
  }

  if (!prices.length) return null

  // 4 copies = guaranteed seamless loop on all screen widths
  const items = [...prices, ...prices, ...prices, ...prices]
  // ~3s per item feels readable
  const duration = `${prices.length * 3}s`

  return (
    <div
      className="fixed left-0 right-0 z-40 h-9 bg-[#0d6d3a] border-b border-[#118C4C]/40 flex items-center overflow-hidden"
      style={{ top: "var(--navbar-height)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Label badge */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 h-full bg-[#118C4C]/80 border-r border-white/10 z-10">
        <TrendingUp className="h-3.5 w-3.5 text-white shrink-0" />
        <span className="text-white text-xs font-bold tracking-wider hidden sm:block">LIVE</span>
      </div>

      {/* Ticker track — translate -25% = one full copy with 4 copies */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex items-center"
          style={{
            animationName: "commodity-scroll",
            animationDuration: duration,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {items.map((item, i) => (
            <PriceTag key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Date + refresh + view all */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-full border-l border-white/10">
        {fetchedAt && (
          <span className="text-white/40 text-xs hidden lg:block">
            {new Date(fetchedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
          </span>
        )}
        <button onClick={load} title="Refresh" className="text-white/50 hover:text-white transition-colors">
          <RefreshCcw className="h-3 w-3" />
        </button>
        <Link href="/market-prices" title="View all prices"
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-xs font-medium">
          <span className="hidden sm:block">All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <style>{`
        @keyframes commodity-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  )
}
