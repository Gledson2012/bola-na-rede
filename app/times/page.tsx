"use client"

import { useState, useMemo } from "react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { TeamCard } from "@/components/futebol/TeamCard"
import { TeamCardSkeleton } from "@/components/Skeleton"
import { useTeams, useFavorites, useCompetitionTable } from "@/lib/queries"
import { Search, Star, Users, Grid, List, X, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

type FilterMode = "all" | "favorites" | "playingToday"
type SortOption = "name" | "favoritesFirst" | "gamesToday"

const featuredLeagues = [
  { id: "", label: "Todos os Clubes", flag: "🌐" },
  { id: "bra.1", label: "Brasileirão", flag: "🇧🇷" },
  { id: "eng.1", label: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "esp.1", label: "La Liga", flag: "🇪🇸" },
  { id: "uefa.champions", label: "Champions", flag: "🇪🇺" },
  { id: "mex.1", label: "Liga MX", flag: "🇲🇽" },
  { id: "usa.1", label: "MLS", flag: "🇺🇸" },
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

  const activeTeamsPool = useMemo(() => {
    if (selectedLeague) {
      // Do not silently fall back to every team when a league has no table
      return leagueStandings.map((s) => s.team)
    }
    return teams
  }, [selectedLeague, leagueStandings, teams])

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

  if (error) {
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
      <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar times" onRetry={() => refetchTeams()} />}>
        <div className="flex flex-col h-full space-y-4 py-3">
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="h-10 rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar times" onRetry={() => refetchTeams()} />}>
      <div className="flex flex-col h-full space-y-4 pb-12">
        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-futebol-950 to-slate-900 text-white p-5 shadow-xl border border-futebol-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-futebol-600/30 text-futebol-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Clubes & Times</h1>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Navegue pelos clubes das principais ligas do mundo
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="font-bold text-white">{activeTeamsPool.length}</span>
              <span>clubes disponíveis</span>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15 text-center">
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                filterMode === "all" ? "bg-white/20 ring-1 ring-white/40" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-white/70 uppercase font-medium">Exibindo</p>
              <p className="text-base sm:text-lg font-black">{activeTeamsPool.length}</p>
            </button>

            <button
              onClick={() => setFilterMode("favorites")}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                filterMode === "favorites" ? "bg-amber-400/20 ring-1 ring-amber-400" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-amber-300 uppercase font-bold flex items-center justify-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-300" />
                Favoritos
              </p>
              <p className="text-base sm:text-lg font-black text-amber-300">{favoriteTeamsCount}</p>
            </button>

            <button
              onClick={() => setFilterMode("playingToday")}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                filterMode === "playingToday" ? "bg-futebol-500/20 ring-1 ring-futebol-400" : "hover:bg-white/10"
              )}
            >
              <p className="text-[10px] text-futebol-300 uppercase font-medium">Jogam Hoje</p>
              <p className="text-base sm:text-lg font-black text-futebol-300">{playingTodayCount}</p>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-2.5 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-2 border-b border-border">
          {/* League Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border active:scale-95",
                    isSelected
                      ? "bg-futebol-600 text-white border-futebol-600 shadow-sm font-bold"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
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
              placeholder="Buscar clube pelo nome ou sigla..."
              className="w-full bg-muted/60 hover:bg-muted/90 focus:bg-background border border-border focus:border-futebol-500 rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-futebol-500/20 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status & View Controls */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-2.5 py-1 rounded-xl transition-all whitespace-nowrap border",
                  filterMode === "all"
                    ? "bg-foreground text-background border-foreground font-bold"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                Todos
              </button>

              <button
                onClick={() => setFilterMode("favorites")}
                className={cn(
                  "px-2.5 py-1 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
                  filterMode === "favorites"
                    ? "bg-amber-500 text-white border-amber-500 font-bold shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Star className={cn("w-3 h-3", filterMode === "favorites" ? "fill-white" : "text-amber-500 fill-amber-500/30")} />
                <span>Favoritos</span>
              </button>

              <button
                onClick={() => setFilterMode("playingToday")}
                className={cn(
                  "px-2.5 py-1 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
                  filterMode === "playingToday"
                    ? "bg-futebol-600 text-white border-futebol-600 font-bold shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Radio className="w-3 h-3" />
                <span>Jogam Hoje</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-card text-foreground border border-border rounded-xl px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-futebol-500"
                aria-label="Ordenar clubes"
              >
                <option value="favoritesFirst">Favoritos Primeiro</option>
                <option value="name">Nome (A - Z)</option>
                <option value="gamesToday">Jogos Hoje</option>
              </select>

              <div className="flex items-center gap-0.5 bg-muted rounded-xl p-0.5 border border-border">
                <button
                  onClick={() => setCompactMode(false)}
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    !compactMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                  title="Visualização em cards"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCompactMode(true)}
                  className={cn(
                    "p-1 rounded-lg transition-all",
                    compactMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                  title="Visualização em lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Teams List */}
        {processedTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhum clube encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {search
                ? `Nenhum clube corresponde à busca "${search}".`
                : filterMode === "favorites"
                ? "Você ainda não possui clubes favoritos salvos."
                : selectedLeague
                ? "Não há classificação disponível para esta liga no momento."
                : "Nenhum time disponível com os filtros atuais."}
            </p>
            <button
              onClick={() => {
                setSearch("")
                setFilterMode("all")
                setSelectedLeague("")
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors shadow-sm"
            >
              Restaurar visualização
            </button>
          </div>
        ) : (
          <div className={cn(
            "grid gap-2.5",
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
