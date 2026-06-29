// Foodra Market Assets — localStorage store
// Simulates a commodity position ledger backed by real WFP prices

export interface AssetPosition {
  commodity: string      // key matching CommodityPrice.commodity
  displayName: string
  emoji: string
  unit: string
  quantity: number       // total kg / units held
  avgBuyPrice: number    // weighted average buy price in NGN
  boughtAt: string       // ISO timestamp of first/latest buy
  priceAlert?: number    // alert user when price reaches this
}

export interface AssetTrade {
  id: string
  type: "buy" | "sell" | "deliver"
  commodity: string
  displayName: string
  quantity: number
  price: number          // price per unit at time of trade
  total: number
  timestamp: string
}

const POSITIONS_KEY = "fdr_asset_positions"
const TRADES_KEY    = "fdr_asset_trades"
const PRICES_KEY    = "fdr_price_snapshots"   // commodity → price[]

// ─── Positions ────────────────────────────────────────────────────────────────

export function getPositions(): AssetPosition[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(POSITIONS_KEY) ?? "[]")
  } catch { return [] }
}

export function savePositions(positions: AssetPosition[]) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
}

export function buyAsset(
  commodity: string,
  displayName: string,
  emoji: string,
  unit: string,
  qty: number,
  pricePerUnit: number
): AssetPosition[] {
  const positions = getPositions()
  const existing = positions.find(p => p.commodity === commodity)

  if (existing) {
    // Weighted average
    const totalQty = existing.quantity + qty
    existing.avgBuyPrice = (existing.avgBuyPrice * existing.quantity + pricePerUnit * qty) / totalQty
    existing.quantity = totalQty
    existing.boughtAt = new Date().toISOString()
  } else {
    positions.push({ commodity, displayName, emoji, unit, quantity: qty, avgBuyPrice: pricePerUnit, boughtAt: new Date().toISOString() })
  }

  savePositions(positions)
  recordTrade({ type: "buy", commodity, displayName, quantity: qty, price: pricePerUnit })
  recordPriceSnapshot(commodity, pricePerUnit)
  return positions
}

export function sellAsset(commodity: string, qty: number, pricePerUnit: number): AssetPosition[] {
  const positions = getPositions()
  const pos = positions.find(p => p.commodity === commodity)
  if (!pos) return positions

  const displayName = pos.displayName
  pos.quantity = parseFloat((pos.quantity - qty).toFixed(3))
  if (pos.quantity <= 0) {
    const idx = positions.indexOf(pos)
    positions.splice(idx, 1)
  }

  savePositions(positions)
  recordTrade({ type: "sell", commodity, displayName, quantity: qty, price: pricePerUnit })
  return positions
}

export function deliverAsset(commodity: string, qty: number, pricePerUnit: number): AssetPosition[] {
  const positions = getPositions()
  const pos = positions.find(p => p.commodity === commodity)
  if (!pos) return positions

  const displayName = pos.displayName
  pos.quantity = parseFloat((pos.quantity - qty).toFixed(3))
  if (pos.quantity <= 0) {
    const idx = positions.indexOf(pos)
    positions.splice(idx, 1)
  }

  savePositions(positions)
  recordTrade({ type: "deliver", commodity, displayName, quantity: qty, price: pricePerUnit })
  return positions
}

export function setPriceAlert(commodity: string, alertPrice: number | null) {
  const positions = getPositions()
  const pos = positions.find(p => p.commodity === commodity)
  if (pos) {
    if (alertPrice === null) {
      delete pos.priceAlert
    } else {
      pos.priceAlert = alertPrice
    }
    savePositions(positions)
  }
}

// ─── Trades ───────────────────────────────────────────────────────────────────

function recordTrade(t: Omit<AssetTrade, "id" | "total" | "timestamp">) {
  const trades = getTrades()
  trades.unshift({
    ...t,
    id: Math.random().toString(36).slice(2),
    total: t.quantity * t.price,
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades.slice(0, 200)))
}

export function getTrades(): AssetTrade[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(TRADES_KEY) ?? "[]")
  } catch { return [] }
}

// ─── Price snapshots (for sparkline + AI trend) ────────────────────────────────

export function recordPriceSnapshot(commodity: string, price: number) {
  if (typeof window === "undefined") return
  try {
    const all: Record<string, number[]> = JSON.parse(localStorage.getItem(PRICES_KEY) ?? "{}")
    if (!all[commodity]) all[commodity] = []
    all[commodity].push(price)
    if (all[commodity].length > 30) all[commodity] = all[commodity].slice(-30)
    localStorage.setItem(PRICES_KEY, JSON.stringify(all))
  } catch { /* */ }
}

export function getPriceHistory(commodity: string): number[] {
  if (typeof window === "undefined") return []
  try {
    const all: Record<string, number[]> = JSON.parse(localStorage.getItem(PRICES_KEY) ?? "{}")
    return all[commodity] ?? []
  } catch { return [] }
}

// ─── AI Prediction (simple linear regression on price history) ─────────────

export function predictNextPrice(history: number[]): number | null {
  if (history.length < 3) return null
  const n = history.length
  const sumX = (n * (n - 1)) / 2
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const sumY = history.reduce((a, b) => a + b, 0)
  const sumXY = history.reduce((s, v, i) => s + i * v, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  return Math.round(intercept + slope * n)
}

// ─── Portfolio summary ────────────────────────────────────────────────────────

export function calcPortfolio(positions: AssetPosition[], livePrices: Record<string, number>) {
  let totalCost = 0, totalValue = 0
  for (const p of positions) {
    totalCost  += p.avgBuyPrice * p.quantity
    totalValue += (livePrices[p.commodity] ?? p.avgBuyPrice) * p.quantity
  }
  const pnl = totalValue - totalCost
  const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0
  return { totalCost, totalValue, pnl, pnlPct }
}
