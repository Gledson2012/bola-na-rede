/**
 * Cliente único da API de futebol.
 *
 * Centraliza a URL do upstream (mesma variável de ambiente usada pelo rewrite
 * de `/api/proxy` no `next.config.js`) e o tratamento de erro, evitando que
 * cada rota repita o `fetch` e o tratamento de status.
 */

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
}

export async function getUpstreamJson<T>(
  path: string,
  options: UpstreamJsonOptions = {}
): Promise<T> {
  const { revalidate, timeoutMs = 12_000 } = options

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

  return response.json() as Promise<T>
}
