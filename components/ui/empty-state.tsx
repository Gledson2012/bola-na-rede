import type { ElementType, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: ElementType<{ className?: string }>
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: "default" | "error"
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-black text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[17rem] text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
