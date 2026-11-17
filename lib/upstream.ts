/**
 * Cliente único da API de futebol.
 *
 * Centraliza a URL do upstream (mesma variável de ambiente usada pelo rewrite
 * de `/api/proxy` no `next.config.js`) e o tratamento de erro, evitando que
 * cada rota repita o `fetch` e o tratamento de status.
 *
 * Inclui um cache em memória com TTL que serve como fallback quando a API
 * externa está indisponível: se a requisição falhar e houver um valor em
 * cache (mesmo expirado), ele é retornado em vez de lançar erro, evitando
 * que a aplicação fique completamente fora do ar.
 */

import { unwrapApiPayload } from "@/lib/api-envelope"

export const UPSTREAM_BASE =
  process.env.FUTEBOL_API_URL?.replace(/\/$/, "") ||
  "https://futebol-api-nine.vercel.app"

export class UpstreamError extends Error {
  readonly status: number

  constructor(status: number, path: string, message?: string) {
    super(message || `Upstream ${status} em ${path}`)
    this.name = "UpstreamError"
    this.status = status
  }
}

interface UpstreamJsonOptions {
  /** Janela de revalidação do cache de dados do Next (segundos). */
  revalidate?: number
  /** Timeout da requisição em milissegundos. */
  timeoutMs?: number
  /** TTL do cache de fallback em segundos (padrão: 300s = 5 min). */
  fallbackTtlSeconds?: number
}

/** Entrada do cache em memória. */
interface CacheEntry<T> {
  data: T
  expiry: number
}

/** Cache em memória compartilhado por instância do serverless. */
const memoryCache = new Map<string, CacheEntry<unknown>>()

/** Chave de cache baseada no caminho da requisição. */
function cacheKey(path: string): string {
  return `upstream:${path}`
}

/** TTL padrão do cache de fallback (5 minutos). */
const DEFAULT_FALLBACK_TTL_SECONDS = 300

export async function getUpstreamJson<T>(
  path: string,
  options: UpstreamJsonOptions = {}
): Promise<T> {
  const { revalidate, timeoutMs = 12_000, fallbackTtlSeconds = DEFAULT_FALLBACK_TTL_SECONDS } = options

  try {
    const response = await fetch(`${UPSTREAM_BASE}${path}`, {
      headers: { Accept: "application/json" },
      ...(revalidate === undefined
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) {
      let detail: string | undefined
      try {
        const body = (await response.json()) as { message?: unknown }
        if (typeof body.message === "string" && body.message.trim()) {
          detail = body.message.trim()
        }
      } catch {
        // Corpo não-JSON: mantém a mensagem padrão.
      }
      throw new UpstreamError(response.status, path, detail)
    }

    const data = unwrapApiPayload<T>(await response.json())

    // Armazena no cache de fallback para uso futuro se a API cair
    memoryCache.set(cacheKey(path), {
      data,
      expiry: Date.now() + fallbackTtlSeconds * 1000,
    })

    return data
  } catch (error) {
    // Em caso de falha, tenta servir do cache de fallback (mesmo expirado)
    const cached = memoryCache.get(cacheKey(path))
    if (cached) {
      console.warn(
        `[upstream] API indisponível para ${path}; servindo do cache de fallback (expirado em ${new Date(cached.expiry).toISOString()})`
      )
      return cached.data as T
    }
    throw error
  }
}

/**
 * Limpa o cache de fallback de um caminho específico (útil para testes e invalidação manual).
 */
export function clearUpstreamCache(path?: string): void {
  if (path) {
    memoryCache.delete(cacheKey(path))
  } else {
    memoryCache.clear()
  }
}
