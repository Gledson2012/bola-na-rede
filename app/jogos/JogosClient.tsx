"use client"

import { useRef } from "react"
import { Search, RefreshCw, Star, X, Trophy, Radio } from "lucide-react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { MatchCard } from "@/components/futebol/MatchCard"
import { MatchCardSkeleton } from "@/components/Skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control"
import { FilterChip } from "@/components/ui/filter-chip"
import { EmptyState } from "@/components/ui/empty-state"
import { useGlobalMatches, useFavorites } from "@/lib/queries"
import { cn } from "@/lib/utils"
import type { Match } from "@/types"
import { getCompetitionMeta } from "@/lib/competitions"
import { useJogosFilter, type FilterStatus } from "./hooks/use-jogos-filter"
import { useJogosShortcuts } from "./hooks/use-jogos-shortcuts"
import { JogosStatsSummary } from "./components/JogosStatsSummary"
import { JogosCompetitionGroup } from "./components/JogosCompetitionGroup"

export default function JogosClient({
  initialMatches,
}: {
  initialMatches: Match[]
}) {
  const { data: matches = [], isLoading, error, refetch, isRefetching } =
    useGlobalMatches(initialMatches)
  const { favorites, pinnedMatches, pinnedLeagues, togglePinnedLeague } = useFavorites()

  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    activeFilter,
    setActiveFilter,
    activeCompetition,
    setActiveCompetition,
    sortBy,
    setSortBy,
    search,
    setSearch,
    collapsedLeagues,
    toggleLeagueCollapse,
    availableCompetitions,
    stats,
    processedMatches,
    pinnedSectionMatches,
    groupedByCompetition,
    hasActiveFilters,
    handleResetFilters,
  } = useJogosFilter({
    matches,
    favorites,
    pinnedMatches,
    pinnedLeagues,
  })

  // Atalhos de teclado no desktop (R atualiza, F busca, 1-5 alternam abas)
  useJogosShortcuts({
    refetch,
    searchInputRef,
    setActiveFilter,
  })

  const filterOptions: SegmentOption<FilterStatus>[] = [
    { value: "todos", label: "Todos", count: stats.total },
    { value: "live", label: "Ao vivo", count: stats.live, tone: "live" },
    { value: "upcoming", label: "Em breve", count: stats.upcoming },
    { value: "finished", label: "Fim", count: stats.finished },
    { value: "pinned", label: "Fixados", count: stats.pinned, tone: "warning" },
  ]

  if (error && matches.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        tone="error"
        title="Não foi possível carregar as partidas"
        description="Verifique sua conexão e tente novamente."
        action={
          <button
            onClick={() => refetch()}
            className="press rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
          >
            Tentar novamente
          </button>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <ErrorBoundary
        fallback={(reset) => (
          <ErrorFallback
            message="Erro ao carregar partidas"
            onRetry={() => {
              reset()
              refetch()
            }}
          />
        )}
      >
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary
      fallback={(reset) => (
        <ErrorFallback
          message="Erro ao carregar partidas"
          onRetry={() => {
            reset()
            refetch()
          }}
        />
      )}
    >
      <div className="flex flex-col gap-4 pb-6">
        <PageHeader
          eyebrow="Agenda do dia"
          title="Jogos"
          subtitle={
            stats.live > 0
              ? `${stats.live} ${stats.live === 1 ? "partida ao vivo" : "partidas ao vivo"} · ${stats.total} no total`
              : `${stats.total} partidas · atualização automática`
          }
          action={
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="press flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              title="Atualizar agora (R)"
              aria-label="Atualizar partidas"
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            </button>
          }
        />

        {/* Busca */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar time, liga ou estádio"
            aria-label="Buscar partidas"
            className="h-10 w-full rounded-2xl border border-border/80 bg-card pl-10 pr-10 text-[12px] font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Resumo do Dia */}
        <JogosStatsSummary
          total={stats.total}
          live={stats.live}
          upcoming={stats.upcoming}
          finished={stats.finished}
        />

        {/* Filtro por situação */}
        <SegmentedControl
          options={filterOptions}
          value={activeFilter}
          onChange={setActiveFilter}
          ariaLabel="Filtrar partidas por situação"
        />

        {/* Filtro por liga */}
        {availableCompetitions.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <FilterChip active={!activeCompetition} onClick={() => setActiveCompetition(null)}>
              Todas as ligas
            </FilterChip>
            {availableCompetitions.map((comp) => {
              const meta = getCompetitionMeta(comp.name)
              return (
                <FilterChip
                  key={comp.id}
                  active={activeCompetition === comp.name}
                  onClick={() =>
                    setActiveCompetition(
                      activeCompetition === comp.name ? null : comp.name
                    )
                  }
                  title={comp.country ? `${comp.name} · ${comp.country}` : comp.name}
                >
                  <span>{meta.flag}</span>
                  <span>{comp.name}</span>
                  <span className="tabular opacity-60">{comp.count}</span>
                </FilterChip>
              )
            })}
          </div>
        )}

        {/* Resumo + ordenação */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {processedMatches.length}{" "}
              {processedMatches.length === 1 ? "partida" : "partidas"}
            </span>
            {activeCompetition && (
              <button
                onClick={() => setActiveCompetition(null)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
              >
                {activeCompetition}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Limpar
              </button>
            )}
            <label htmlFor="games-sort" className="sr-only">
              Ordenar partidas
            </label>
            <select
              id="games-sort"
              value={sortBy}
              onChange={(event) => {
                const value = event.target.value
                if (value === "time" || value === "status" || value === "competition") {
                  setSortBy(value)
                }
              }}
              className="h-7 rounded-full border border-border/80 bg-card px-2 text-[10px] font-bold text-foreground outline-none"
            >
              <option value="time">Horário</option>
              <option value="status">Situação</option>
              <option value="competition">Liga</option>
            </select>
          </div>
        </div>

        {/* Conteúdo */}
        {processedMatches.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Nenhuma partida encontrada"
            description={
              hasActiveFilters
                ? "Ajuste a busca ou limpe os filtros de liga e situação."
                : "Não há partidas registradas agora. Volte em breve."
            }
            action={
              hasActiveFilters ? (
                <button
                  onClick={handleResetFilters}
                  className="press rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
                >
                  Limpar filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-5">
            {pinnedSectionMatches.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-warning">
                    <Star className="h-3 w-3 fill-current" />
                    Fixados e favoritos
                  </h2>
                  <span className="tabular text-[10px] font-bold text-muted-foreground">
                    {pinnedSectionMatches.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {pinnedSectionMatches.map((match) => (
                    <MatchCard key={`pinned-${match.id}`} match={match} showCompetition />
                  ))}
                </div>
              </section>
            )}

            {groupedByCompetition.map((group) => (
              <JogosCompetitionGroup
                key={group.name}
                group={group}
                isCollapsed={collapsedLeagues[group.name] ?? false}
                isPinned={pinnedLeagues.includes(group.name)}
                onToggleCollapse={toggleLeagueCollapse}
                onTogglePinLeague={togglePinnedLeague}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-semibold text-muted-foreground">
          <Radio className={cn("h-3 w-3", stats.live > 0 && "text-live")} />
          <span>Atualização automática a cada 60 segundos</span>
        </div>
      </div>
    </ErrorBoundary>
  )
}
