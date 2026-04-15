export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* Image skeleton */}
      <div className="h-48 bg-muted animate-shimmer relative overflow-hidden">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="h-5 bg-muted rounded-lg w-3/4 animate-shimmer overflow-hidden">
          <div className="h-full w-full shimmer" />
        </div>
        {/* Location */}
        <div className="h-4 bg-muted rounded-lg w-1/2 animate-shimmer overflow-hidden">
          <div className="h-full w-full shimmer" />
        </div>
        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full animate-shimmer overflow-hidden">
            <div className="h-full w-full shimmer" />
          </div>
          <div className="h-6 w-20 bg-muted rounded-full animate-shimmer overflow-hidden">
            <div className="h-full w-full shimmer" />
          </div>
        </div>
        {/* Owner row */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-8 h-8 rounded-full bg-muted animate-shimmer overflow-hidden">
            <div className="h-full w-full shimmer" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-1/3 animate-shimmer overflow-hidden">
              <div className="h-full w-full shimmer" />
            </div>
            <div className="h-3 bg-muted rounded w-1/2 animate-shimmer overflow-hidden">
              <div className="h-full w-full shimmer" />
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <div className="h-10 flex-1 bg-muted rounded-xl animate-shimmer overflow-hidden">
            <div className="h-full w-full shimmer" />
          </div>
          <div className="h-10 flex-1 bg-muted rounded-xl animate-shimmer overflow-hidden">
            <div className="h-full w-full shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
