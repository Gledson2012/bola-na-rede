"use client"

import { cn } from "@/lib/utils"

export interface SegmentOption<T extends string = string> {
  value: T
  label: string
  count?: number
  tone?: "default" | "live" | "warning"
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentOption<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

/** Abas compactas com contador — substitui as fileiras de botões gigantes. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-0.5 overflow-x-auto rounded-2xl border border-border/70 bg-muted/60 p-1 scrollbar-hide",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "flex min-w-0 flex-1 basis-0 items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9.5px] font-bold leading-none transition-all",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.tone === "live" && (
              <span className={cn("live-dot h-1 w-1 flex-shrink-0", !active && "opacity-60")} />
            )}
            <span className="truncate whitespace-nowrap">{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  "tabular flex-shrink-0 rounded-full px-1 py-0.5 text-[8.5px] font-black leading-none",
                  active
                    ? option.tone === "live"
                      ? "bg-live/10 text-live"
                      : option.tone === "warning"
                        ? "bg-warning/15 text-warning"
                        : "bg-foreground/[0.06] text-foreground"
                    : "bg-foreground/[0.04] text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
