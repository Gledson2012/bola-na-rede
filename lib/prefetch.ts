/**
 * Estratégias de prefetch para melhorar navegação.
 *
 * Pré-carrega dados de rotas que o usuário provavelmente visitará,
 * reduzindo o tempo de loading na navegação.
 */

import { QueryClient } from "@tanstack/react-query"
import { api, mapApiMatchToMatchDetail } from "@/lib/api"
import { cacheStrategies } from "@/lib/cache-strategies"

/**
 * Prefetch de detalhes de uma partida.
 * Chame quando o usuário passar o mouse sobre um card de partida.
 */
export async function prefetchMatchDetails(
  queryClient: QueryClient,
  matchId: string
) {
  await queryClient.prefetchQuery({
    queryKey: ["matches", "detail", matchId],
    queryFn: async () => {
      const data = await api.matchById(matchId)
      return mapApiMatchToMatchDetail(data)
    },
    staleTime: cacheStrategies.matchDetail(false).staleTime,
  })
}

/**
 * Prefetch de detalhes de um time.
 * Chame quando o usuário interagir com um elemento relacionado ao time.
 */
export async function prefetchTeamDetails(
  queryClient: QueryClient,
  teamId: string
) {
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["teams", "detail", teamId],
      queryFn: async () => {
        const details = await api.teamDetails(teamId)
        return details
      },
      staleTime: cacheStrategies.teams.staleTime,
    }),
    queryClient.prefetchQuery({
      queryKey: ["teams", "form", teamId, 5],
      queryFn: () => api.teamForm(teamId, 5).catch(() => []),
      staleTime: cacheStrategies.teamForm.staleTime,
    }),
  ])
}

/**
 * Prefetch de tabela de classificação.
 * Chame quando o usuário abrir o modal de ligas.
 */
export async function prefetchCompetitionTable(
  queryClient: QueryClient,
  competitionId: string
) {
  await queryClient.prefetchQuery({
    queryKey: ["competitions", "table", competitionId],
    queryFn: () => api.competitionTable(competitionId),
    staleTime: cacheStrategies.competitionTable.staleTime,
  })
}

/**
 * Invalida queries relacionadas a partidas ao vivo.
 * Útil após receber uma notificação push de mudança no placar.
 */
export function invalidateLiveMatchQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    queryKey: ["matches", "live"],
  })
  queryClient.invalidateQueries({
    queryKey: ["matches", "global"],
  })
  queryClient.invalidateQueries({
    queryKey: ["matches", "today"],
  })
}
