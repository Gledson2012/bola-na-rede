"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, BellOff, LoaderCircle } from "lucide-react"

interface PushConfig {
  pushConfigured: boolean
  redisConfigured: boolean
  aiConfigured: boolean
  vapidPublicKey: string | null
}

function base64UrlToBytes(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index++) {
    bytes[index] = raw.charCodeAt(index)
  }
  return bytes.buffer
}

async function responseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body.error === "string") return body.error
  } catch {
    return `A solicitação falhou (${response.status}).`
  }
  return `A solicitação falhou (${response.status}).`
}

export function LiveAlertsControl() {
  const [config, setConfig] = useState<PushConfig | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    setError(null)
    try {
      const response = await fetch("/api/push/config", { cache: "no-store" })
      if (!response.ok) throw new Error(await responseError(response))
      const result = (await response.json()) as PushConfig
      setConfig(result)

      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.getRegistration("/")
        const subscription = await registration?.pushManager.getSubscription()
        setIsSubscribed(Boolean(subscription))

        // Renova o registro no servidor a cada abertura: o Redis guarda a
        // assinatura com TTL e pode ter sido limpo. Falhas são silenciosas —
        // o alerta continua funcionando no navegador.
        if (subscription && result.pushConfigured) {
          void fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription.toJSON()),
          }).catch(() => undefined)
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível verificar as notificações."
      )
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const toggleSubscription = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Este navegador não oferece notificações push.")
      }

      const registration =
        (await navigator.serviceWorker.getRegistration("/")) ??
        (await navigator.serviceWorker.register("/push-service-worker.js", {
          scope: "/",
        }))

      if (isSubscribed) {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const response = await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          })
          if (!response.ok) throw new Error(await responseError(response))
          const unsubscribed = await subscription.unsubscribe()
          if (!unsubscribed) {
            throw new Error("O navegador não conseguiu cancelar a assinatura push.")
          }
        }
        setIsSubscribed(false)
        setMessage("Alertas ao vivo desativados neste dispositivo.")
        return
      }

      if (!config?.pushConfigured || !config.vapidPublicKey) {
        throw new Error("As notificações push ainda não foram configuradas no servidor.")
      }

      if (!("Notification" in window)) {
        throw new Error("Este navegador não oferece notificações.")
      }
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        throw new Error("Permissão de notificação não concedida.")
      }

      const existingSubscription = await registration.pushManager.getSubscription()
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(config.vapidPublicKey),
        }))
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!response.ok) {
        if (!existingSubscription) await subscription.unsubscribe()
        throw new Error(await responseError(response))
      }

      setIsSubscribed(true)
      setMessage("Alertas ao vivo ativados neste dispositivo.")
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Não foi possível atualizar a assinatura."
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="surface p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h2 className="text-[12px] font-black tracking-tight">Alertas de partidas ao vivo</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
            Avisos de gols e cartões mesmo com o app fechado.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void toggleSubscription()}
          disabled={busy || loadingConfig || (!config?.pushConfigured && !isSubscribed)}
          className="press flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-black text-primary hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy || loadingConfig ? (
            <LoaderCircle className="h-3 w-3 animate-spin" />
          ) : isSubscribed ? (
            <BellOff className="h-3 w-3" />
          ) : (
            <Bell className="h-3 w-3" />
          )}
          {loadingConfig
            ? "Verificando…"
            : busy
            ? "Aguarde…"
            : isSubscribed
            ? "Desativar"
            : "Ativar alertas"}
        </button>
      </div>
      {config && !config.pushConfigured && (
        <p className="mt-2 text-[9.5px] text-muted-foreground">
          Alertas push indisponíveis neste servidor no momento.
        </p>
      )}
      {config && config.pushConfigured && !config.aiConfigured && (
        <p className="mt-2 text-[9.5px] text-muted-foreground">
          Alertas por evento ativos; resumos por IA chegam em breve.
        </p>
      )}
      {message && (
        <p className="mt-3 text-[10px] text-primary" role="status">
          {message}
        </p>
      )}
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="alert">
          <p className="text-[10px] text-destructive">{error}</p>
          {!config && (
            <button
              type="button"
              onClick={() => void loadConfig()}
              className="text-[10px] font-bold text-primary underline underline-offset-2"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
    </section>
  )
}
