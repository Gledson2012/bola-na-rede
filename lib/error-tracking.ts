/**
 * Captura de erros não tratados no cliente.
 *
 * Instala listeners globais para:
 * - window.onerror (erros de script e recursos)
 * - window.onunhandledrejection (promises rejeitadas)
 *
 * Os erros são enviados para o analytics e logados em desenvolvimento.
 * Nunca derrubam a aplicação.
 */

import { trackError } from "@/lib/analytics"

/** Inicializa os listeners globais de erro. Chamar uma vez no layout raiz. */
export function initErrorTracking(): void {
  if (typeof window === "undefined") return

  const handleError = (event: ErrorEvent | string) => {
    const message = typeof event === "string" ? event : event.message
    const err = new Error(message)
    const context =
      typeof event === "string" ? "window.onerror" : `${event.filename}:${event.lineno}:${event.colno}`
    trackError(err, context)
    console.error(`[Error Tracking] ${context}:`, err)
  }

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const err =
      reason instanceof Error ? reason : new Error(String(reason ?? "unknown"))
    trackError(err, "unhandledrejection")
    console.error("[Error Tracking] Unhandled rejection:", err)
  }

  window.addEventListener("error", (event) => {
    handleError(event)
  })

  window.addEventListener("unhandledrejection", (event) => {
    handleRejection(event)
  })
}