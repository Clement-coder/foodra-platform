import { NextResponse } from "next/server"

const WFP_URL = "https://data.humdata.org/dataset/31579af5-3895-4002-9ee3-c50857480785/resource/502190c6-0d3d-4b84-977e-ef062f053662/download/wfp_food_prices_global_2026.csv"

const TARGET_COMMODITIES: Record<string, string> = {
  "Rice (local)": "Local Rice", "Rice (imported)": "Imported Rice",
  "Maize flour": "Maize Flour", "Beans (white)": "White Beans",
  "Beans (red)": "Red Beans", "Cowpeas": "Cowpeas", "Tomatoes": "Tomatoes",
  "Yam": "Yam", "Onions": "Onions", "Groundnuts": "Groundnuts",
  "Millet": "Millet", "Sorghum": "Sorghum", "Oil (palm)": "Palm Oil",
  "Oil (vegetable)": "Vegetable Oil", "Meat (beef)": "Beef", "Fish": "Fish",
}

export interface HistoryPoint { date: string; price: number; usdPrice: number }
export interface CommodityHistory {
  commodity: string
  displayName: string
  unit: string
  history: HistoryPoint[]   // sorted oldest → newest, one point per month (avg across markets)
}

let cache: { data: CommodityHistory[]; fetchedAt: number } | null = null
const CACHE_MS = 6 * 60 * 60 * 1000

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const commodity = searchParams.get("commodity") // optional filter

  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    const data = commodity ? cache.data.filter(d => d.commodity === commodity) : cache.data
    return NextResponse.json(data, { headers: { "X-Cache": "HIT" } })
  }

  try {
    const res = await fetch(WFP_URL, { next: { revalidate: 21600 }, redirect: "follow" })
    if (!res.ok) throw new Error(`WFP fetch failed: ${res.status}`)

    const csv = await res.text()
    const lines = csv.split("\n")
    const headers = lines[0].split(",")

    const idx = (col: string) => headers.indexOf(col)
    const iIso = idx("countryiso3"), iCommodity = idx("commodity")
    const iPrice = idx("price"), iUsd = idx("usdprice")
    const iUnit = idx("unit"), iDate = idx("date")

    // { commodity → { "YYYY-MM" → { prices[], usdPrices[], unit } } }
    const agg: Record<string, { byMonth: Record<string, { prices: number[]; usdPrices: number[] }>; unit: string }> = {}

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      if (cols[iIso] !== "NGA") continue
      const comm = cols[iCommodity]
      if (!TARGET_COMMODITIES[comm]) continue
      const price = parseFloat(cols[iPrice])
      const usd = parseFloat(cols[iUsd])
      if (isNaN(price) || price <= 0) continue
      const rawDate = cols[iDate] ?? ""
      const month = rawDate.slice(0, 7) // "YYYY-MM"
      if (!month) continue

      if (!agg[comm]) agg[comm] = { byMonth: {}, unit: cols[iUnit] || "KG" }
      if (!agg[comm].byMonth[month]) agg[comm].byMonth[month] = { prices: [], usdPrices: [] }
      agg[comm].byMonth[month].prices.push(price)
      if (!isNaN(usd)) agg[comm].byMonth[month].usdPrices.push(usd)
    }

    const result: CommodityHistory[] = Object.entries(agg).map(([comm, { byMonth, unit }]) => ({
      commodity: comm,
      displayName: TARGET_COMMODITIES[comm],
      unit,
      history: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, { prices, usdPrices }]) => ({
          date: month + "-01",
          price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
          usdPrice: usdPrices.length
            ? parseFloat((usdPrices.reduce((s, p) => s + p, 0) / usdPrices.length).toFixed(2))
            : 0,
        })),
    }))

    cache = { data: result, fetchedAt: Date.now() }
    const data = commodity ? result.filter(d => d.commodity === commodity) : result
    return NextResponse.json(data, { headers: { "X-Cache": "MISS" } })
  } catch (err) {
    console.error("Commodity history fetch error:", err)
    if (cache) {
      const data = commodity ? cache.data.filter(d => d.commodity === commodity) : cache.data
      return NextResponse.json(data, { headers: { "X-Cache": "STALE" } })
    }
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
