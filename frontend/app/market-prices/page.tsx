"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, RefreshCcw, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { CommodityPrice } from "@/app/api/commodity-prices/route"

export default function MarketPricesPage() {
  const [prices, setPrices] = useState<CommodityPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#118C4C]" />
            Nigeria Market Prices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Average retail prices across major Nigerian markets · Source:{" "}
            <a href="https://data.humdata.org/dataset/global-wfp-food-prices" target="_blank" rel="noopener noreferrer"
              className="text-[#118C4C] hover:underline">WFP Food Prices</a>
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:block">Refresh</span>
        </button>
      </div>

      {/* Last updated */}
      {fetchedAt && (
        <div className="mb-4 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#118C4C] animate-pulse" />
          Last updated: {new Date(fetchedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
          · Updated monthly by WFP
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Could not load market prices. Try refreshing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prices.map((item) => (
            <div key={item.commodity}
              className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{item.displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.commodity}</p>
                </div>
                <span className="text-xs bg-[#118C4C]/10 text-[#118C4C] px-2 py-0.5 rounded-full font-medium shrink-0">
                  per {item.unit}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{item.price.toLocaleString()}
                  </p>
                  {item.usdPrice > 0 && (
                    <p className="text-xs text-muted-foreground">≈ ${item.usdPrice.toFixed(2)} USD</p>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{item.marketCount} market{item.marketCount !== 1 ? "s" : ""}</p>
                  <p>{new Date(item.date).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground text-center">
        Prices are monthly averages from WFP-monitored markets across Nigeria including Abuja, Lagos, Kano, and others.
        Data is provided under{" "}
        <a href="https://creativecommons.org/licenses/by-igo/3.0/" target="_blank" rel="noopener noreferrer"
          className="underline">CC BY-IGO</a> by the World Food Programme.
      </p>
    </div>
  )
}
