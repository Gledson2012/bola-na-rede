"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

/**
 * Aviso global de modo offline.
 *
 * Com o cache do React Query persistido, as telas continuam mostrando os
 * últimos dados. O aviso deixa claro que eles podem estar desatualizados.
 * O estado inicial é `false` nos dois lados para não divergir na hidratação;
 * o valor real é lido no efeito.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)

    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)

    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-1.5 border-b border-warning/25 bg-warning/10 px-3 py-1.5 text-[10px] font-bold text-warning"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Sem conexão — mostrando os últimos dados salvos.
    </div>
  )
}
