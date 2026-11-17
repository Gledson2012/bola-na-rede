/**
 * Medição de Web Vitals em produção.
 *
 * Usa a API web-vitals nativa do navegador (PerformanceObserver) para
 * capturar LCP, CLS, FID/INP e TTFB. Os valores são enviados para o
 * analytics apenas em produção, para não poluir o ambiente de dev.
 *
 * Referência: https://web.dev/vitals/
 */

import { trackEvent, trackTiming } from "@/lib/analytics"

/** Limiares considerados "bons" segundo as recomendações do Web Vitals. */
const THRESHOLDS = {
  LCP: 2500, // ms
  CLS: 0.1,
  INP: 200, // ms (sucessor do FID)
  TTFB: 800, // ms
} as const

type VitalName = "LCP" | "CLS" | "INP" | "TTFB"

/** Classifica o valor da métrica como "good", "ni" (precisa melhorar) ou "poor". */
function classify(name: VitalName, value: number): "good" | "ni" | "poor" {
  const threshold = THRESHOLDS[name]
  if (value <= threshold) return "good"
  if (value <= threshold * 2) return "ni"
  return "poor"
}

/**
 * Inicia a coleta de Web Vitals.
 *
 * Deve ser chamado uma vez no layout raiz (client component).
 * Só envia dados em produção (process.env.NODE_ENV === "production").
 */
export function initWebVitals(): void {
  if (typeof window === "undefined") return
  if (process.env.NODE_ENV === "production") {
    // Em produção, observa silenciosamente e envia via analytics
    observeVitals((entry) => {
      const category = classify(entry.name, entry.value)
      trackEvent({
        name: "web_vital",
        params: {
          vital: entry.name,
          value: Math.round(entry.value),
          rating: category,
          event_category: "Web Vitals",
        },
      })
    })
  } else {
    // Em desenvolvimento, apenas loga
    observeVitals((entry) => {
      console.log(`[Web Vitals] ${entry.name}: ${Math.round(entry.value)}`)
    })
  }
}

/**
 * Observa métricas de performance usando PerformanceObserver.
 * O callback recebe entradas com { name, value, rating? }.
 */
function observeVitals(callback: (entry: { name: VitalName; value: number }) => void): void {
  if (!("PerformanceObserver" in window)) return

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      if (last) {
        callback({ name: "LCP", value: last.startTime })
      }
    })
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
  } catch {
    // LCP não suportado neste navegador
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
        if (!e.hadRecentInput) {
          clsValue += e.value ?? 0
        }
      }
      callback({ name: "CLS", value: clsValue })
    })
    clsObserver.observe({ entryTypes: ["layout-shift"] })
  } catch {
    // CLS não suportado
  }

  // Interaction to Next Paint (sucessor do FID)
  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number; processingStart?: number }
      if (last) {
        const value = last.processingStart
          ? last.processingStart - last.startTime
          : last.startTime
        callback({ name: "INP", value })
      }
    })
    inpObserver.observe({ entryTypes: ["event"] })
  } catch {
    // INP não suportado
  }

  // Time to First Byte (via navigation timing)
  try {
    if ("performance" in window) {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined
      if (nav) {
        callback({ name: "TTFB", value: nav.responseStart - nav.requestStart })
      }
    }
  } catch {
    // TTFB não disponível
  }
}