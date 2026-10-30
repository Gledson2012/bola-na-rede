"use client"

import { useState, useMemo } from "react"
import { Search, Star, Users, X } from "lucide-react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { TeamCard } from "@/components/futebol/TeamCard"
import { TeamCardSkeleton } from "@/components/Skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control"
import { FilterChip } from "@/components/ui/filter-chip"
import { EmptyState } from "@/components/ui/empty-state"
import { useTeams, useFavorites, useCompetitionTable, useTodayMatches, useLiveMatches } from "@/lib/queries"
import { cn } from "@/lib/utils"

type FilterMode = "all" | "favorites" | "playingToday"
type SortOption = "name" | "favoritesFirst" | "gamesToday"

const featuredLeagues = [
  { id: "", label: "Todas", flag: "🌐" },
  { id: "bra.1", label: "Brasileirão", flag: "🇧🇷" },
  { id: "eng.1", label: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "esp.1", label: "La Liga", flag: "🇪🇸" },
  { id: "uefa.champions", label: "Champions", flag: "🇪🇺" },
  { id: "mex.1", label: "Liga MX", flag: "🇲🇽" },
  { id: "usa.1", label: "MLS", flag: "🇺🇸" },
  { id: "fra.1", label: "Ligue 1", flag: "🇫🇷" },
  { id: "ger.1", label: "Bundesliga", flag: "🇩🇪" },
  { id: "ita.1", label: "Série A", flag: "🇮🇹" },
]

export default function TimesPage() {
  const { data: teams = [], isLoading: teamsLoading, error, refetch: refetchTeams } = useTeams()
  const { favorites } = useFavorites()

  const [selectedLeague, setSelectedLeague] = useState<string>("")
  const [search, setSearch] = useState("")
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [sortBy, setSortBy] = useState<SortOption>("favoritesFirst")

  const { data: leagueStandings = [], isLoading: leagueLoading } = useCompetitionTable(
    selectedLeague || undefined
  )

  // O endpoint `/teams` não informa atividade; contamos os jogos do dia/ao vivo
  // a partir das partidas já carregadas.
  const { data: todayMatches = [] } = useTodayMatches()
  const { data: liveMatches = [] } = useLiveMatches()

  const activity = useMemo(() => {
    const today = new Map<string, number>()
    const live = new Map<string, number>()
    for (const match of todayMatches) {
      for (const id of [match.homeTeam.id, match.awayTeam.id]) {
        today.set(id, (today.get(id) ?? 0) + 1)
      }
    }
    for (const match of liveMatches) {
      for (const id of [match.homeTeam.id, match.awayTeam.id]) {
        live.set(id, (live.get(id) ?? 0) + 1)
      }
    }
    return { today, live }
  }, [todayMatches, liveMatches])

  const activeTeamsPool = useMemo(() => {
    const base = selectedLeague ? leagueStandings.map((s) => s.team) : teams
    return base.map((team) => ({
      ...team,
      matchesToday: activity.today.get(team.id) ?? team.matchesToday ?? 0,
      liveMatches: activity.live.get(team.id) ?? team.liveMatches ?? 0,
    }))
  }, [selectedLeague, leagueStandings, teams, activity])

  const processedTeams = useMemo(() => {
    let result = activeTeamsPool

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q)
      )
    }

    if (filterMode === "favorites") {
      result = result.filter((t) => favorites.includes(t.id))
    } else if (filterMode === "playingToday") {
      result = result.filter(
        (t) => (t.matchesToday && t.matchesToday > 0) || (t.liveMatches && t.liveMatches > 0)
      )
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "favoritesFirst") {
        const aFav = favorites.includes(a.id)
        const bFav = favorites.includes(b.id)
        if (aFav && !bFav) return -1
        if (!aFav && bFav) return 1
      } else if (sortBy === "gamesToday") {
        const aGames = (a.matchesToday ?? 0) + (a.liveMatches ?? 0) * 10
        const bGames = (b.matchesToday ?? 0) + (b.liveMatches ?? 0) * 10
        if (aGames !== bGames) return bGames - aGames
      }
      return a.name.localeCompare(b.name, "pt-BR")
    })

    return result
  }, [activeTeamsPool, search, filterMode, sortBy, favorites])

  const favoriteTeamsCount = useMemo(
    () => activeTeamsPool.filter((t) => favorites.includes(t.id)).length,
    [activeTeamsPool, favorites]
  )

  const playingTodayCount = useMemo(
    () =>
      activeTeamsPool.filter(
        (t) => (t.matchesToday && t.matchesToday > 0) || (t.liveMatches && t.liveMatches > 0)
      ).length,
    [activeTeamsPool]
  )

  const liveTeamsCount = useMemo(
    () => activeTeamsPool.filter((t) => (t.liveMatches ?? 0) > 0).length,
    [activeTeamsPool]
  )

  const isLoading = teamsLoading || (selectedLeague ? leagueLoading : false)

  const filterOptions: SegmentOption<FilterMode>[] = [
    { value: "all", label: "Todos", count: activeTeamsPool.length },
    { value: "favorites", label: "Favoritos", count: favoriteTeamsCount, tone: "warning" },
    { value: "playingToday", label: "Jogam hoje", count: playingTodayCount },
  ]

  if (error && teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        tone="error"
        title="Não foi possível carregar os clubes"
        description="Verifique sua conexão e tente novamente."
        action={
          <button
            onClick={() => refetchTeams()}
            className="press rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
          >
            Tentar novamente
          </button>
        }
      />
    )
  }

  if (isLoading && activeTeamsPool.length === 0) {
    return (
      <ErrorBoundary
        fallback={(reset) => (
          <ErrorFallback
            message="Erro ao carregar times"
            onRetry={() => {
              reset()
              refetchTeams()
            }}
          />
        )}
      >
        <div className="space-y-3 py-3">
          <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <TeamCardSkeleton key={i} showLeague showForm showRecord showPoints showPosition />
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
          message="Erro ao carregar times"
          onRetry={() => {
            reset()
            refetchTeams()
          }}
        />
      )}
    >
      <div className="flex flex-col gap-4 pb-6">
        <PageHeader
          eyebrow="Clubes"
          title="Times"
          subtitle={
            liveTeamsCount > 0
              ? `${activeTeamsPool.length} clubes · ${liveTeamsCount} em campo agora`
              : `${activeTeamsPool.length} clubes · ${favoriteTeamsCount} favoritos`
          }
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clube"
            aria-label="Buscar clube"
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {featuredLeagues.map((league) => (
            <FilterChip
              key={league.id || "all"}
              active={selectedLeague === league.id}
              onClick={() => {
                setSelectedLeague(league.id)
                setSearch("")
              }}
            >
              <span>{league.flag}</span>
              <span>{league.label}</span>
            </FilterChip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SegmentedControl
            options={filterOptions}
            value={filterMode}
            onChange={setFilterMode}
            ariaLabel="Filtrar clubes"
            className="flex-1"
          />
          <label className="flex-shrink-0">
            <span className="sr-only">Ordenar clubes</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-8 rounded-full border border-border/80 bg-card px-2 text-[10px] font-bold text-foreground outline-none"
              aria-label="Ordenar clubes"
            >
              <option value="favoritesFirst">Favoritos</option>
              <option value="gamesToday">Em campo</option>
              <option value="name">A–Z</option>
            </select>
          </label>
        </div>

        {processedTeams.length === 0 ? (
          <EmptyState
            icon={filterMode === "favorites" ? Star : Users}
            title={
              filterMode === "favorites"
                ? "Nenhum clube favorito"
                : "Nenhum clube encontrado"
            }
            description={
              filterMode === "favorites"
                ? "Toque na estrela de um clube para acompanhá-lo aqui."
                : "Tente outra liga ou ajuste a busca."
            }
          />
        ) : (
          <div className={cn("space-y-2")}>
            {processedTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
