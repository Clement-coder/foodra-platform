"use client"

import { useMemo } from "react"
import { Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import {
  computeCreditScore,
  getTierColor,
  getRecommendationColor,
  type ApplicationData,
} from "@/lib/creditScore"
import type { FundingApplication } from "@/lib/types"

interface Props {
  application: FundingApplication
  orderCount?: number
  previousApplicationsCount?: number
  previousApprovedCount?: number
  hasCompletedProfile?: boolean
}

export function CreditScoreCard({
  application,
  orderCount = 0,
  previousApplicationsCount = 0,
  previousApprovedCount = 0,
  hasCompletedProfile = false,
}: Props) {
  const result = useMemo(() => {
    const data: ApplicationData = {
      farmSize: application.farmSize,
      farmType: application.farmType,
      yearsOfExperience: application.yearsOfExperience,
      amountRequested: application.amountRequested,
      expectedOutcome: application.expectedOutcome,
      location: application.location,
      hasCompletedProfile,
      previousApplicationsCount,
      previousApprovedCount,
      orderCount,
    }
    return computeCreditScore(data)
  }, [application, orderCount, previousApplicationsCount, previousApprovedCount, hasCompletedProfile])

  const RecommendationIcon =
    result.recommendation === "Approve"
      ? CheckCircle
      : result.recommendation === "Reject"
        ? XCircle
        : AlertTriangle

  // Score arc percentage for the gauge
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (result.score / 100) * circumference

  const scoreColor =
    result.score >= 80
      ? "#16a34a"
      : result.score >= 65
        ? "#2563eb"
        : result.score >= 50
          ? "#ca8a04"
          : result.score >= 35
            ? "#ea580c"
            : "#dc2626"

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-[#118C4C]" />
        <h3 className="font-semibold text-foreground">AI Credit Score</h3>
        <span className="ml-auto text-xs text-muted-foreground">Automated assessment</span>
      </div>

      {/* Score gauge + tier */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
              className="text-muted/30" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>{result.score}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getTierColor(result.tier)}`}>
              {result.tier}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${getRecommendationColor(result.recommendation)}`}>
              <RecommendationIcon className="w-3 h-3" />
              {result.recommendation}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score Breakdown</span>
        </div>
        {result.breakdown.map((f) => (
          <div key={f.factor}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground font-medium">{f.factor}</span>
              <span className="text-muted-foreground">{f.points}/{f.maxPoints}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(f.points / f.maxPoints) * 100}%`,
                  backgroundColor: f.points / f.maxPoints >= 0.7 ? "#16a34a" : f.points / f.maxPoints >= 0.4 ? "#ca8a04" : "#dc2626",
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{f.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
