/**
 * Estratégias de cache otimizadas para diferentes tipos de dados.
 *
 * Define políticas de refetch, stale time e garbage collection baseadas
 * no comportamento esperado de cada recurso.
 */

export const cacheStrategies = {
  /**
   * Partidas ao vivo: atualização frequente e precisa
   */
  liveMatches: {
    refetchInterval: 10_000, // 10s para maior precisão
    staleTime: 5_000,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /**
   * Partidas do dia: atualização moderada
   */
  todayMatches: {
    refetchInterval: 60_000, // 1 min
    staleTime: 30_000,
    gcTime: 300_000, // 5 min
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /**
   * Lista global: atualização moderada com cache longo
   */
  globalMatches: {
    refetchInterval: 60_000,
    staleTime: 30_000,
    gcTime: 600_000, // 10 min
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  /**
   * Detalhe de partida: condicional (live = frequente, senão = rare)
   */
  matchDetail: (isLive: boolean) => ({
    refetchInterval: isLive ? 15_000 : false,
    staleTime: isLive ? 10_000 : 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: isLive,
    refetchOnReconnect: true,
  }),

  /**
   * Times: dados estáticos, cache longo
   */
  teams: {
    staleTime: 10 * 60_000, // 10 min
    gcTime: 30 * 60_000, // 30 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /**
   * Forma de time: moderadamente dinâmico
   */
  teamForm: {
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  },

  /**
   * Competições: dados quase estáticos
   */
  competitions: {
    staleTime: 15 * 60_000,
    gcTime: 60 * 60_000, // 1 hora
    refetchOnWindowFocus: false,
  },

  /**
   * Tabela de classificação: atualização esporádica
   */
  competitionTable: {
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnWindowFocus: false,
  },

  /**
   * Notícias: atualização periódica
   */
  news: {
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  /**
   * Análise estatística: atualização moderada, dados computacionalmente caros
   */
  analysis: {
    refetchInterval: 120_000, // 2 min
    staleTime: 60_000,
    gcTime: 600_000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
} as const

/**
 * Configuração de initial data vinda do servidor.
 *
 * Marca com timestamp 0 para forçar revalidação imediata no mount,
 * mas mantém o conteúdo renderizado (sem skeleton).
 */
export function withInitialData<T>(data: T | undefined) {
  if (!data) return {}

  return {
    initialData: data,
    initialDataUpdatedAt: 0,
  }
}

/**
 * Determina se deve fazer refetch baseado na condição dinâmica.
 */
export function conditionalRefetch(
  condition: boolean,
  interval: number | false
): number | false {
  return condition ? interval : false
}
