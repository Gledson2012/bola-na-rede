import { useQuery } from "@tanstack/react-query"
import { api, fetchWithTimeout, mapApiMatchToMatch, mapApiMatchToMatchDetail, mapApiTeamToTeam, mapApiNewsToNews, mapApiStandingToStanding } from "@/lib/api"
import type { Match, MatchDetail, News, NewsWithMatches, RelatedMatch } from "@/types"
import type { AnalysisResponse } from "@/lib/prediction"
import { useFavoritesStore } from "@/lib/store"
import { ALL_COMPETITIONS } from "@/lib/competitions"
import { cacheStrategies, withInitialData } from "@/lib/cache-strategies"

export interface NewsWithMatchesResponse {
  generatedAt: string
  news: NewsWithMatches[]
  matches: RelatedMatch[]
}

// ===== MATCHES =====
export function useLiveMatches() {
  return useQuery({
    queryKey: ["matches", "live"],
    queryFn: () => api.matchesLive().then((r) => r.map(mapApiMatchToMatch)),
    ...cacheStrategies.liveMatches,
  })
}

export function useTodayMatches() {
  return useQuery({
    queryKey: ["matches", "today"],
    queryFn: () => api.matchesToday().then((r) => r.map(mapApiMatchToMatch)),
    ...cacheStrategies.todayMatches,
  })
}

/**
 * Lista global de partidas.
 *
 * `initialMatches` vem do server component da página: o HTML já sai com os
 * jogos (em vez de skeleton) e o cliente revalida em seguida. O timestamp 0
 * marca o dado inicial como vencido de propósito, para o refetch acontecer
 * no mount sem esconder o conteúdo já renderizado.
 */
export function useGlobalMatches(initialMatches?: Match[]) {
  return useQuery({
    queryKey: ["matches", "global"],
    queryFn: () => api.matchesGlobal().then((r) => r.map(mapApiMatchToMatch)),
    ...cacheStrategies.globalMatches,
    ...withInitialData(initialMatches),
  })
}

export function useMatch(id: string, initialDetail?: MatchDetail) {
  return useQuery({
    queryKey: ["matches", "detail", id],
    queryFn: async () => {
      const data = await api.matchById(id)
      return mapApiMatchToMatchDetail(data)
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const isLive = query.state.data?.status === "live"
      const strategy = cacheStrategies.matchDetail(isLive)
      return typeof strategy.refetchInterval === "number" ? strategy.refetchInterval : false
    },
    staleTime: (query) => {
      const isLive = query.state.data?.status === "live"
      return cacheStrategies.matchDetail(isLive).staleTime
    },
    ...withInitialData(initialDetail),
  })
}

// ===== ANÁLISE ESTATÍSTICA =====
export function useAnalysis() {
  return useQuery({
    queryKey: ["analysis"],
    queryFn: async (): Promise<AnalysisResponse> => {
      const response = await fetchWithTimeout("/api/analise", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Falha ao carregar análise: ${response.status}`)
      }
      return response.json()
    },
    ...cacheStrategies.analysis,
  })
}

// ===== TEAMS =====
export function useTeams() {
  return useQuery({
    queryKey: ["teams", "all"],
    queryFn: () => api.teams().then((r) => r.map(mapApiTeamToTeam)),
    ...cacheStrategies.teams,
  })
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ["teams", "detail", id],
    queryFn: async () => {
      try {
        const details = await api.teamDetails(id)
        return mapApiTeamToTeam(details)
      } catch (detailsError) {
        // Fallback: the team may exist in the list without a detail endpoint
        console.warn(`[useTeam] detail endpoint failed for ${id}, falling back to teams list:`, detailsError)
        try {
          const list = await api.teams()
          const found = list.find((t) => t.id === id)
          if (found) return mapApiTeamToTeam(found)
        } catch {
          throw detailsError
        }
        throw detailsError
      }
    },
    enabled: !!id,
    ...cacheStrategies.teams,
    retry: 1,
  })
}

export function useTeamForm(id: string, limit = 5) {
  return useQuery({
    queryKey: ["teams", "form", id, limit],
    queryFn: () =>
      api
        .teamForm(id, limit)
        .then((r) => r.map(mapApiMatchToMatch))
        .catch(() => []),
    enabled: !!id,
    ...cacheStrategies.teamForm,
  })
}

export function useTeamNext(id: string) {
  return useQuery({
    queryKey: ["teams", "next", id],
    queryFn: () =>
      api
        .teamNext(id)
        .then((r) => (r ? mapApiMatchToMatch(r) : null))
        .catch(() => null),
    enabled: !!id,
    ...cacheStrategies.teamForm,
  })
}

export function useTeamLast(id: string) {
  return useQuery({
    queryKey: ["teams", "last", id],
    queryFn: () =>
      api
        .teamLast(id)
        .then((r) => (r ? mapApiMatchToMatch(r) : null))
        .catch(() => null),
    enabled: !!id,
    ...cacheStrategies.teamForm,
  })
}

// ===== COMPETITIONS =====
export function useCompetitions() {
  return useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      try {
        const liveComps = await api.competitions()
        return ALL_COMPETITIONS.map((c) => {
          const live = (liveComps || []).find(
            (l: any) =>
              l.id === c.id ||
              l.name.toLowerCase() === c.name.toLowerCase() ||
              l.name.toLowerCase() === c.shortName.toLowerCase()
          )
          return {
            ...c,
            totalMatches: live?.totalMatches ?? 0,
            liveMatches: live?.liveMatches ?? 0,
            upcomingMatches: live?.upcomingMatches ?? 0,
            finishedMatches: live?.finishedMatches ?? 0,
          }
        })
      } catch {
        return ALL_COMPETITIONS.map((c) => ({
          ...c,
          totalMatches: 0,
          liveMatches: 0,
          upcomingMatches: 0,
          finishedMatches: 0,
        }))
      }
    },
    ...cacheStrategies.competitions,
  })
}

export function useCompetitionTable(competitionId?: string) {
  return useQuery({
    queryKey: ["competitions", "table", competitionId],
    queryFn: () => (competitionId ? api.competitionTable(competitionId).then((r) => r.map(mapApiStandingToStanding)) : Promise.resolve([])),
    enabled: !!competitionId,
    ...cacheStrategies.competitionTable,
  })
}

// ===== NEWS =====
export function useNews(initialNews?: News[]) {
  return useQuery({
    queryKey: ["news"],
    queryFn: () => api.news().then((r) => r.map(mapApiNewsToNews)),
    ...cacheStrategies.news,
    ...withInitialData(initialNews),
  })
}

/** Notícias já vinculadas às partidas em andamento. */
export function useNewsWithMatches() {
  return useQuery({
    queryKey: ["news", "with-matches"],
    queryFn: async (): Promise<NewsWithMatchesResponse> => {
      const response = await fetchWithTimeout("/api/noticias", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Falha ao carregar as notícias: ${response.status}`)
      }
      return response.json()
    },
    ...cacheStrategies.news,
    retry: 1,
  })
}

// ===== FAVORITES & PINNED (Zustand persisted) =====

/**
 * Preferir os seletores finos (`useIsFavorite`, `useIsPinnedMatch`) quando o
 * componente só precisa saber se UM item está marcado: eles re-renderizam
 * apenas o card afetado. Este hook agregado serve para telas que exibem
 * listas/estatísticas do estado inteiro.
 */
export function useFavorites() {
  const favorites = useFavoritesStore((state) => state.favorites || [])
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const isFavorite = useFavoritesStore((state) => state.isFavorite)
  const pinnedMatches = useFavoritesStore((state) => state.pinnedMatches || [])
  const togglePinnedMatch = useFavoritesStore((state) => state.togglePinnedMatch)
  const isPinnedMatch = useFavoritesStore((state) => state.isPinnedMatch)
  const reminders = useFavoritesStore((state) => state.reminders || [])
  const toggleReminder = useFavoritesStore((state) => state.toggleReminder)
  const hasReminder = useFavoritesStore((state) => state.hasReminder)
  const pinnedLeagues = useFavoritesStore((state) => state.pinnedLeagues || [])
  const togglePinnedLeague = useFavoritesStore((state) => state.togglePinnedLeague)
  const isPinnedLeague = useFavoritesStore((state) => state.isPinnedLeague)

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    pinnedMatches,
    togglePinnedMatch,
    isPinnedMatch,
    reminders,
    toggleReminder,
    hasReminder,
    pinnedLeagues,
    togglePinnedLeague,
    isPinnedLeague,
  }
}