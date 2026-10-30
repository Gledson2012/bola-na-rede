import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}

/** Cabeçalho padrão das telas: título grande, subtítulo curto e ação opcional. */
export function PageHeader({ eyebrow, title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-3 pt-3", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-0.5 text-[26px] font-black leading-none tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-1.5 pt-0.5">{action}</div>}
    </header>
  )
}
