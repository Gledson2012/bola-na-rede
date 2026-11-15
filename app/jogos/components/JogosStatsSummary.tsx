import { memo } from "react"

interface JogosStatsSummaryProps {
  total: number
  live: number
  upcoming: number
  finished: number
}

export const JogosStatsSummary = memo(function JogosStatsSummary({
  total,
  live,
  upcoming,
  finished,
}: JogosStatsSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border/70 bg-card p-3 text-center">
      <div>
        <div className="text-[10px] font-semibold uppercase text-muted-foreground">Total</div>
        <div className="text-sm font-black text-foreground">{total}</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase text-live">Ao vivo</div>
        <div className="text-sm font-black text-live">{live}</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase text-muted-foreground">Em breve</div>
        <div className="text-sm font-black text-foreground">{upcoming}</div>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase text-muted-foreground">Fim</div>
        <div className="text-sm font-black text-foreground">{finished}</div>
      </div>
    </div>
  )
})
