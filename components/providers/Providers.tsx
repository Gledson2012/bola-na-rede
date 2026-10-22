"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { useEffect, useState } from "react"
import { useFavoritesStore } from "@/lib/store"
import { shouldPersistQuery } from "@/lib/query-persistence"

type DevtoolsComponent = React.ComponentType<{ initialIsOpen?: boolean }>

/**
 * Cache de leitura em `localStorage`.
 *
 * Sem isso, abrir o app sem rede (ou com rede instável) mostrava erro mesmo
 * com o service worker entregando o HTML: os dados viviam só na memória.
 * Agora o último resultado bem-sucedido das telas principais é restaurado e
 * substituído na primeira consulta que der certo.
 */
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000

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
            // Precisa ser >= CACHE_MAX_AGE para o snapshot não perder as
            // consultas que ainda não foram reutilizadas nesta sessão.
            gcTime: CACHE_MAX_AGE,
          },
        },
      })
  )

  // Criado só no cliente: no servidor não existe localStorage.
  const [persister] = useState(() => {
    if (typeof window === "undefined") return null
    try {
      return createSyncStoragePersister({
        storage: window.localStorage,
        key: "bnr-query-cache",
        throttleTime: 1_000,
      })
    } catch {
      // Storage bloqueado (modo privado): segue sem persistência.
      return null
    }
  })

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

  const content = (
    <>
      {children}
      {Devtools ? <Devtools initialIsOpen={false} /> : null}
    </>
  )

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    )
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      {content}
    </PersistQueryClientProvider>
  )
}
