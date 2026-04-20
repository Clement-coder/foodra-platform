/**
 * AI Credit Scoring for Foodra Funding Applications
 *
 * Rule-based scoring engine that evaluates farmer creditworthiness
 * based on application data. Returns a score 0–100 with a risk tier
 * and a breakdown of contributing factors.
 *
 * This is a deterministic, explainable model — no external API needed.
 * It can be upgraded to an ML model later by swapping the `score()` function.
 */

export type RiskTier = "Excellent" | "Good" | "Fair" | "Poor" | "High Risk"

export interface CreditScoreResult {
  score: number          // 0–100
  tier: RiskTier
  recommendation: "Approve" | "Review" | "Reject"
  breakdown: ScoreFactor[]
  summary: string
}

export interface ScoreFactor {
  factor: string
  points: number
  maxPoints: number
  note: string
}

export interface ApplicationData {
  farmSize: number           // hectares
  farmType: string           // e.g. "Crop Farming", "Poultry", etc.
  yearsOfExperience: number
  amountRequested: number    // NGN
  expectedOutcome: string    // free text
  location: string
  // Optional enrichment from user profile
  hasCompletedProfile?: boolean
  previousApplicationsCount?: number
  previousApprovedCount?: number
  orderCount?: number        // number of marketplace orders fulfilled
}

const MAX_SCORE = 100

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

export function computeCreditScore(data: ApplicationData): CreditScoreResult {
  const factors: ScoreFactor[] = []

  // ── 1. Years of Experience (max 25 pts) ──────────────────────────────────
  let expPoints = 0
  if (data.yearsOfExperience >= 10) expPoints = 25
  else if (data.yearsOfExperience >= 5) expPoints = 20
  else if (data.yearsOfExperience >= 3) expPoints = 14
  else if (data.yearsOfExperience >= 1) expPoints = 8
  else expPoints = 2

  factors.push({
    factor: "Farming Experience",
    points: expPoints,
    maxPoints: 25,
    note: data.yearsOfExperience >= 5
      ? `${data.yearsOfExperience} years — strong track record`
      : data.yearsOfExperience >= 1
        ? `${data.yearsOfExperience} year(s) — developing experience`
        : "Less than 1 year — limited history",
  })

  // ── 2. Farm Size (max 20 pts) ─────────────────────────────────────────────
  let sizePoints = 0
  if (data.farmSize >= 10) sizePoints = 20
  else if (data.farmSize >= 5) sizePoints = 16
  else if (data.farmSize >= 2) sizePoints = 12
  else if (data.farmSize >= 0.5) sizePoints = 7
  else sizePoints = 3

  factors.push({
    factor: "Farm Size",
    points: sizePoints,
    maxPoints: 20,
    note: `${data.farmSize} hectare(s) — ${data.farmSize >= 5 ? "substantial" : data.farmSize >= 2 ? "moderate" : "small"} operation`,
  })

  // ── 3. Loan-to-Farm-Value Ratio (max 20 pts) ──────────────────────────────
  // Rough estimate: 1 hectare of farmland ≈ ₦500,000 value
  const estimatedFarmValue = data.farmSize * 500_000
  const ltvRatio = estimatedFarmValue > 0 ? data.amountRequested / estimatedFarmValue : 10
  let ltvPoints = 0
  if (ltvRatio <= 0.3) ltvPoints = 20
  else if (ltvRatio <= 0.5) ltvPoints = 16
  else if (ltvRatio <= 0.8) ltvPoints = 10
  else if (ltvRatio <= 1.2) ltvPoints = 5
  else ltvPoints = 1

  factors.push({
    factor: "Loan-to-Farm-Value Ratio",
    points: ltvPoints,
    maxPoints: 20,
    note: `Requesting ₦${data.amountRequested.toLocaleString()} vs ~₦${estimatedFarmValue.toLocaleString()} estimated farm value (${(ltvRatio * 100).toFixed(0)}% LTV)`,
  })

  // ── 4. Farm Type Diversity / Stability (max 10 pts) ──────────────────────
  const stableFarmTypes = ["Crop Farming", "Mixed Farming", "Horticulture", "Agroforestry"]
  const moderateFarmTypes = ["Poultry", "Livestock", "Aquaculture", "Dairy"]
  let farmTypePoints = 5
  if (stableFarmTypes.some((t) => data.farmType.toLowerCase().includes(t.toLowerCase()))) {
    farmTypePoints = 10
  } else if (moderateFarmTypes.some((t) => data.farmType.toLowerCase().includes(t.toLowerCase()))) {
    farmTypePoints = 7
  }

  factors.push({
    factor: "Farm Type",
    points: farmTypePoints,
    maxPoints: 10,
    note: `${data.farmType} — ${farmTypePoints >= 8 ? "stable, low-risk sector" : "moderate risk sector"}`,
  })

  // ── 5. Expected Outcome Quality (max 10 pts) ──────────────────────────────
  const outcomeLength = (data.expectedOutcome || "").trim().length
  const hasNumbers = /\d/.test(data.expectedOutcome || "")
  const hasKeywords = /(yield|harvest|revenue|profit|income|produce|ton|kg|bag|expand|employ|hire)/i.test(data.expectedOutcome || "")
  let outcomePoints = 0
  if (outcomeLength >= 100 && hasNumbers && hasKeywords) outcomePoints = 10
  else if (outcomeLength >= 60 && (hasNumbers || hasKeywords)) outcomePoints = 7
  else if (outcomeLength >= 30) outcomePoints = 4
  else outcomePoints = 1

  factors.push({
    factor: "Expected Outcome Quality",
    points: outcomePoints,
    maxPoints: 10,
    note: outcomePoints >= 8
      ? "Detailed, quantified outcome with clear goals"
      : outcomePoints >= 5
        ? "Reasonable outcome description"
        : "Vague or minimal outcome description",
  })

  // ── 6. Profile Completeness (max 5 pts) ───────────────────────────────────
  const profilePoints = data.hasCompletedProfile ? 5 : 2
  factors.push({
    factor: "Profile Completeness",
    points: profilePoints,
    maxPoints: 5,
    note: data.hasCompletedProfile ? "Full profile — builds trust" : "Incomplete profile — reduces confidence",
  })

  // ── 7. Platform Track Record (max 10 pts) ─────────────────────────────────
  let trackPoints = 0
  const prevApproved = data.previousApprovedCount ?? 0
  const prevTotal = data.previousApplicationsCount ?? 0
  const orders = data.orderCount ?? 0

  if (prevApproved > 0) trackPoints += 5
  if (orders >= 10) trackPoints += 5
  else if (orders >= 3) trackPoints += 3
  else if (orders >= 1) trackPoints += 1

  trackPoints = clamp(trackPoints, 0, 10)

  factors.push({
    factor: "Platform Track Record",
    points: trackPoints,
    maxPoints: 10,
    note: [
      prevApproved > 0 ? `${prevApproved} previously approved application(s)` : null,
      orders > 0 ? `${orders} marketplace order(s) fulfilled` : null,
      trackPoints === 0 ? "No platform history yet" : null,
    ].filter(Boolean).join("; ") || "No platform history",
  })

  // ── Total ─────────────────────────────────────────────────────────────────
  const totalPoints = factors.reduce((s, f) => s + f.points, 0)
  const score = clamp(Math.round((totalPoints / MAX_SCORE) * 100), 0, 100)

  let tier: RiskTier
  let recommendation: CreditScoreResult["recommendation"]
  let summary: string

  if (score >= 80) {
    tier = "Excellent"
    recommendation = "Approve"
    summary = "Strong application with solid farming experience, adequate farm size, and a clear repayment capacity. Recommended for approval."
  } else if (score >= 65) {
    tier = "Good"
    recommendation = "Approve"
    summary = "Good application with reasonable indicators. Minor gaps exist but overall risk is manageable. Recommended for approval with standard terms."
  } else if (score >= 50) {
    tier = "Fair"
    recommendation = "Review"
    summary = "Moderate application. Some risk factors present — manual review recommended before approval. Consider reduced loan amount or collateral."
  } else if (score >= 35) {
    tier = "Poor"
    recommendation = "Review"
    summary = "Below-average application with notable risk factors. Requires thorough manual review. Consider requesting additional documentation."
  } else {
    tier = "High Risk"
    recommendation = "Reject"
    summary = "High-risk application. Insufficient experience, farm size, or repayment capacity. Not recommended for approval at this time."
  }

  return { score, tier, recommendation, breakdown: factors, summary }
}

export function getTierColor(tier: RiskTier): string {
  switch (tier) {
    case "Excellent": return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
    case "Good": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
    case "Fair": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "Poor": return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
    case "High Risk": return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
  }
}

export function getRecommendationColor(rec: CreditScoreResult["recommendation"]): string {
  switch (rec) {
    case "Approve": return "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300"
    case "Review": return "text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "Reject": return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300"
  }
}
