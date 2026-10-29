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
      {/* Top Hero Analytics Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-futebol-950 via-slate-900 to-futebol-900 text-white p-5 shadow-xl border border-futebol-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-futebol-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-futebol-500/20 border border-futebol-400/30 flex items-center justify-center text-futebol-400 shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Análise Estatística Inteligente</h1>
              <p className="text-[11px] text-emerald-100/80 font-medium">
                Modelo de Poisson com ajuste Dixon-Coles & Bayes Empírico
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-white/85">
            Estimativas baseadas em forças de ataque/defesa da classificação. Sem odds de casas de apostas, escalações ou xG — focado em probabilidade e odd justa real (1 / probabilidade).
          </p>

          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
            <span>Amostras pequenas são encolhidas na direção da média da liga</span>
            {data && (
              <span className="font-semibold">
                Atualizado{" "}
                {new Date(data.generatedAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Analytics Summary Stats */}
      {data && (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumo da análise">
          {[
            { label: "Total de Partidas", value: summary.total },
            { label: "Com Estimativa", value: summary.analyzed, highlight: true },
            { label: "Ao Vivo Hoje", value: summary.live, live: summary.live > 0 },
            { label: "Sem Amostra", value: summary.insufficient },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-2xl border bg-card p-3 shadow-sm transition-all",
                item.live
                  ? "border-red-500/30 bg-red-500/[0.04]"
                  : item.highlight
                  ? "border-futebol-500/30 bg-futebol-500/[0.04]"
                  : "border-border"
              )}
            >
              <p className="text-[10px] font-semibold text-muted-foreground">{item.label}</p>
              <p className={cn(
                "mt-0.5 text-xl font-black tabular-nums tracking-tight",
                item.live ? "text-red-500" : item.highlight ? "text-futebol-500" : "text-foreground"
              )}>
                {item.value}
              </p>
            </div>
          ))}
        </section>
      )}

      <LiveAlertsControl />

      {data?.alerts?.length ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Lances Ao Vivo Importantes
          </h2>
          <ul className="mt-2 space-y-1.5">
            {data.alerts.slice(0, 5).map((alert) => (
              <li key={alert.id} className="text-xs flex items-center justify-between gap-2 bg-background/50 p-2 rounded-xl border border-amber-500/20">
                <span className="font-bold text-foreground">{alert.matchLabel}</span>
                <span className="text-muted-foreground text-[11px]">{alert.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {matches.length > 0 ? <AnalysisHighlights matches={matches} /> : null}

      {/* Model Bet Slip Card */}
      {data?.slip && (
        <section className="rounded-3xl border border-futebol-500/30 bg-gradient-to-b from-futebol-500/[0.08] via-card to-card p-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-futebol-500/20 text-futebol-500 flex items-center justify-center font-black text-xs">
                🎟️
              </span>
              <div>
                <h2 className="text-sm font-black text-foreground">Bilhete Sugerido do Modelo</h2>
                <p className="text-[10px] text-muted-foreground">Seleções independentes de alta confiança</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-xs font-black text-futebol-500 tabular-nums">
                {percent(data.slip.combinedProbability)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                Odd Justa {data.slip.combinedFairOdd.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <ul className="mt-3 space-y-2">
            {data.slip.picks.map((pick) => (
              <li
                key={pick.matchId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3 text-xs shadow-sm hover:border-futebol-500/40 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-foreground">{pick.matchLabel}</span>
                  <span className="text-[11px] font-semibold text-futebol-500">
                    {pick.market} · <span className="text-muted-foreground font-normal">{pick.competition}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className="block font-black text-foreground text-xs">{percent(pick.probability)}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    odd {pick.fairOdd.toFixed(2).replace(".", ",")}
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
