/**
 * Failover de múltiplas fontes de API de futebol.
 *
 * Permite configurar URLs de fallback para quando a fonte primária estiver
 * indisponível. Cada fonte é tentada em ordem; a primeira que responder com
 * sucesso é usada, e fontes que falham são marcadas temporariamente como
 * indisponíveis para não bloquear tentativas subsequentes dentro de uma janela
 * de tempo.
 *
 * Exemplo de variáveis de ambiente:
 *   FUTEBOL_API_URL=https://api-primary.vercel.app
 *   FUTEBOL_API_FALLBACK_URLS=https://api-fallback-1.vercel.app,https://api-fallback-2.vercel.app
 */

import { unwrapApiPayload } from "@/lib/api-envelope"

export interface ApiSource {
  baseUrl: string
  /** Quando a fonte está fora por falhas recentes (timestamp de expiração). */
  unavailableUntil: number
  /** Contador de falhas consecutivas. */
  consecutiveFailures: number
}

/** Janela em que uma fonte fica marcada como indisponível após falhas (30s). */
const SOURCE_COOLDOWN_MS = 30_000

/** Máximo de falhas consecutivas antes de marcar a fonte como indisponível. */
const MAX_CONSECUTIVE_FAILURES = 3

/** Lista de fontes (configurável em testes). */
let sources: ApiSource[] = []

/** Inicializa as fontes a partir das variáveis de ambiente. */
export function configureSourcesFromEnv(): ApiSource[] {
  const primary =
    process.env.FUTEBOL_API_URL?.replace(/\/$/, "") ||
    "https://futebol-api-nine.vercel.app"

  const fallbacks = process.env.FUTEBOL_API_FALLBACK_URLS
    ?.split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean) ?? []

  const newSources: ApiSource[] = [{ baseUrl: primary, unavailableUntil: 0, consecutiveFailures: 0 }]
  for (const url of fallbacks) {
    newSources.push({ baseUrl: url, unavailableUntil: 0, consecutiveFailures: 0 })
  }

  sources = newSources
  return sources
}

/** Configura fontes explicitamente (útil para testes). */
export function configureSources(urls: string[]): ApiSource[] {
  const newSources: ApiSource[] = urls.map((url) => ({
    baseUrl: url.replace(/\/$/, ""),
    unavailableUntil: 0,
    consecutiveFailures: 0,
  }))
  sources = newSources
  return sources
}

/** Retorna as fontes configuradas. */
export function getSources(): ApiSource[] {
  if (sources.length === 0) {
    return configureSourcesFromEnv()
  }
  return sources
}

/** Seleciona a melhor fonte disponível, ignorando as já tentadas. */
function selectSource(tried?: Set<ApiSource>): ApiSource | null {
  const now = Date.now()
  const currentSources = getSources()

  // Tenta fontes não em cooldown e não tentadas
  for (const source of currentSources) {
    if (now >= source.unavailableUntil && (!tried || !tried.has(source))) {
      return source
    }
  }

  // Tenta fontes em cooldown mas não tentadas
  for (const source of currentSources) {
    if (!tried || !tried.has(source)) {
      return source
    }
  }

  return null
}

/** Marca uma fonte como com falha, incrementando o contador de falhas. */
function markSourceFailure(source: ApiSource): void {
  source.consecutiveFailures++
  if (source.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    source.unavailableUntil = Date.now() + SOURCE_COOLDOWN_MS
    console.warn(
      `[api-failover] Fonte ${source.baseUrl} marcada como indisponível por ${SOURCE_COOLDOWN_MS / 1000}s`
    )
  }
}

/** Marca uma fonte como saudável, resetando o contador de falhas. */
function markSourceSuccess(source: ApiSource): void {
  source.consecutiveFailures = 0
  source.unavailableUntil = 0
}

/**
 * Faz fetch em uma fonte específica.
 */
async function fetchFromSource(
  source: ApiSource,
  path: string,
  options: { timeoutMs?: number }
): Promise<unknown> {
  const { timeoutMs = 12_000 } = options
  const response = await fetch(`${source.baseUrl}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: unknown }
    throw new Error(`HTTP ${response.status}${body.message ? `: ${body.message}` : ""}`)
  }

  return unwrapApiPayload<unknown>(await response.json())
}

/**
 * Faz fetch tentando múltiplas fontes em ordem de preferência.
 *
 * Retorna os dados da primeira fonte que responder com sucesso.
 * Se todas falharem, lança o último erro capturado.
 */
export async function fetchWithFailover<T>(
  path: string,
  options: { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 12_000 } = options
  const currentSources = getSources()

  if (currentSources.length === 0) {
    throw new Error("Nenhuma fonte de API disponível")
  }

  let lastError: unknown = null
  const tried = new Set<ApiSource>()

  for (let attempt = 0; attempt < currentSources.length; attempt++) {
    const source = selectSource(tried)
    if (!source) break
    tried.add(source)

    try {
      const data = await fetchFromSource(source, path, { timeoutMs })
      markSourceSuccess(source)
      return data as T
    } catch (error) {
      lastError = error
      markSourceFailure(source)
    }
  }

  throw lastError ?? new Error("Falha em todas as fontes de API")
}

/**
 * Retorna informações sobre o estado de cada fonte (para health check).
 */
export function getSourcesStatus(): Array<{
  baseUrl: string
  available: boolean
  consecutiveFailures: number
  unavailableUntil: number | null
}> {
  const now = Date.now()
  return getSources().map((source) => ({
    baseUrl: source.baseUrl,
    available: now >= source.unavailableUntil,
    consecutiveFailures: source.consecutiveFailures,
    unavailableUntil: source.unavailableUntil > now ? source.unavailableUntil : null,
  }))
}

/** Reinicia o estado de todas as fontes (útil para testes). */
export function resetSources(): void {
  for (const source of getSources()) {
    source.unavailableUntil = 0
    source.consecutiveFailures = 0
  }
}

// Inicializa as fontes a partir do env na primeira importação
configureSourcesFromEnv()