export default function Loading() {
  return (
    <div className="space-y-4 py-3">
      <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
      <div className="h-10 animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[60px] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`metric-${i}`} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
