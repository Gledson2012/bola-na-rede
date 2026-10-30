"use client"

import { cn } from "@/lib/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded bg-muted", className)}
      {...props}
    />
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-3 py-3" aria-hidden="true">
      <div className="flex w-10 flex-col items-center gap-1.5">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-2 w-6" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-4" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  )
}

export function TeamCardSkeleton({
  showLeague = true,
  showForm = true,
  showRecord = true,
  showPoints = true,
  showPosition = true,
}: {
  showLeague?: boolean
  showForm?: boolean
  showRecord?: boolean
  showPoints?: boolean
  showPosition?: boolean
} = {}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showPosition && <Skeleton className="h-5 w-5 rounded-md" />}
          <Skeleton className="h-[42px] w-[42px] rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-10" />
              {showLeague && <Skeleton className="h-3 w-14" />}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {showPoints && <Skeleton className="h-6 w-10 rounded-lg" />}
          {showForm && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 rounded-full" />
              ))}
            </div>
          )}
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
      {showRecord && <Skeleton className="mt-2 h-3 w-24" />}
    </div>
  )
}

export function NewsCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="space-y-2 p-3.5">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function LeagueTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" aria-hidden="true">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left divide-y divide-border/50">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-9 py-3 pl-3 pr-1"><Skeleton className="h-4 w-6" /></th>
              <th className="px-2 py-3"><Skeleton className="h-4 w-20" /></th>
              <th className="w-9 px-1 py-3"><Skeleton className="h-4 w-6" /></th>
              <th className="w-7 px-1 py-3"><Skeleton className="h-4 w-5" /></th>
              <th className="w-8 px-1 py-3"><Skeleton className="h-4 w-5" /></th>
              <th className="hidden w-14 px-1 py-3 sm:table-cell"><Skeleton className="h-4 w-10" /></th>
              <th className="hidden w-8 px-1 py-3 lg:table-cell"><Skeleton className="h-4 w-5" /></th>
              <th className="hidden w-8 px-1 py-3 md:table-cell"><Skeleton className="h-4 w-5" /></th>
              <th className="hidden w-8 px-1 py-3 md:table-cell"><Skeleton className="h-4 w-5" /></th>
              <th className="hidden w-8 px-1 py-3 md:table-cell"><Skeleton className="h-4 w-5" /></th>
              <th className="hidden w-8 px-1 py-3 lg:table-cell"><Skeleton className="h-4 w-5" /></th>
              <th className="hidden w-8 px-1 py-3 lg:table-cell"><Skeleton className="h-4 w-5" /></th>
              <th className="w-6 py-3 pr-3" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-2.5 pl-3 pr-1"><Skeleton className="h-4 w-6" /></td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </td>
                <td className="px-1 py-2.5"><Skeleton className="h-4 w-6" /></td>
                <td className="px-1 py-2.5"><Skeleton className="h-4 w-5" /></td>
                <td className="px-1 py-2.5"><Skeleton className="h-4 w-5" /></td>
                <td className="hidden px-1 py-2.5 sm:table-cell"><Skeleton className="h-4 w-10" /></td>
                <td className="hidden px-1 py-2.5 lg:table-cell"><Skeleton className="h-4 w-5" /></td>
                <td className="hidden px-1 py-2.5 md:table-cell"><Skeleton className="h-4 w-5" /></td>
                <td className="hidden px-1 py-2.5 md:table-cell"><Skeleton className="h-4 w-5" /></td>
                <td className="hidden px-1 py-2.5 md:table-cell"><Skeleton className="h-4 w-5" /></td>
                <td className="hidden px-1 py-2.5 lg:table-cell"><Skeleton className="h-4 w-5" /></td>
                <td className="hidden px-1 py-2.5 lg:table-cell"><Skeleton className="h-4 w-5" /></td>
                <td className="py-2.5 pr-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MatchDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
              <Skeleton className="w-24 h-12" />
              <Skeleton className="w-28 h-3" />
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="text-right">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="w-16 h-16 rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="p-3 border-b border-border/50">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2 rounded-lg border border-border/50 bg-muted/30 animate-pulse">
              <Skeleton className="w-6 h-6 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TeamDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="col-span-2 rounded-xl border border-border bg-card p-3 h-20" />
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="p-3 border-b border-border/50">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-end gap-2 p-3 h-20 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
