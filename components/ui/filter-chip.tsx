"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FilterChipProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  count?: number
  className?: string
  title?: string
}

/** Chip de filtro horizontal (ligas, regiões, categorias). */
export function FilterChip({
  active = false,
  onClick,
  children,
  count,
  className,
  title,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        "press flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/80 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
        className
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "tabular rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none",
            active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
