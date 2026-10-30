"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import {
  Search,
  RefreshCw,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Trophy,
  Radio,
} from "lucide-react"
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

type FilterStatus = "todos" | "live" | "upcoming" | "finished" | "pinned"
type SortOption = "time" | "competition" | "status"

export default function JogosClient({
  initialMatches,
}: {
  initialMatches: Match[]
}) {
  const { data: matches = [], isLoading, error, refetch, isRefetching } =
    useGlobalMatches(initialMatches)
  const { favorites, pinnedMatches } = useFavorites()

  const isTeamFavorite = useCallback(
    (teamId: string) => favorites.includes(teamId),
    [favorites]
  )
  const isMatchPinned = useCallback(
    (matchId: string) => pinnedMatches.includes(matchId),
    [pinnedMatches]
  )

  /**
   * A API entrega apenas a hora ("15:00") e `Match.date` é fabricada para o
   * dia atual; normalizamos tudo para "HH:MM" antes de comparar.
   */
  const matchTimeKey = (match: Match): string => {
    if (match.kickoff) return match.kickoff
    const parsed = new Date(match.date)
    if (Number.isNaN(parsed.getTime())) return "99:99"
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(
      parsed.getMinutes()
    ).padStart(2, "0")}`
  }

  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos")
  const [activeCompetition, setActiveCompetition] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("time")
  const [search, setSearch] = useState("")
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({})

  const searchInputRef = useRef<HTMLInputElement>(null)

  const availableCompetitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; country?: string; count: number }>()

    matches.forEach((m) => {
      const compKey = m.competition || "Outros"
      const existing = map.get(compKey)
      if (existing) {
        existing.count++
      } else {
        map.set(compKey, {
          id: m.competitionId || compKey,
          name: compKey,
          country: m.competitionCountry,
          count: 1,
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [matches])

  const stats = useMemo(() => {
    const live = matches.filter((m) => m.status === "live").length
    const upcoming = matches.filter((m) => m.status === "upcoming").length
    const finished = matches.filter((m) => m.status === "finished").length
    const pinned = matches.filter(
      (m) =>
        isMatchPinned(m.id) ||
        isTeamFavorite(m.homeTeam.id) ||
        isTeamFavorite(m.awayTeam.id)
    ).length

    return { total: matches.length, live, upcoming, finished, pinned }
  }, [matches, isMatchPinned, isTeamFavorite])

  const toggleLeagueCollapse = (leagueName: string) => {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [leagueName]: !prev[leagueName],
    }))
  }

  const processedMatches = useMemo(() => {
    let result = matches

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((m) => {
        const text = [
          m.homeTeam.name,
          m.homeTeam.shortName,
          m.awayTeam.name,
          m.awayTeam.shortName,
          m.competition,
          m.competitionCountry,
          m.venue,
          m.kickoff,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return text.includes(query)
      })
    }

    if (activeFilter === "live") {
      result = result.filter((m) => m.status === "live")
    } else if (activeFilter === "upcoming") {
      result = result.filter((m) => m.status === "upcoming")
    } else if (activeFilter === "finished") {
      result = result.filter((m) => m.status === "finished")
    } else if (activeFilter === "pinned") {
      result = result.filter(
        (m) =>
          isMatchPinned(m.id) ||
          isTeamFavorite(m.homeTeam.id) ||
          isTeamFavorite(m.awayTeam.id)
      )
    }

    if (activeCompetition) {
      result = result.filter((m) => m.competition === activeCompetition)
    }

    result = [...result].sort((a, b) => {
      if (activeFilter !== "pinned") {
        const aPinned =
          isMatchPinned(a.id) ||
          isTeamFavorite(a.homeTeam.id) ||
          isTeamFavorite(a.awayTeam.id)
        const bPinned =
          isMatchPinned(b.id) ||
          isTeamFavorite(b.homeTeam.id) ||
          isTeamFavorite(b.awayTeam.id)
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
      }

      switch (sortBy) {
        case "time":
          return matchTimeKey(a).localeCompare(matchTimeKey(b))
        case "competition":
          return (
            (a.competition || "").localeCompare(b.competition || "", "pt-BR") ||
            matchTimeKey(a).localeCompare(matchTimeKey(b))
          )
        case "status": {
          const order: Record<string, number> = { live: 0, upcoming: 1, finished: 2 }
          return (
            (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
            matchTimeKey(a).localeCompare(matchTimeKey(b))
          )
        }
        default:
          return 0
      }
    })

    return result
  }, [
    matches,
    search,
    activeFilter,
    activeCompetition,
    sortBy,
    isMatchPinned,
    isTeamFavorite,
  ])

  const { pinnedSectionMatches, groupedByCompetition } = useMemo(() => {
    let pinnedList: Match[] = []
    let restList = processedMatches

    if (activeFilter === "todos" && !search && !activeCompetition) {
      pinnedList = processedMatches.filter(
        (m) =>
          isMatchPinned(m.id) ||
          isTeamFavorite(m.homeTeam.id) ||
          isTeamFavorite(m.awayTeam.id)
      )
      restList = processedMatches.filter(
        (m) =>
          !isMatchPinned(m.id) &&
          !isTeamFavorite(m.homeTeam.id) &&
          !isTeamFavorite(m.awayTeam.id)
      )
    }

    const groups: Record<string, Match[]> = {}
    restList.forEach((match) => {
      const comp = match.competition || "Outros Campeonatos"
      if (!groups[comp]) groups[comp] = []
      groups[comp].push(match)
    })

    const sortedGroups = Object.entries(groups).map(([compName, compMatches]) => {
      const meta = getCompetitionMeta(compName)
      return {
        name: compName,
        flag: meta.flag,
        region: meta.country || compMatches[0]?.competitionCountry || "Futebol",
        matches: compMatches,
      }
    })

    return {
      pinnedSectionMatches: pinnedList,
      groupedByCompetition: sortedGroups,
    }
  }, [
    processedMatches,
    activeFilter,
    search,
    activeCompetition,
    isMatchPinned,
    isTeamFavorite,
  ])

  // Atalhos de teclado (desktop): F busca, R atualiza e 1–5 alternam os filtros.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return
      }

      switch (e.key) {
        case "r":
        case "R":
          e.preventDefault()
          refetch()
          break
        case "f":
        case "F":
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case "1":
          setActiveFilter("todos")
          break
        case "2":
          setActiveFilter("live")
          break
        case "3":
          setActiveFilter("upcoming")
          break
        case "4":
          setActiveFilter("finished")
          break
        case "5":
          setActiveFilter("pinned")
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [refetch])

  const hasActiveFilters =
    activeFilter !== "todos" || activeCompetition !== null || search.trim() !== ""

  const handleResetFilters = () => {
    setActiveFilter("todos")
    setActiveCompetition(null)
    setSearch("")
  }

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

            {groupedByCompetition.map((group) => {
              const isCollapsed = collapsedLeagues[group.name] ?? false

              return (
                <section key={group.name} className="cv-auto space-y-2">
                  <button
                    onClick={() => toggleLeagueCollapse(group.name)}
                    className="flex w-full items-center gap-2.5 px-0.5 py-1 text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-sm">
                      {group.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-black leading-tight text-foreground">
                        {group.name}
                      </span>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.region} · {group.matches.length}{" "}
                        {group.matches.length === 1 ? "jogo" : "jogos"}
                      </span>
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-2">
                      {group.matches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
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
