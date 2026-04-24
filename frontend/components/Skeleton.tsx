export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-md ${className}`} role="status" aria-label="Loading" />
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card flex flex-col" aria-label="Loading product">
      {/* Image */}
      <div className="h-44 w-full bg-muted animate-pulse" />
      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-24" />
        </div>
        <div className="flex items-baseline gap-1 mt-auto">
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
          <div className="h-3 bg-muted rounded animate-pulse w-12 ml-auto" />
        </div>
      </div>
      {/* Actions */}
      <div className="px-3 pb-3 flex gap-1.5">
        <div className="h-8 flex-1 bg-muted rounded-xl animate-pulse" />
        <div className="h-8 flex-1 bg-muted rounded-xl animate-pulse" />
        <div className="h-8 w-8 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
