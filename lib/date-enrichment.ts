/**
 * Enriquecimento de dados de partidas com data real.
 *
 * A API externa de futebol (`futebol-api-nine.vercel.app`) retorna apenas o
 * horário do jogo (`"15:00"`), sem data de calendário. Este módulo tenta
 * obter a data real de uma fonte alternativa configurada via variável de
 * ambiente (`DATE_ENRICHMENT_URL`), ou, em sua ausência, usa a data de hoje
 * como fallback (comportamento anterior).
 *
 * A fonte alternativa deve responder com um JSON no formato:
 *   { "matches": { "<matchId>": "YYYY-MM-DD" } }
 * ou um array de { id, date }.
 */

import { fetchWithTimeout } from "@/lib/api"

export interface DateEnrichmentSource {
  /** URL base da fonte de enriquecimento. */
  baseUrl: string
  /** Timeout em milissegundos. */
  timeoutMs: number
}

/** Cache em memória de datas enriquecidas por matchId. */
const enrichedDates = new Map<string, string>()

/** TTL do cache de datas enriquecidas (1 hora). */
const CACHE_TTL_MS = 60 * 60 * 1000

/** Timestamps de expiração por matchId. */
const cacheExpiry = new Map<string, number>()

/**
 * Configura a fonte de enriquecimento a partir de variáveis de ambiente.
 * Se não configurada, retorna null (sem enriquecimento).
 */
export function getDateEnrichmentSource(): DateEnrichmentSource | null {
  const baseUrl = process.env.DATE_ENRICHMENT_URL?.replace(/\/$/, "")
  if (!baseUrl) return null
  const timeoutMs = Number(process.env.DATE_ENRICHMENT_TIMEOUT_MS) || 5_000
  return { baseUrl, timeoutMs }
}

/**
 * Busca a data real de uma partida de uma fonte de enriquecimento.
 *
 * Retorna a data no formato `YYYY-MM-DD` ou `null` se não disponível.
 */
export async function fetchEnrichedDate(
  matchId: string,
  source: DateEnrichmentSource
): Promise<string | null> {
  // Verifica cache
  const cached = enrichedDates.get(matchId)
  const expiry = cacheExpiry.get(matchId)
  if (cached && expiry && Date.now() < expiry) {
    return cached
  }

  try {
    const response = await fetchWithTimeout(
      `${source.baseUrl}/matches/${encodeURIComponent(matchId)}/date`,
      { cache: "no-store" },
      source.timeoutMs
    )

    if (!response.ok) return null

    const data = (await response.json()) as { date?: string; match?: { date?: string } }
    const date = data.date || data.match?.date
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      enrichedDates.set(matchId, date)
      cacheExpiry.set(matchId, Date.now() + CACHE_TTL_MS)
      return date
    }
    return null
  } catch {
    // Fonte indisponível: falha silenciosa
    return null
  }
}

/**
 * Busca datas enriquecidas para múltiplas partidas em paralelo.
 */
export async function fetchEnrichedDates(
  matchIds: string[],
  source: DateEnrichmentSource
): Promise<Map<string, string>> {
  const result = new Map<string, string>()

  const promises = matchIds.map(async (id) => {
    const date = await fetchEnrichedDate(id, source)
    if (date) result.set(id, date)
  })

  await Promise.all(promises)
  return result
}

/**
 * Constrói a data ISO de uma partida, tentando enriquecimento quando
 * a fonte está configurada.
 *
 * @param matchId - ID da partida
 * @param kickoff - Horário no formato "HH:MM"
 * @returns Data ISO no formato "YYYY-MM-DDTHH:MM:SS.000Z"
 */
export async function buildEnrichedMatchDate(
  matchId: string,
  kickoff?: string
): Promise<string> {
  const source = getDateEnrichmentSource()
  let dateStr: string | null = null

  if (source) {
    dateStr = await fetchEnrichedDate(matchId, source)
  }

  if (!dateStr) {
    // Fallback: usa a data de hoje (comportamento anterior)
    const today = new Date()
    const [hours, minutes] = kickoff?.split(":").map(Number) ?? []
    const matchDate = new Date(today)
    matchDate.setUTCHours(
      isNaN(hours ?? NaN) ? 12 : hours!,
      isNaN(minutes ?? NaN) ? 0 : minutes!,
      0,
      0
    )
    return matchDate.toISOString()
  }

  // Usa a data enriquecida
  const [year, month, day] = dateStr.split("-").map(Number)
  const [hours, minutes] = kickoff?.split(":").map(Number) ?? []
  const matchDate = new Date(Date.UTC(year, month - 1, day))
  matchDate.setUTCHours(
    isNaN(hours ?? NaN) ? 12 : hours!,
    isNaN(minutes ?? NaN) ? 0 : minutes!,
    0,
    0
  )
  return matchDate.toISOString()
}

/**
 * Limpa o cache de datas enriquecidas (útil para testes).
 */
export function clearEnrichedDateCache(): void {
  enrichedDates.clear()
  cacheExpiry.clear()
}