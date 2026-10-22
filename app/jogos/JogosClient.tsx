"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { MatchCard } from "@/components/futebol/MatchCard"
import { MatchCardSkeleton } from "@/components/Skeleton"
import { useGlobalMatches, useFavorites } from "@/lib/queries"
import {
  Search, Clock, Trophy, RefreshCw, ChevronDown,
  Star, Grid, List, ChevronUp, Radio, CheckCircle2, X
} from "lucide-react"
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

  // `isFavorite`/`isPinnedMatch` do store são funções estáveis: usá-las como
  // dependência de `useMemo` faz o memo nunca recalcular quando o estado
  // muda. Usamos os arrays diretamente (eles mudam de identidade).
  const isTeamFavorite = useCallback(
    (teamId: string) => favorites.includes(teamId),
    [favorites]
  )
  const isMatchPinned = useCallback(
    (matchId: string) => pinnedMatches.includes(matchId),
    [pinnedMatches]
  )

  /**
   * Chave de ordenação por horário. A API entrega apenas a hora ("15:00") e
   * `Match.date` é fabricada para o dia atual; comparar os dois formatos
   * diretamente produz uma ordem arbitrária. Normalizamos para "HH:MM".
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
  const [compactMode, setCompactMode] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("time")
  const [search, setSearch] = useState("")
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({})

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Aggregate available competitions directly from matches for accurate counts
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

  // Count stats
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

  // Toggle collapse for a league section
  const toggleLeagueCollapse = (leagueName: string) => {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [leagueName]: !prev[leagueName],
    }))
  }

  // Filter and sort matches
  const processedMatches = useMemo(() => {
    let result = matches

    // 1. Search Query filter
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
        ].filter(Boolean).join(" ").toLowerCase()
        return text.includes(query)
      })
    }

    // 2. Status filter
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

    // 3. Competition filter
    if (activeCompetition) {
      result = result.filter((m) => m.competition === activeCompetition)
    }

    // 4. Sorting
    result = [...result].sort((a, b) => {
      // Pinned matches come first if viewing all
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

  // Separate pinned matches from the rest if in "todos" view
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

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      // Não sequestra o teclado enquanto o usuário digita, navega num select ou
      // usa atalhos do navegador/sistema (Ctrl/Alt/Meta + tecla).
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
        case "1": setActiveFilter("todos"); break
        case "2": setActiveFilter("live"); break
        case "3": setActiveFilter("upcoming"); break
        case "4": setActiveFilter("finished"); break
        case "5": setActiveFilter("pinned"); break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [refetch])

  const hasActiveFilters =
    activeFilter !== "todos" ||
    activeCompetition !== null ||
    search.trim() !== ""

  const handleResetFilters = () => {
    setActiveFilter("todos")
    setActiveCompetition(null)
    setSearch("")
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Trophy className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">Não foi possível carregar as partidas</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors shadow-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar partidas" onRetry={() => { reset(); refetch() }} />)}>
        <div className="flex flex-col h-full space-y-4 py-3">
          <div className="space-y-2 px-1">
            <div className="h-10 rounded-2xl bg-muted animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-xl bg-muted animate-pulse" />
              <div className="h-8 w-24 rounded-xl bg-muted animate-pulse" />
              <div className="h-8 w-20 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar partidas" onRetry={() => { reset(); refetch() }} />)}>
      <div className="flex flex-col h-full space-y-4 pb-12">
        {/* Top Header Card with Quick Stats & Auto-Refresh */}
        <div className="rounded-2xl bg-gradient-to-br from-futebol-900 via-futebol-800 to-futebol-950 text-white p-4 shadow-lg border border-futebol-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-futebol-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Jogos de Futebol</h1>
                {stats.live > 0 ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-black animate-pulse shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {stats.live} AO VIVO
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-white/70 px-2 py-0.5 rounded-full bg-white/10">
                    Ao Vivo Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-white/75 mt-0.5">
                Placares, lances, estatísticas e horários em tempo real
              </p>
            </div>

            {/* Live refresh button & status */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isRefetching}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 transition-all active:scale-95 text-white",
                  isRefetching && "opacity-75"
                )}
                title="Atualizar agora (tecla R)"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
                <span>{isRefetching ? "Atualizando..." : "Atualizar"}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
            <button
              onClick={() => setActiveFilter("todos")}
              aria-pressed={activeFilter === "todos"}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                activeFilter === "todos" ? "bg-white/20 ring-1 ring-white/40" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-white/70 uppercase font-medium tracking-wider">Total</p>
              <p className="text-base sm:text-lg font-black">{stats.total}</p>
            </button>

            <button
              onClick={() => setActiveFilter("live")}
              aria-pressed={activeFilter === "live"}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                activeFilter === "live" ? "bg-red-500/30 ring-1 ring-red-400" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-red-300 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Ao Vivo
              </p>
              <p className="text-base sm:text-lg font-black text-red-300">{stats.live}</p>
            </button>

            <button
              onClick={() => setActiveFilter("upcoming")}
              aria-pressed={activeFilter === "upcoming"}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                activeFilter === "upcoming" ? "bg-white/20 ring-1 ring-white/40" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-white/70 uppercase font-medium tracking-wider">Agendados</p>
              <p className="text-base sm:text-lg font-black">{stats.upcoming}</p>
            </button>

            <button
              onClick={() => setActiveFilter("pinned")}
              aria-pressed={activeFilter === "pinned"}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                activeFilter === "pinned" ? "bg-amber-400/20 ring-1 ring-amber-400" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-amber-300 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-300" />
                Fixados
              </p>
              <p className="text-base sm:text-lg font-black text-amber-300">{stats.pinned}</p>
            </button>
          </div>
        </div>

        {/* Filter Controls Box */}
        <div className="space-y-2.5 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-2 border-b border-border">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por time, campeonato, estádio ou horário... (tecle F)"
              className="w-full bg-muted/60 hover:bg-muted/90 focus:bg-background border border-border focus:border-futebol-500 rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-futebol-500/20 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
            <button
              onClick={() => setActiveFilter("todos")}
              aria-pressed={activeFilter === "todos"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                activeFilter === "todos"
                  ? "bg-futebol-600 text-white border-futebol-600 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Todos</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                activeFilter === "todos" ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}>
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("live")}
              aria-pressed={activeFilter === "live"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                activeFilter === "live"
                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <Radio className={cn("w-3.5 h-3.5", stats.live > 0 && "animate-pulse text-red-500")} />
              <span>Ao Vivo</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                activeFilter === "live" ? "bg-white/20 text-white" : "bg-red-500/10 text-red-600 dark:text-red-400"
              )}>
                {stats.live}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("upcoming")}
              aria-pressed={activeFilter === "upcoming"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                activeFilter === "upcoming"
                  ? "bg-futebol-600 text-white border-futebol-600 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Agendados</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                activeFilter === "upcoming" ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}>
                {stats.upcoming}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("finished")}
              aria-pressed={activeFilter === "finished"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                activeFilter === "finished"
                  ? "bg-futebol-600 text-white border-futebol-600 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finalizados</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                activeFilter === "finished" ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}>
                {stats.finished}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("pinned")}
              aria-pressed={activeFilter === "pinned"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                activeFilter === "pinned"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <Star className={cn("w-3.5 h-3.5", activeFilter === "pinned" ? "fill-white" : "text-amber-500 fill-amber-500/20")} />
              <span>Fixados</span>
              {stats.pinned > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  activeFilter === "pinned" ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-600"
                )}>
                  {stats.pinned}
                </span>
              )}
            </button>
          </div>

          {/* Secondary Filter Row: Competitions & View Mode */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Competition Selector Pills */}
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setActiveCompetition(null)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1",
                  !activeCompetition
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <span>Todas as Ligas</span>
              </button>

              {availableCompetitions.map((comp) => {
                const meta = getCompetitionMeta(comp.name)
                const isSelected = activeCompetition === comp.name
                return (
                  <button
                    key={comp.id}
                    onClick={() => setActiveCompetition(isSelected ? null : comp.name)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5",
                      isSelected
                        ? "bg-futebol-600 text-white border-futebol-600 shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span>{meta.flag}</span>
                    <span>{comp.name}</span>
                    <span className={cn(
                      "text-[10px] px-1 py-0.2 rounded-full",
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {comp.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* View Mode Toggle: Card vs Compact */}
            <div className="flex items-center gap-0.5 bg-muted rounded-xl p-0.5 flex-shrink-0 border border-border">
              <button
                onClick={() => setCompactMode(false)}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  !compactMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Visualização em cards"
                aria-label="Visualização em cards"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCompactMode(true)}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  compactMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Visualização em lista compacta"
                aria-label="Visualização em lista compacta"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Filters Summary line & Reset button */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">
                {processedMatches.length} {processedMatches.length === 1 ? "partida" : "partidas"} encontrada(s)
              </span>
              {activeCompetition && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-futebol-50 dark:bg-futebol-950/60 text-futebol-700 dark:text-futebol-300 font-medium">
                  {activeCompetition}
                  <button
                    onClick={() => setActiveCompetition(null)}
                    className="hover:text-red-500"
                    aria-label={`Remover filtro de ${activeCompetition}`}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="games-sort" className="text-[11px]">
                Ordenar:
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
                className="max-w-[142px] rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-futebol-500/30"
              >
                <option value="time">Horário</option>
                <option value="status">Status do jogo</option>
                <option value="competition">Campeonato</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] text-futebol-600 hover:text-futebol-700 font-semibold transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Matches Feed */}
        {processedMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhuma partida encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {hasActiveFilters
                ? "Tente ajustar a busca ou limpar os filtros de campeonato e status."
                : "No momento não há partidas registradas. Volte em breve para acompanhar novos jogos!"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors shadow-sm"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. VIP Pinned Section (if any pinned matches) */}
            {pinnedSectionMatches.length > 0 && (
              <section className="cv-auto space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center text-xs">
                      ⭐
                    </span>
                    <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Partidas Fixadas / Meus Times
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                    {pinnedSectionMatches.length} fixado(s)
                  </span>
                </div>

                <div className={cn(
                  "grid gap-2.5",
                  compactMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                )}>
                  {pinnedSectionMatches.map((match) => (
                    <MatchCard key={`pinned-${match.id}`} match={match} compact={compactMode} showCompetition />
                  ))}
                </div>
              </section>
            )}

            {/* 2. Grouped By Competition */}
            {groupedByCompetition.map((group) => {
              const isCollapsed = collapsedLeagues[group.name] ?? false

              return (
                <section key={group.name} className="cv-auto space-y-2.5">
                  {/* Competition Header Banner */}
                  <button
                    onClick={() => toggleLeagueCollapse(group.name)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/80 transition-colors text-left"
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{group.flag}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {group.name}
                        </span>
                        {group.region && (
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                            {group.region}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                        {group.matches.length} {group.matches.length === 1 ? "jogo" : "jogos"}
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Matches Grid */}
                  {!isCollapsed && (
                    <div className={cn(
                      "grid gap-2.5",
                      compactMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
                    )}>
                      {group.matches.map((match) => (
                        <MatchCard key={match.id} match={match} compact={compactMode} />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        {/* Footer shortcuts info */}
        <div className="pt-6 pb-4 text-center border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
          <p className="font-medium">
            Atualização automática ativa • Dados em tempo real
          </p>
          <p className="text-[10px] text-muted-foreground/80">
            Dicas: Pressione <kbd className="px-1 py-0.5 bg-muted rounded border text-[9px]">F</kbd> para buscar, <kbd className="px-1 py-0.5 bg-muted rounded border text-[9px]">R</kbd> para atualizar, ou teclas <kbd className="px-1 py-0.5 bg-muted rounded border text-[9px]">1-5</kbd> para alternar abas.
          </p>
        </div>
      </div>
    </ErrorBoundary>
  )
}
