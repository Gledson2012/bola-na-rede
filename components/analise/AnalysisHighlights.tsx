"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { percent } from "@/lib/utils"
import type { MatchAnalysis } from "@/lib/prediction"
import { TeamLogo } from "@/components/futebol/TeamLogo"

function odd(value: number): string {
  return value > 0.001 ? (1 / value).toFixed(2).replace(".", ",") : "—"
}

/**
 * Destaques: as partidas com a estimativa mais forte do modelo.
 * Considera apenas partidas com bom nível de amostra, para não destacar
 * estimativas frágeis.
 */
export function AnalysisHighlights({ matches }: { matches: MatchAnalysis[] }) {
  const highlights = matches
    .filter(
      (match) => match.available && match.confidenceScore >= 0.7 && match.status !== "finished"
    )
    .map((match) => {
      const probabilities = match.live?.probabilities ?? match.probabilities
      const outcomes = [
        { label: match.home.shortName, value: probabilities.home, accent: "bg-futebol-600" },
        { label: "Empate", value: probabilities.draw, accent: "bg-amber-400" },
        { label: match.away.shortName, value: probabilities.away, accent: "bg-sky-500" },
      ]
      const best = outcomes.reduce((a, b) => (b.value > a.value ? b : a))
      return { match, best, outcomes }
    })
    .sort((a, b) => b.best.value - a.best.value)
    .slice(0, 6)

  if (highlights.length === 0) return null

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black text-xs">
            🔥
          </span>
          <h2 className="text-sm font-black text-foreground">Destaques do Modelo</h2>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Maior Probabilidade
        </p>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {highlights.map(({ match, best, outcomes }) => (
          <Link
            key={match.matchId}
            href={`/jogos/${match.matchId}`}
            className="w-[245px] shrink-0 snap-start rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm transition-all hover:shadow-md hover:border-futebol-500/50 hover:-translate-y-0.5"
          >
            <p className="truncate text-[10px] font-bold text-muted-foreground">
              {match.competition}
            </p>

            <div className="mt-2 flex items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <TeamLogo src={match.home.logo} name={match.home.name} size={22} />
                <span className="truncate text-xs font-bold text-foreground">
                  {match.home.shortName}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                x
              </span>
              <div className="flex min-w-0 items-center justify-end gap-1.5">
                <span className="truncate text-xs font-bold text-foreground">
                  {match.away.shortName}
                </span>
                <TeamLogo src={match.away.logo} name={match.away.name} size={22} />
              </div>
            </div>

            <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-muted">
              {outcomes.map((outcome) => (
                <span
                  key={outcome.label}
                  className={outcome.accent}
                  style={{ width: `${outcome.value * 100}%` }}
                />
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-futebol-500">
                  {best.label} {percent(best.value)}
                </p>
                <p className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                  odd justa {odd(best.value)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
