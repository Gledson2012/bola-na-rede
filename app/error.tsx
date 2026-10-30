"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-base font-black text-foreground">Algo deu errado</h2>
      <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
        Não foi possível exibir esta página. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="press mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Tentar novamente
      </button>
    </div>
  )
}
