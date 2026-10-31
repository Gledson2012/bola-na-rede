"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, RefreshCw, Search } from "lucide-react"
import { useAnalysis } from "@/lib/queries"
import type { MatchAnalysis } from "@/lib/prediction"
import { cn, formatOdd, percent } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { LiveAlertsControl } from "@/components/live/LiveAlertsControl"
import { MatchAnalysisCard } from "@/components/analise/MatchAnalysisCard"
import { BacktestPanel } from "@/components/analise/BacktestPanel"
import { AnalysisHighlights } from "@/components/analise/AnalysisHighlights"
import { PageHeader } from "@/components/ui/page-header"
import { SegmentedControl } from "@/components/ui/segmented-control"

type MatchFilter = "todos" | "upcoming" | "live" | "finished" | "insufficient"
type SortOption = "probabilidade" | "confianca" | "horario" | "campeonato"

function bestProbability(analysis: MatchAnalysis): number {
  const probabilities = analysis.live?.probabilities ?? analysis.probabilities
  if (!probabilities) return 0
  return Math.max(probabilities.home ?? 0, probabilities.draw ?? 0, probabilities.away ?? 0)
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

  const summary = useMemo(() => data?.summary ?? {
    total: 0,
    analyzed: 0,
    upcoming: 0,
    live: 0,
    liveAnalyzed: 0,
    insufficient: 0,
  }, [data?.summary])

  const filterOptions = useMemo(() => [
    { value: "todos" as MatchFilter, label: "Todas", count: summary.total },
    { value: "upcoming" as MatchFilter, label: "Próximas", count: summary.upcoming },
    { value: "live" as MatchFilter, label: "Ao vivo", count: summary.live },
    {
      value: "finished" as MatchFilter,
      label: "Encerradas",
      count: data?.matches.filter((match) => match.status === "finished").length ?? 0,
    },
    { value: "insufficient" as MatchFilter, label: "Sem dados", count: summary.insufficient },
  ], [data?.matches, summary])

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Inteligência de dados"
        title="Análise"
        subtitle={
          data
            ? `Modelo Poisson + Dixon-Coles · atualizado às ${new Date(data.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Probabilidades, odd justa e confiança por partida."
        }
        action={
          <button
            type="button"
            onClick={() => {
              void triggerHaptic(ImpactStyle.Light)
              void refetch()
            }}
            disabled={isRefetching}
            className="press flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            title="Atualizar análise"
            aria-label="Atualizar análise"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </button>
        }
      />

      {data && (
        <section className="grid grid-cols-4 gap-2" aria-label="Resumo da análise">
          {[
            { label: "Total", value: summary.total },
            { label: "Estimadas", value: summary.analyzed, highlight: true },
            { label: "Ao vivo", value: summary.live, live: summary.live > 0 },
            { label: "Sem dados", value: summary.insufficient },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-xl border bg-card px-2 py-2.5 text-center",
                item.live
                  ? "border-live/25 bg-live/[0.03]"
                  : item.highlight
                    ? "border-primary/25 bg-primary/[0.03]"
                    : "border-border/80"
              )}
            >
              <p
                className={cn(
                  "tabular text-lg font-black leading-none tracking-tight",
                  item.live ? "text-live" : item.highlight ? "text-primary" : "text-foreground"
                )}
              >
                {item.value}
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </section>
      )}

      <LiveAlertsControl />

      {data?.alerts?.length ? (
        <section className="rounded-2xl border border-warning/25 bg-warning/[0.06] p-3.5">
          <h2 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-warning">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
            Lances ao vivo importantes
          </h2>
          <ul className="mt-2 space-y-1.5">
            {data.alerts.slice(0, 5).map((alert) => (
              <li key={alert.id} className="flex items-center justify-between gap-2 rounded-lg border border-warning/15 bg-background/60 px-2.5 py-2 text-[11px]">
                <span className="font-bold text-foreground">{alert.matchLabel}</span>
                <span className="truncate text-right text-[10px] text-muted-foreground">{alert.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matches.length > 0 ? <AnalysisHighlights matches={matches} /> : null}

      {/* Model Bet Slip Card */}
      {data?.slip && (
        <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.06] to-card p-4">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs">
                🎟️
              </span>
              <div>
                <h2 className="text-[13px] font-black text-foreground">Bilhete do modelo</h2>
                <p className="text-[9px] text-muted-foreground">Seleções independentes de alta confiança</p>
              </div>
            </div>
            <div className="text-right">
              <span className="tabular block text-xs font-black text-primary">
                {percent(data.slip.combinedProbability)}
              </span>
              <span className="tabular text-[9px] font-bold text-muted-foreground">
                odd {formatOdd(data.slip.combinedFairOdd)}
              </span>
            </div>
          </div>

          <ul className="mt-2.5 space-y-1.5">
            {data.slip.picks.map((pick) => (
              <li
                key={pick.matchId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-[11px] transition-colors hover:border-primary/30"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-foreground">{pick.matchLabel}</span>
                  <span className="font-semibold text-primary">
                    {pick.market} ·{" "}
                    <span className="font-normal text-muted-foreground">{pick.competition}</span>
                  </span>
                </span>
                <span className="tabular flex-shrink-0 text-right">
                  <span className="block text-xs font-black text-foreground">
                    {percent(pick.probability)}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground">
                    odd {formatOdd(pick.fairOdd)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <BacktestPanel />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-black tracking-tight">Partidas</h2>
            <p className="text-[10px] text-muted-foreground">
              {matches.length} {matches.length === 1 ? "jogo analisado" : "jogos analisados"}
            </p>
          </div>
          <label className="flex items-center gap-1.5 text-[10px]">
            <span className="font-semibold text-muted-foreground">Ordenar</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-7 rounded-full border border-border/80 bg-card px-2 text-[10px] font-bold text-foreground outline-none"
              aria-label="Ordenar partidas"
            >
              <option value="probabilidade">Probabilidade</option>
              <option value="confianca">Confiança</option>
              <option value="horario">Horário</option>
              <option value="campeonato">Campeonato</option>
            </select>
          </label>
        </div>

        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar por time ou liga..."
            className="h-10 w-full rounded-2xl border border-border/80 bg-card pl-10 pr-3 text-sm font-medium outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 transition-colors"
            aria-label="Buscar time ou campeonato"
          />
        </label>

        <SegmentedControl
          options={filterOptions.map(({ value, label, count }) => ({
            value,
            label,
            count,
            tone: value === "live" ? ("live" as const) : undefined,
          }))}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filtrar partidas"
        />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
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
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
            <p className="text-sm font-black">Nenhuma partida encontrada</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
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
