export default function Loading() {
  return (
    <div className="space-y-4 py-3">
      <div className="h-28 rounded-2xl bg-muted animate-pulse" />
      <div className="h-10 rounded-xl bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
