import { NextResponse } from "next/server"

// WFP Global Food Prices - Nigeria (ISO3: NGA)
// Updated monthly. Free, no API key needed.
// Source: https://data.humdata.org/dataset/global-wfp-food-prices (CC BY-IGO)
const WFP_URL = "https://data.humdata.org/dataset/31579af5-3895-4002-9ee3-c50857480785/resource/502190c6-0d3d-4b84-977e-ef062f053662/download/wfp_food_prices_global_2026.csv"

// Commodities we care about, mapped to display names
const TARGET_COMMODITIES: Record<string, string> = {
  "Rice (local)":     "Local Rice",
  "Rice (imported)":  "Imported Rice",
  "Maize flour":      "Maize Flour",
  "Beans (white)":    "White Beans",
  "Beans (red)":      "Red Beans",
  "Cowpeas":          "Cowpeas",
  "Tomatoes":         "Tomatoes",
  "Yam":              "Yam",
  "Onions":           "Onions",
  "Groundnuts":       "Groundnuts",
  "Millet":           "Millet",
  "Sorghum":          "Sorghum",
  "Oil (palm)":       "Palm Oil",
  "Oil (vegetable)":  "Vegetable Oil",
  "Meat (beef)":      "Beef",
  "Fish":             "Fish",
}

export interface CommodityPrice {
  commodity: string
  displayName: string
  price: number       // average NGN price per unit
  unit: string
  currency: string
  date: string        // most recent date
  marketCount: number // how many markets reported
  usdPrice: number
}

// Cache in memory for 6 hours (data only updates monthly)
let cache: { data: CommodityPrice[]; fetchedAt: number } | null = null
const CACHE_MS = 6 * 60 * 60 * 1000

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return NextResponse.json(cache.data, {
      headers: { "X-Cache": "HIT", "X-Fetched-At": new Date(cache.fetchedAt).toISOString() }
    })
  }

  try {
    const res = await fetch(WFP_URL, {
      next: { revalidate: 21600 }, // 6h
      redirect: "follow",
    })
    if (!res.ok) throw new Error(`WFP fetch failed: ${res.status}`)

    const csv = await res.text()
    const lines = csv.split("\n")
    const headers = lines[0].split(",")

    const idx = (col: string) => headers.indexOf(col)
    const iIso = idx("countryiso3")
    const iCommodity = idx("commodity")
    const iPrice = idx("price")
    const iUsd = idx("usdprice")
    const iUnit = idx("unit")
    const iCurrency = idx("currency")
    const iDate = idx("date")

    // Aggregate: for each commodity, collect all Nigeria retail prices and average them
    const agg: Record<string, { prices: number[]; usdPrices: number[]; unit: string; currency: string; date: string }> = {}

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")
      if (cols[iIso] !== "NGA") continue
      const commodity = cols[iCommodity]
      if (!TARGET_COMMODITIES[commodity]) continue
      const price = parseFloat(cols[iPrice])
      const usd = parseFloat(cols[iUsd])
      if (isNaN(price) || price <= 0) continue

      if (!agg[commodity]) {
        agg[commodity] = { prices: [], usdPrices: [], unit: cols[iUnit] || "KG", currency: cols[iCurrency] || "NGN", date: cols[iDate] || "" }
      }
      agg[commodity].prices.push(price)
      if (!isNaN(usd)) agg[commodity].usdPrices.push(usd)
      // Keep latest date
      if (cols[iDate] > agg[commodity].date) agg[commodity].date = cols[iDate]
    }

    const result: CommodityPrice[] = Object.entries(agg)
      .map(([commodity, { prices, usdPrices, unit, currency, date }]) => ({
        commodity,
        displayName: TARGET_COMMODITIES[commodity],
        price: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
        unit,
        currency,
        date,
        marketCount: prices.length,
        usdPrice: usdPrices.length
          ? parseFloat((usdPrices.reduce((s, p) => s + p, 0) / usdPrices.length).toFixed(2))
          : 0,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))

    cache = { data: result, fetchedAt: Date.now() }
    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS", "X-Fetched-At": new Date().toISOString() }
    })
  } catch (err) {
    console.error("Commodity prices fetch error:", err)
    // Return stale cache if available
    if (cache) return NextResponse.json(cache.data, { headers: { "X-Cache": "STALE" } })
    return NextResponse.json({ error: "Failed to fetch commodity prices" }, { status: 500 })
  }
}
