"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, ArrowRight, Activity,
} from "lucide-react"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"
import type { CommodityHistory } from "@/app/api/commodity-history/route"
import { CommodityIcon } from "@/app/market-prices/page"

interface TickerItem extends CommodityPrice {
  change: number | null
}

export function CommodityTicker() {
  const pathname = usePathname()
  const [items, setItems]     = useState<TickerItem[]>([])
  const [loading, setLoading] = useState(true)

  // Hide on pages that already have full market content or feel cluttered
  const hidden = pathname === "/wallet" || pathname === "/profile" || pathname === "/market-prices"

  useEffect(() => {
    if (hidden) return
    const load = async () => {
      setLoading(true)
      try {
        const [pRes, hRes] = await Promise.all([
          fetch("/api/commodity-prices"),
          fetch("/api/commodity-history"),
        ])
        const prices: CommodityPrice[]      = pRes.ok ? await pRes.json() : []
        const histories: CommodityHistory[] = hRes.ok ? await hRes.json() : []
        const hMap: Record<string, CommodityHistory> = {}
        histories.forEach(h => { hMap[h.commodity] = h })
        setItems(prices.map(p => {
          const hist = hMap[p.commodity]?.history ?? []
          const prev = hist.length > 1 ? hist[hist.length - 2].price : null
          return { ...p, change: prev ? ((p.price - prev) / prev) * 100 : null }
        }))
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [hidden]) // eslint-disable-line

  if (hidden) return <style>{`:root { --ticker-height: 0px; }`}</style>

  if (loading) {
    return (
      <div
        className="fixed left-0 right-0 z-40 h-10 bg-gradient-to-r from-[#0d6d3a] to-[#118C4C] flex items-center px-4 gap-3"
        style={{ top: "var(--navbar-height)" }}
      >
        <Activity className="h-3.5 w-3.5 text-white/40 animate-pulse shrink-0" />
        <div className="flex gap-4">
          {[80, 100, 70, 90, 85].map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-2.5 rounded-full bg-white/15 animate-pulse" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!items.length) return null

  // Quadruple the items so the seamless loop works at any screen width
  const track = [...items, ...items, ...items, ...items]
  const duration = Math.max(28, items.length * 3.2)

  return (
    <div
      className="fixed left-0 right-0 z-40 h-10 overflow-hidden flex items-center"
      style={{ top: "var(--navbar-height)", background: "linear-gradient(90deg, #0b5e33 0%, #0e7a42 40%, #118C4C 100%)" }}
    >
      {/* LIVE pill */}
      <div className="shrink-0 flex items-center gap-1.5 pl-3 pr-3 h-full border-r border-white/10 bg-black/20 z-10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
        </span>
        <span className="text-white text-[10px] font-black tracking-widest hidden sm:block">LIVE</span>
      </div>

      {/* Scrolling track — same motion approach as market-prices hero ticker */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          className="flex items-center"
          animate={{ x: ["0%", "-25%"] }}
          transition={{ duration, repeat: Infinity, ease: "linear" }}
        >
          {track.map((item, i) => {
            const isUp = item.change === null ? null : item.change >= 0
            return (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3.5 border-r border-white/[0.08] h-10 shrink-0"
              >
                <CommodityIcon commodity={item.commodity} className="h-3 w-3 text-white/50 shrink-0" />
                <span className="text-white/80 text-[11px] font-medium tracking-tight max-w-[80px] truncate">
                  {item.displayName}
                </span>
                <span className="text-white font-bold text-[11px] tracking-tight">
                  ₦{item.price.toLocaleString()}
                  <span className="text-white/45 font-normal text-[9px] ml-0.5">/{item.unit}</span>
                </span>
                {item.change !== null && (
                  <span
                    className={`flex items-center gap-0.5 text-[10px] font-bold tabular-nums shrink-0 ${
                      isUp ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {isUp
                      ? <TrendingUp className="h-2.5 w-2.5" />
                      : <TrendingDown className="h-2.5 w-2.5" />}
                    {Math.abs(item.change).toFixed(1)}%
                  </span>
                )}
              </span>
            )
          })}
        </motion.div>
      </div>

      {/* Markets link */}
      <Link
        href="/market-prices"
        className="shrink-0 flex items-center gap-1.5 px-3 h-full border-l border-white/10 text-white/55 hover:text-white hover:bg-black/20 transition-all text-[11px] font-semibold"
      >
        <span className="hidden sm:block">Markets</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
