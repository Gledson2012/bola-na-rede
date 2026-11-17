"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Check, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { fetchWithTimeout } from "@/lib/api"

export default function NotificacoesPage() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  )
  interface PushConfig {
    pushConfigured: boolean
    redisConfigured: boolean
    aiConfigured: boolean
    vapidPublicKey: string | null
  }

  const [config, setConfig] = useState<PushConfig | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Carrega configuração de push do servidor
    fetchWithTimeout("/api/push/config", { cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
        }
      })
      .catch(() => {
        // Falha silenciosa: configuração será verificada ao tentar ativar
      })
  }, [])

  const requestPermissionAndSubscribe = async () => {
    if (typeof Notification === "undefined") return

    if (!config?.pushConfigured) {
      alert("O serviço de notificações ainda não foi configurado pelo servidor.")
      return
    }

    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        // Inscreve no Push API via Service Worker e salva no servidor
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.ready
          const vapidKey = config.vapidPublicKey
          if (!vapidKey) {
            console.error("[notificacoes] VAPID public key não disponível")
            return
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              vapidKey
            ) as unknown as BufferSource,
          })

          await fetchWithTimeout("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              expirationTime: subscription.expirationTime,
              keys: {
                p256dh: btoa(
                  String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))
                ),
                auth: btoa(
                  String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
                ),
              },
            }),
          })
        }
      }
    } catch (error) {
      console.error("[notificacoes] falha ao ativar notificações:", error)
      setPermission("denied")
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetchWithTimeout("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }
    }
    setPermission(Notification.permission)
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Notificações"
        subtitle="Gerencie alertas de partidas e gols"
        eyebrow="Push"
      />

      {!config && (
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Verificando configuração…</p>
        </div>
      )}

      {config && !config.pushConfigured && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-destructive">Notificações não configuradas</p>
              <p className="text-xs text-muted-foreground">
                O servidor ainda não configurou o serviço de push (Redis + VAPID).
                Ative as variáveis de ambiente e faça o deploy novamente.
              </p>
            </div>
          </div>
        </section>
      )}

      {config && config.pushConfigured && (
        <>
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {permission === "granted" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">Notificações push</p>
                <p className="text-xs text-muted-foreground">
                  {permission === "unsupported"
                    ? "Seu navegador não suporta notificações."
                    : permission === "granted"
                    ? "Ativadas — você receberá alertas de gols e partidas."
                    : permission === "denied"
                    ? "Bloqueadas — altere nas configurações do navegador."
                    : "Desativadas — clique para ativar."}
                </p>
              </div>
              {permission === "default" && (
                <button
                  onClick={requestPermissionAndSubscribe}
                  disabled={loading}
                  className="press rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {loading ? "Ativando…" : "Ativar"}
                </button>
              )}
              {permission === "granted" && !loading && (
                <button
                  onClick={unsubscribe}
                  className="press rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/20"
                >
                  <BellOff className="h-3.5 w-3.5" /> Desativar
                </button>
              )}
              {permission === "granted" && !loading && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                  <Check className="h-3.5 w-3.5" /> Ativo
                </span>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
              Como funciona
            </h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>• Você recebe alertas quando um gol é marcado em partidas fixadas.</li>
              <li>• Lembretes de partidas começam 15 minutos antes do início.</li>
              <li>• Você pode desativar a qualquer momento nas configurações do navegador.</li>
              <li>• As notificações exigem Service Worker e permissão do usuário.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

/**
 * Converte uma chave VAPID base64url para Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}