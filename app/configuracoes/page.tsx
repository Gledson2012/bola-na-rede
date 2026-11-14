"use client"

import { useState } from "react"
import { Sun, Moon, Laptop, Trash2, Heart, Bell, Pin } from "lucide-react"
import { useThemeStore } from "@/lib/store"
import { useFavoritesStore } from "@/lib/store"
import { PageHeader } from "@/components/ui/page-header"

export default function ConfiguracoesPage() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const favorites = useFavoritesStore((s) => s.favorites)
  const pinnedMatches = useFavoritesStore((s) => s.pinnedMatches)
  const reminders = useFavoritesStore((s) => s.reminders)
  const pinnedLeagues = useFavoritesStore((s) => s.pinnedLeagues)
  const [cleared, setCleared] = useState(false)

  const clearAll = () => {
    useFavoritesStore.setState({
      favorites: [],
      pinnedMatches: [],
      reminders: [],
      pinnedLeagues: [],
    })
    setCleared(true)
    setTimeout(() => setCleared(false), 2000)
  }

  const options: { value: "system" | "light" | "dark"; label: string; icon: typeof Sun }[] = [
    { value: "system", label: "Sistema", icon: Laptop },
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
  ]

  return (
    <div className="space-y-6 pb-24">
      <PageHeader title="Configurações" subtitle="Personalize sua experiência" eyebrow="Ajustes" />

      {/* Tema */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
          Aparência
        </h2>
        <div className="flex gap-2">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`press flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition-colors ${
                theme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
              aria-pressed={theme === value}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Estatísticas */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
          Dados salvos
        </h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" /> Times favoritos
            </span>
            <span className="font-bold">{favorites.length}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-primary" /> Partidas fixadas
            </span>
            <span className="font-bold">{pinnedMatches.length}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> Lembretes
            </span>
            <span className="font-bold">{reminders.length}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pin className="h-4 w-4 text-primary" /> Ligas fixadas
            </span>
            <span className="font-bold">{pinnedLeagues.length}</span>
          </li>
        </ul>
      </section>

      {/* Limpar dados */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-muted-foreground">
          Zona de perigo
        </h2>
        <button
          onClick={clearAll}
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20"
        >
          <Trash2 className="h-4 w-4" />
          {cleared ? "Dados limpos!" : "Limpar todos os dados salvos"}
        </button>
      </section>
    </div>
  )
}