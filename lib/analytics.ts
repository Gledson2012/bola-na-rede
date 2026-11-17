/**
 * Utilitário centralizado de analytics.
 *
 * Envia eventos para o Vercel Analytics (via window.gtag ou
 * @vercel/analytics) com fallback para console em desenvolvimento.
 * Todas as chamadas são fire-and-forget: nunca derrubam a UI.
 */

type AnalyticsEvent = {
  name: string
  params?: Record<string, string | number | boolean>
}

/** Envia um evento personalizado para o provedor de analytics. */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return

  try {
    // Vercel Analytics expõe window.gtag quando integrado
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
    if (typeof gtag === "function") {
      gtag("event", event.name, {
        event_category: "Bola na Rede",
        ...event.params,
      })
    }

    // Log em desenvolvimento para depuração local
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${event.name}`, event.params)
    }
  } catch {
    // Analytics nunca deve quebrar a aplicação
  }
}

/** Mede o tempo de carregamento de um recurso ou tela. */
export function trackTiming(metricName: string, valueMs: number): void {
  trackEvent({
    name: "timing_complete",
    params: {
      name: metricName,
      value: Math.round(valueMs),
      event_category: "Performance",
    },
  })
}

/** Rastreia uma exceção não tratada. */
export function trackError(error: Error, context?: string): void {
  trackEvent({
    name: "exception",
    params: {
      description: `${context ?? ""}:${error.message}`.slice(0, 200),
      fatal: false,
      event_category: "Errors",
    },
  })
}