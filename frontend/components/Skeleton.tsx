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
