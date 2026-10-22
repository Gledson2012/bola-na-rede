"use client"

import { useEffect } from "react"

/**
 * Registra o service worker no primeiro carregamento.
 *
 * O mesmo arquivo cuida de push e do cache offline; o registro sob demanda em
 * `LiveAlertsControl` continua valendo, este apenas garante que o fallback
 * offline esteja ativo mesmo para quem nunca ativou notificações.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register("/push-service-worker.js", { scope: "/" })
        .catch(() => undefined)
    }

    if (document.readyState === "complete") {
      register()
      return
    }

    window.addEventListener("load", register, { once: true })
    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
