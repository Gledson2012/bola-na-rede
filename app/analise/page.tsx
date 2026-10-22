"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, BarChart3, RefreshCw, Search } from "lucide-react"
import { useAnalysis } from "@/lib/queries"
import type { MatchAnalysis } from "@/lib/prediction"
import { cn, percent } from "@/lib/utils"
import { LiveAlertsControl } from "@/components/live/LiveAlertsControl"
import { MatchAnalysisCard } from "@/components/analise/MatchAnalysisCard"
import { BacktestPanel } from "@/components/analise/BacktestPanel"
import { AnalysisHighlights } from "@/components/analise/AnalysisHighlights"

type MatchFilter = "todos" | "upcoming" | "live" | "finished" | "insufficient"
type SortOption = "probabilidade" | "confianca" | "horario" | "campeonato"

function bestProbability(analysis: MatchAnalysis): number {
  const probabilities = analysis.live?.probabilities ?? analysis.probabilities
  return Math.max(probabilities.home, probabilities.draw, probabilities.away)
}

export default function AnalisePage() {
  const { data, error, isError, isLoading, isRefetching, refetch } = useAnalysis()
  const [filter, setFilter] = useState<MatchFilter>("todos")
  const [sortBy, setSortBy] = useState<SortOption>("probabilidade")
  const [search, setSearch] = useState("")

  const matches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR")

    const filtered = (data?.matches ?? []).filter((match) => {
      if (filter === "insufficient") return !match.available
      if (filter !== "todos" && match.status !== filter) return false
      return true
    })

    const searched = filtered.filter((match) => {
      if (!query) return true
      return [
        match.home.name,
        match.home.shortName,
        match.away.name,
        match.away.shortName,
        match.competition,
        match.competitionCountry,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(query)
    })

    return searched.sort((a, b) => {
      // Partidas ao vivo sempre no topo, independentemente da ordenação.
      const liveDifference = Number(b.status === "live") - Number(a.status === "live")
      if (liveDifference !== 0) return liveDifference

      switch (sortBy) {
        case "probabilidade":
          return bestProbability(b) - bestProbability(a)
        case "confianca":
          return b.confidenceScore - a.confidenceScore
        case "campeonato":
          return (
            a.competition.localeCompare(b.competition, "pt-BR") ||
            bestProbability(b) - bestProbability(a)
          )
        case "horario":
        default:
          return (a.kickoff || "").localeCompare(b.kickoff || "")
      }
    })
  }, [data?.matches, filter, search, sortBy])

  const summary = data?.summary ?? {
    total: 0,
    analyzed: 0,
    upcoming: 0,
    live: 0,
    liveAnalyzed: 0,
    insufficient: 0,
  }

  const filterOptions: Array<{ value: MatchFilter; label: string; count: number }> = [
    { value: "todos", label: "Todas", count: summary.total },
    { value: "upcoming", label: "Próximas", count: summary.upcoming },
    { value: "live", label: "Ao vivo", count: summary.live },
    {
      value: "finished",
      label: "Encerradas",
      count: data?.matches.filter((match) => match.status === "finished").length ?? 0,
    },
    { value: "insufficient", label: "Sem dados", count: summary.insufficient },
  ]

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-futebol-700 to-futebol-500 p-4 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h1 className="text-lg font-black">Análise estatística</h1>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/85">
          Estimativas baseadas nos gols e jogos da classificação. Não usam odds,
          escalações ou xG e não garantem resultados nem lucro.
        </p>
        <p className="mt-1 text-[10px] text-white/75">
          Times com poucos jogos são puxados em direção à média da competição — por
          isso o nível de amostra importa mais que a diferença entre as casas.
        </p>
        {data && (
          <p className="mt-3 text-[10px] text-white/75">
            Atualizado{" "}
            {new Date(data.generatedAt).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </section>

      {data && (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumo da análise">
          {[
            { label: "Partidas", value: summary.total },
            { label: "Com estimativa", value: summary.analyzed },
            { label: "Ao vivo", value: summary.live },
            { label: "Sem amostra", value: summary.insufficient },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-lg font-black tabular-nums">{item.value}</p>
            </div>
          ))}
        </section>
      )}

      <LiveAlertsControl />

      {data?.alerts?.length ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="text-sm font-bold">Lances ao vivo</h2>
          <ul className="mt-2 space-y-2">
            {data.alerts.slice(0, 5).map((alert) => (
              <li key={alert.id} className="text-xs">
                <span className="font-semibold">{alert.matchLabel}</span>
                <span className="text-muted-foreground"> — {alert.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matches.length > 0 ? <AnalysisHighlights matches={matches} /> : null}

      {data?.slip && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold">Bilhete do modelo</h2>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              combinada {percent(data.slip.combinedProbability)} · odd{" "}
              {data.slip.combinedFairOdd.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Seleções independentes com bom nível de amostra. A probabilidade
            combinada é apenas uma estimativa do modelo, não uma garantia.
          </p>
          <ul className="mt-3 space-y-2">
            {data.slip.picks.map((pick) => (
              <li
                key={pick.matchId}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-2.5 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{pick.matchLabel}</span>
                  <span className="text-muted-foreground">
                    {pick.market} · {pick.competition}
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className="block font-bold">{percent(pick.probability)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    odd justa {pick.fairOdd.toFixed(2).replace(".", ",")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BacktestPanel />

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-black">Partidas</h2>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            Atualizar
          </button>
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar time ou campeonato"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Buscar time ou campeonato"
          />
        </label>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar partidas">
            {filterOptions.map(({ value, label, count }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === value
                    ? "bg-futebol-600 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label} <span className="ml-0.5 opacity-75">{count}</span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Ordenar</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-futebol-500/30"
              aria-label="Ordenar partidas"
            >
              <option value="probabilidade">Probabilidade</option>
              <option value="confianca">Confiança</option>
              <option value="horario">Horário</option>
              <option value="campeonato">Campeonato</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        ) : isError && matches.length === 0 ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold">Não foi possível carregar a análise.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {error instanceof Error ? error.message : "Tente novamente em instantes."}
                </p>
              </div>
            </div>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchAnalysisCard key={match.matchId} analysis={match} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-sm font-semibold">Nenhuma partida encontrada.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || filter !== "todos"
                ? "Tente alterar a busca ou selecionar outro filtro."
                : "Não há partidas disponíveis para analisar agora."}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
