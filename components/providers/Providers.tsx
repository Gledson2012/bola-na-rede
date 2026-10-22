"use client"

import {
  IsRestoringProvider,
  QueryClient,
  QueryClientProvider,
  useIsRestoring,
} from "@tanstack/react-query"
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

/**
 * Executa a tarefa quando o navegador já terminou a hidratação/pintura inicial.
 *
 * `requestIdleCallback` só roda quando não há trabalho urgente na fila — que é
 * exatamente o caso da hidratação do React. O `timeout` garante que a tarefa
 * aconteça mesmo em dispositivos ocupados.
 */
function scheduleAfterHydration(task: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  let cancelled = false
  const run = () => {
    if (!cancelled) task()
  }

  const idleWindow = window as unknown as {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout: number }
    ) => number
    cancelIdleCallback?: (handle: number) => void
  }

  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(run, { timeout: 300 })
    return () => {
      cancelled = true
      idleWindow.cancelIdleCallback?.(handle)
    }
  }

  const handle = window.setTimeout(run, 50)
  return () => {
    cancelled = true
    window.clearTimeout(handle)
  }
}

/**
 * Mantém as consultas pausadas até a hidratação terminar.
 *
 * Sem isso, o React Query começa a buscar durante o SSR e, no cliente, os
 * dados (ou o cache restaurado do localStorage) podem chegar no meio da
 * hidratação. O React então compara uma árvore com dados contra o HTML
 * estático e acusa "Text content does not match server-rendered HTML".
 *
 * O `IsRestoringProvider` é o mecanismo oficial do React Query para isso:
 * enquanto `true`, os observadores não se inscrevem nem disparam requisições.
 */
function HydrationGate({ children }: { children: React.ReactNode }) {
  const isRestoringPersistedCache = useIsRestoring()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => scheduleAfterHydration(() => setHydrated(true)), [])

  return (
    <IsRestoringProvider value={isRestoringPersistedCache || !hydrated}>
      {children}
    </IsRestoringProvider>
  )
}

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
      const base = createSyncStoragePersister({
        storage: window.localStorage,
        key: "bnr-query-cache",
        throttleTime: 1_000,
      })

      // Restaurar o snapshot antes da hidratação faria o cliente renderizar
      // dados antigos no lugar do HTML do servidor. Adiamos a leitura do
      // localStorage para depois da hidratação; até lá o `isRestoring` do
      // PersistQueryClientProvider mantém as consultas pausadas.
      return {
        ...base,
        restoreClient: (): Promise<
          Awaited<ReturnType<typeof base.restoreClient>>
        > =>
          new Promise((resolve, reject) => {
            scheduleAfterHydration(() => {
              try {
                Promise.resolve(base.restoreClient()).then(resolve, reject)
              } catch (error) {
                reject(error)
              }
            })
          }),
      }
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
    <HydrationGate>
      {children}
      {Devtools ? <Devtools initialIsOpen={false} /> : null}
    </HydrationGate>
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
