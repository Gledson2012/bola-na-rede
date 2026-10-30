"use client"

import { useState, useMemo } from "react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { TeamCard } from "@/components/futebol/TeamCard"
import { TeamCardSkeleton } from "@/components/Skeleton"
import { useTeams, useFavorites, useCompetitionTable, useTodayMatches, useLiveMatches } from "@/lib/queries"
import { Search, Star, Users, Grid, List, X, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

type FilterMode = "all" | "favorites" | "playingToday"
type SortOption = "name" | "favoritesFirst" | "gamesToday"

const featuredLeagues = [
  { id: "", label: "Todos os Clubes", flag: "🌐" },
  { id: "bra.1", label: "Brasileirão", flag: "🇧🇷" },
  { id: "eng.1", label: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "esp.1", label: "La Liga", flag: "🇪🇸" },
  { id: "uefa.champions", label: "Liga dos Campeões", flag: "🇪🇺" },
  { id: "mex.1", label: "Liga MX", flag: "🇲🇽" },
  { id: "usa.1", label: "MLS", flag: "🇺🇸" },
  { id: "fra.1", label: "Liga Francesa", flag: "🇫🇷" },
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
  const [compactMode, setCompactMode] = useState(false)

  // Fetch league table if specific league is chosen
  const { data: leagueStandings = [], isLoading: leagueLoading } = useCompetitionTable(
    selectedLeague || undefined
  )

  // O endpoint `/teams` não informa atividade: `matchesToday`/`liveMatches`
  // chegam sempre 0 e o filtro "Jogam Hoje" nunca retornava ninguém. Contamos
  // os jogos do dia/ao vivo a partir das partidas já carregadas.
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
    // Do not silently fall back to every team when a league has no table
    const base = selectedLeague ? leagueStandings.map((s) => s.team) : teams
    return base.map((team) => ({
      ...team,
      matchesToday: activity.today.get(team.id) ?? team.matchesToday ?? 0,
      liveMatches: activity.live.get(team.id) ?? team.liveMatches ?? 0,
    }))
  }, [selectedLeague, leagueStandings, teams, activity])

  // Filtered and sorted teams
  const processedTeams = useMemo(() => {
    let result = activeTeamsPool

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q)
      )
    }

    // Filter mode
    if (filterMode === "favorites") {
      result = result.filter((t) => favorites.includes(t.id))
    } else if (filterMode === "playingToday") {
      result = result.filter(
        (t) => (t.matchesToday && t.matchesToday > 0) || (t.liveMatches && t.liveMatches > 0)
      )
    }

    // Sorting
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

  const favoriteTeamsCount = useMemo(() => {
    return activeTeamsPool.filter((t) => favorites.includes(t.id)).length
  }, [activeTeamsPool, favorites])

  const playingTodayCount = useMemo(() => {
    return activeTeamsPool.filter(
      (t) => (t.matchesToday && t.matchesToday > 0) || (t.liveMatches && t.liveMatches > 0)
    ).length
  }, [activeTeamsPool])

  const isLoading = teamsLoading || (selectedLeague ? leagueLoading : false)

  if (error && teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">Não foi possível carregar os clubes</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => refetchTeams()}
          className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors shadow-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isLoading && activeTeamsPool.length === 0) {
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar times" onRetry={() => { reset(); refetchTeams() }} />)}>
        <div className="flex flex-col h-full space-y-4 py-3">
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="h-10 rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <TeamCardSkeleton key={i} showLeague showForm showRecord showPoints showPosition />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar times" onRetry={() => { reset(); refetchTeams() }} />)}>
      <div className="flex flex-col h-full space-y-4 pb-12">
        {/* Hero Banner */}
        <div className="rounded-lg bg-card text-card-foreground p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Clubes</h1>
              <p className="text-xs text-muted-foreground">
                Navegue pelos times das principais ligas
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-2 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-2 border-b border-border">
          {/* League Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-medium">
            {featuredLeagues.map((l) => {
              const isSelected = selectedLeague === l.id
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedLeague(l.id)
                    setSearch("")
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent hover:bg-accent/80 text-muted-foreground"
                  )}
                >
                  {l.flag} {l.label}
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar clube..."
              className="w-full bg-background border border-border rounded-md pl-9 pr-9 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            />
          </div>

          {/* Filter Status & View Controls */}
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1">
              <button onClick={() => setFilterMode("all")} className={cn("px-2 py-1 rounded", filterMode === "all" && "bg-accent text-foreground")}>Todos</button>
              <button onClick={() => setFilterMode("favorites")} className={cn("px-2 py-1 rounded", filterMode === "favorites" && "bg-accent text-foreground")}>Favoritos</button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCompactMode(!compactMode)}
                className="p-1 rounded hover:bg-accent"
              >
                {compactMode ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Teams List */}
        {processedTeams.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Nenhum clube encontrado.
          </div>
        ) : (
          <div className={cn(
            "grid gap-2",
            compactMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
          )}>
            {processedTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                compact={compactMode}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
