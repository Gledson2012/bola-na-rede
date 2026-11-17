"use client"

import { useEffect } from "react"
import { initWebVitals } from "@/lib/web-vitals"
import { initErrorTracking } from "@/lib/error-tracking"

/**
 * Inicializa Web Vitals e rastreamento de erros no cliente.
 *
 * Deve ser incluído uma vez no layout raiz. Como usa `useEffect`, só roda
 * no navegador (não há impacto no SSR).
 */
export function AnalyticsInit() {
  useEffect(() => {
    initWebVitals()
    initErrorTracking()
  }, [])

  return null
}