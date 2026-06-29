// Base shimmer block
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-muted rounded-md before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

// ─── Product Card (Marketplace) ──────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card flex flex-col" aria-label="Loading product">
      <Skeleton className="h-32 sm:h-44 w-full rounded-none" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center gap-1.5 mt-1">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-24 mt-auto" />
      </div>
      <div className="px-3 pb-3 flex gap-1.5">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Order Card (Orders page) ─────────────────────────────────────────────────
export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      {/* header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      {/* journey bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      {/* items */}
      <div className="flex gap-2">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      {/* actions */}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Orders page full skeleton ────────────────────────────────────────────────
export function OrdersPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      {/* tabs */}
      <div className="flex gap-1.5 mb-5">
        {[80, 72, 88, 72, 80, 90].map((w, i) => (
          <Skeleton key={i} className={`h-7 w-20 rounded-full`} />
        ))}
      </div>
      {/* cards */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <OrderCardSkeleton key={i} />)}
      </div>
    </div>
  )
}

// ─── Training card ────────────────────────────────────────────────────────────
export function TrainingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function TrainingPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      {/* filters */}
      <div className="flex gap-3 mb-8">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <TrainingCardSkeleton key={i} />)}
      </div>
    </div>
  )
}

// ─── Funding page ─────────────────────────────────────────────────────────────
export function FundingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  )
}

export function FundingPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      {/* search + filters */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
      </div>
      {/* cards */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <FundingCardSkeleton key={i} />)}
      </div>
    </div>
  )
}

// ─── Wallet page ──────────────────────────────────────────────────────────────
export function WalletPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-5">
      {/* balance card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-32" />
        {/* action buttons */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
      {/* network row */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      {/* txn history */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Profile page ─────────────────────────────────────────────────────────────
export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      {/* avatar + name */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <Skeleton className="h-6 w-48 mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
          <Skeleton className="h-3 w-56 mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        {/* completion ring placeholder */}
        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      </div>
      {/* stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 text-center space-y-1.5">
            <Skeleton className="h-6 w-10 mx-auto" />
            <Skeleton className="h-3 w-14 mx-auto" />
          </div>
        ))}
      </div>
      {/* tabs */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
      </div>
      {/* tab content: order list */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
      </div>
    </div>
  )
}

// ─── Sales dashboard ──────────────────────────────────────────────────────────
export function SalesPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      {/* chart placeholder */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      {/* top products */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shop / Cart page ─────────────────────────────────────────────────────────
export function ShopPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-5">
      <Skeleton className="h-7 w-32 mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
          <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-6" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      ))}
      {/* summary */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ─── Wishlist page ────────────────────────────────────────────────────────────
export function WishlistPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
            <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-20" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-7 flex-1 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Order detail page ────────────────────────────────────────────────────────
export function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-5">
      {/* back + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* status card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
      {/* items */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      {/* delivery info */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      {/* actions */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-56" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Market Prices page ───────────────────────────────────────────────────────
export function CommodityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden" aria-label="Loading commodity">
      {/* chart area */}
      <div className="relative h-28 bg-muted/60">
        <Skeleton className="absolute top-2.5 left-3 w-8 h-8 rounded-xl" />
        <Skeleton className="absolute top-2.5 right-3 w-12 h-5 rounded-lg" />
        {/* sparkline bars */}
        <div className="absolute bottom-3 inset-x-3 flex items-end gap-0.5 h-12">
          {[55,70,45,80,60,90,65,75,50,85].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-muted-foreground/15 animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
      {/* body */}
      <div className="p-3 space-y-2.5">
        <div className="space-y-1">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-md" />
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-2.5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3.5 w-16 rounded-md" />
        </div>
        {/* AI trend row */}
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-2.5 py-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function MarketPricesPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35]">
        {/* ticker strip */}
        <div className="h-9 bg-black/20 border-b border-white/10 flex items-center px-4 gap-4 overflow-hidden">
          {[110, 90, 120, 85, 100, 95, 115].map((w, i) => (
            <div key={i} className="h-2.5 rounded-full bg-white/15 animate-pulse shrink-0" style={{ width: w, animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-5 w-32 rounded-full bg-white/20 animate-pulse" />
              </div>
              <div className="h-9 w-72 rounded-xl bg-white/20 animate-pulse" />
              <div className="h-4 w-56 rounded-lg bg-white/15 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 rounded bg-white/15 animate-pulse" />
              <div className="h-9 w-28 rounded-xl bg-white/20 animate-pulse" />
            </div>
          </div>
          {/* stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-3 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-7 w-10 rounded-lg bg-white/25 animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-white/15 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-white/15 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="container mx-auto max-w-5xl flex flex-wrap gap-3">
          <div className="flex-1 min-w-40">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-[74px] rounded-xl" />
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <CommodityCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Assets page ──────────────────────────────────────────────────────────────
export function AssetPositionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden" aria-label="Loading asset">
      {/* accent bar */}
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="p-4 space-y-4">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-6 w-14 rounded-xl shrink-0" />
        </div>
        {/* sparkline */}
        <div className="flex items-end gap-0.5 h-16">
          {[50,65,40,75,55,80,60,70,45,85,55,70].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-muted-foreground/15 animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
        {/* stats 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-2.5 space-y-1.5">
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded-lg" />
            </div>
          ))}
        </div>
        {/* AI row */}
        <div className="flex items-start gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl px-3 py-2.5">
          <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-24 rounded" />
            <Skeleton className="h-2.5 w-36 rounded" />
          </div>
        </div>
        {/* action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function AssetsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#118C4C] via-[#0d7a42] to-[#1a5c35]">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-5 w-36 rounded-full bg-white/20 animate-pulse" />
              </div>
              <div className="h-9 w-40 rounded-xl bg-white/20 animate-pulse" />
              <div className="h-4 w-64 rounded-lg bg-white/15 animate-pulse" />
            </div>
            <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-4 space-y-2 min-w-[180px]">
              <div className="h-3 w-24 rounded bg-white/20 animate-pulse ml-auto" />
              <div className="h-9 w-36 rounded-xl bg-white/25 animate-pulse ml-auto" />
              <div className="h-4 w-28 rounded-lg bg-white/15 animate-pulse ml-auto" />
            </div>
          </div>
          {/* stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-3 space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 animate-pulse" />
                <div className="h-6 w-20 rounded-lg bg-white/25 animate-pulse" />
                <div className="h-2.5 w-24 rounded bg-white/15 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border bg-background px-4 pt-2">
        <div className="container mx-auto max-w-5xl flex gap-2">
          {[
            { w: 100, label: "Holdings" },
            { w: 90,  label: "History" },
          ].map((t, i) => (
            <div key={i} className="h-9 rounded-lg bg-muted animate-pulse mb-0" style={{ width: t.w }} />
          ))}
        </div>
      </div>

      {/* Position cards */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <AssetPositionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
