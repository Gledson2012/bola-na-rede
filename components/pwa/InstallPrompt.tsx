"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!deferred || dismissed) return null

  const install = async () => {
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === "accepted") setDeferred(null)
    else setDismissed(true)
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 mx-auto max-w-lg rounded-2xl border border-border bg-card p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Instalar Bola na Rede</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Acesse placares e notícias mais rápido na tela inicial.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={install}
              className="press rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              Instalar
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="press rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-accent"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}