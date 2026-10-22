"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useFavoritesStore } from "@/lib/store"

type DevtoolsComponent = React.ComponentType<{ initialIsOpen?: boolean }>

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: 1,
            refetchInterval: false,
          },
        },
      })
  )

  const [Devtools, setDevtools] = useState<DevtoolsComponent | null>(null)

  // Carrega os favoritos persistidos só depois da hidratação.
  useEffect(() => {
    try {
      const result = useFavoritesStore.persist.rehydrate()
      // `rehydrate` pode devolver uma Promise (storage assíncrono) e rejeitar
      // quando o localStorage está bloqueado ou o JSON salvo está corrompido.
      if (result && typeof (result as Promise<void>).catch === "function") {
        ;(result as Promise<void>).catch(() => {})
      }
    } catch {
      // Sem persistência: segue com o estado padrão em memória.
    }
  }, [])

  // Import dinâmico apenas em desenvolvimento: no build de produção o bloco é
  // eliminado e as devtools não entram no bundle do cliente.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    let cancelled = false
    import("@tanstack/react-query-devtools")
      .then((mod) => {
        if (!cancelled) setDevtools(() => mod.ReactQueryDevtools)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Devtools ? <Devtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}
