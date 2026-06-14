export type MembershipTier = "Seed" | "Sprout" | "Grower" | "Harvester" | "Champion"

export interface MembershipScore {
  total: number
  tier: MembershipTier
  breakdown: {
    profileComplete: number   // max 20
    accountAge: number        // max 20
    orders: number            // max 30
    noDisputes: number        // max 20
    verified: number          // max 10
  }
  isAutoVerified: boolean
}

export interface MembershipInput {
  hasName: boolean
  hasPhone: boolean
  hasLocation: boolean
  hasAvatar: boolean
  createdAt: string
  ordersCount: number
  hasDisputes: boolean
  isVerified: boolean
}

export const TIERS: { tier: MembershipTier; min: number; max: number; color: string; bg: string; emoji: string; description: string }[] = [
  { tier: "Seed",      min: 0,  max: 19,  color: "text-stone-600",   bg: "bg-stone-100 dark:bg-stone-900/40",   emoji: "🌱", description: "Just getting started on Foodra" },
  { tier: "Sprout",    min: 20, max: 39,  color: "text-lime-700",    bg: "bg-lime-100 dark:bg-lime-900/40",     emoji: "🌿", description: "Building your presence on the platform" },
  { tier: "Grower",    min: 40, max: 59,  color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/40", emoji: "🌾", description: "An active and trusted community member" },
  { tier: "Harvester", min: 60, max: 79,  color: "text-green-700",   bg: "bg-green-100 dark:bg-green-900/40",   emoji: "🏆", description: "A highly trusted member of Foodra" },
  { tier: "Champion",  min: 80, max: 100, color: "text-[#118C4C]",   bg: "bg-[#118C4C]/10",                     emoji: "⭐", description: "Elite verified member — enjoy a 5% discount on all purchases" },
]

export const STEPS = [
  { label: "Complete your profile", detail: "Add name, phone, location and avatar", points: 20, key: "profileComplete" },
  { label: "Be an active member", detail: "Account age earns up to 20 points (2pts/week)", points: 20, key: "accountAge" },
  { label: "Place orders", detail: "Each order earns 5 points (up to 6 orders)", points: 30, key: "orders" },
  { label: "Stay dispute-free", detail: "No disputes on your account", points: 20, key: "noDisputes" },
  { label: "Reach Champion tier", detail: "Score 80+ to get auto-verified by Foodra", points: 10, key: "verified" },
]

export function computeMembership(input: MembershipInput): MembershipScore {
  const profileComplete = (input.hasName && input.hasPhone && input.hasLocation && input.hasAvatar) ? 20 : 0
  const createdMs = input.createdAt ? new Date(input.createdAt).getTime() : Date.now()
  const weeksOld = isNaN(createdMs) ? 0 : Math.floor((Date.now() - createdMs) / (7 * 24 * 60 * 60 * 1000))
  const accountAge = Math.min(weeksOld * 2, 20)
  const orders = Math.min(input.ordersCount * 5, 30)
  const noDisputes = input.hasDisputes ? 0 : 20
  const verified = input.isVerified ? 10 : 0

  const total = Math.min(100, Math.max(0, profileComplete + accountAge + orders + noDisputes + verified))
  const tier = TIERS.find(t => total >= t.min && total <= t.max)?.tier ?? "Seed"
  const isAutoVerified = total >= 80

  return { total, tier, breakdown: { profileComplete, accountAge, orders, noDisputes, verified }, isAutoVerified }
}
