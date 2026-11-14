"use client"

import { useState } from "react"
import { Bell, BellOff, Check } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

export default function NotificacoesPage() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  )
  const [subscribed, setSubscribed] = useState(false)

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === "granted") {
      setSubscribed(true)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Notificações"
        subtitle="Gerencie alertas de partidas e gols"
        eyebrow="Push"
      />

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
              onClick={requestPermission}
              className="press rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              Ativar
            </button>
          )}
          {permission === "granted" && subscribed && (
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
        </ul>
      </section>
    </div>
  )
}