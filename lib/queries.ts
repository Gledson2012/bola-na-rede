import { useQuery } from "@tanstack/react-query"
import { api, fetchWithTimeout, mapApiMatchToMatch, mapApiMatchToMatchDetail, mapApiTeamToTeam, mapApiNewsToNews, mapApiStandingToStanding } from "@/lib/api"
import type { Match, News, NewsWithMatches, RelatedMatch } from "@/types"
import type { AnalysisResponse } from "@/lib/prediction"
import { useFavoritesStore } from "@/lib/store"
import { ALL_COMPETITIONS } from "@/lib/competitions"

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
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useTodayMatches() {
  return useQuery({
    queryKey: ["matches", "today"],
    queryFn: () => api.matchesToday().then((r) => r.map(mapApiMatchToMatch)),
    refetchInterval: 60_000,
    staleTime: 30_000,
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
    refetchInterval: 60_000,
    staleTime: 30_000,
    ...(initialMatches && initialMatches.length > 0
      ? { initialData: initialMatches, initialDataUpdatedAt: 0 }
      : {}),
  })
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["matches", "detail", id],
    queryFn: async () => {
      const data = await api.matchById(id)
      return mapApiMatchToMatchDetail(data)
    },
    enabled: !!id,
    refetchInterval: (query) => query.state.data?.status === "live" ? 15_000 : false,
    staleTime: 10_000,
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
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  })
}

// ===== TEAMS =====
export function useTeams() {
  return useQuery({
    queryKey: ["teams", "all"],
    queryFn: () => api.teams().then((r) => r.map(mapApiTeamToTeam)),
    staleTime: 5 * 60_000,
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
    staleTime: 5 * 60_000,
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
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    staleTime: 5 * 60_000,
  })
}

export function useCompetitionTable(competitionId?: string) {
  return useQuery({
    queryKey: ["competitions", "table", competitionId],
    queryFn: () => (competitionId ? api.competitionTable(competitionId).then((r) => r.map(mapApiStandingToStanding)) : Promise.resolve([])),
    enabled: !!competitionId,
    staleTime: 60_000,
  })
}

// ===== NEWS =====
export function useNews(initialNews?: News[]) {
  return useQuery({
    queryKey: ["news"],
    queryFn: () => api.news().then((r) => r.map(mapApiNewsToNews)),
    staleTime: 5 * 60_000,
    ...(initialNews && initialNews.length > 0
      ? { initialData: initialNews, initialDataUpdatedAt: 0 }
      : {}),
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
    staleTime: 3 * 60_000,
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
  }
}