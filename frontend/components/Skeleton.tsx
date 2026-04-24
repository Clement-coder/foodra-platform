export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-md ${className}`} role="status" aria-label="Loading" />
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card flex flex-col" aria-label="Loading product">
      <div className="h-32 sm:h-44 w-full bg-muted animate-pulse" />
      <div className="p-2 sm:p-3 flex flex-col gap-2 flex-1">
        <div className="h-3.5 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="flex items-center gap-1.5 mt-1">
          <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-20" />
        </div>
        <div className="h-4 bg-muted rounded animate-pulse w-24 mt-auto" />
        <div className="h-3 bg-muted rounded animate-pulse w-16" />
      </div>
      <div className="px-2 sm:px-3 pb-2 sm:pb-3 flex gap-1">
        <div className="h-7 flex-1 bg-muted rounded-xl animate-pulse" />
        <div className="h-7 flex-1 bg-muted rounded-xl animate-pulse" />
        <div className="h-7 w-7 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
