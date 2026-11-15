import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Hook para debounce de valores.
 * Útil para busca e filtros em tempo real.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para throttle de funções.
 * Útil para scroll handlers e resize.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(0)
  const callbackRef = useRef(callback)

  // Mantém callback atualizado
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        callbackRef.current(...args)
        lastRun.current = now
      }
    },
    [delay]
  )
}

/**
 * Hook para detectar se o elemento está visível no viewport.
 * Útil para lazy loading e infinite scroll.
 */
export function useIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callback()
        }
      },
      options
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [callback, options])

  return targetRef
}

/**
 * Métricas de performance.
 * Log de tempos de renderização e interação.
 */
export function logPerformance(metricName: string, startTime: number) {
  const duration = performance.now() - startTime

  if (process.env.NODE_ENV === "development") {
    console.log(`[Performance] ${metricName}: ${duration.toFixed(2)}ms`)
  }

  // Pode ser enviado para analytics em produção
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtag = (window as any).gtag
    if (typeof gtag === "function") {
      gtag("event", "timing_complete", {
        name: metricName,
        value: Math.round(duration),
        event_category: "Performance",
      })
    }
  }
}

/**
 * Hook para medir tempo de renderização.
 */
export function useRenderTime(componentName: string) {
  const renderStart = useRef<number>(0)

  // Inicializa no primeiro efeito, não durante render
  useEffect(() => {
    if (renderStart.current === 0) {
      renderStart.current = performance.now()
    }
  }, [])

  useEffect(() => {
    if (renderStart.current > 0) {
      logPerformance(`${componentName} render`, renderStart.current)
    }
  })
}
