"use client"

import Link from "next/link"
import { Heart, Pin, Bell, Star } from "lucide-react"
import { useFavoritesStore } from "@/lib/store"
import { useTeams } from "@/lib/queries"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { TeamCard } from "@/components/futebol/TeamCard"

export default function FavoritosPage() {
  const favorites = useFavoritesStore((s) => s.favorites)
  const pinnedMatches = useFavoritesStore((s) => s.pinnedMatches)
  const reminders = useFavoritesStore((s) => s.reminders)
  const { data: teams = [] } = useTeams()

  const favoriteTeams = teams.filter((t) => favorites.includes(t.id))

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Favoritos"
        subtitle="Times, partidas e lembretes salvos"
        eyebrow="Seus salvos"
      />

      {/* Times favoritos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <Star className="h-4 w-4 text-primary" />
          Times favoritos ({favoriteTeams.length})
        </h2>
        {favoriteTeams.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Nenhum time favorito"
            description="Toque na estrela em um time para salvá-lo aqui."
          />
        ) : (
          <div className="grid gap-2">
            {favoriteTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </section>

      {/* Partidas fixadas */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <Pin className="h-4 w-4 text-primary" />
          Partidas fixadas ({pinnedMatches.length})
        </h2>
        {pinnedMatches.length === 0 ? (
          <EmptyState
            icon={Pin}
            title="Nenhuma partida fixada"
            description="Fixe partidas para acompanhá-las no topo da lista."
          />
        ) : (
          <ul className="space-y-2">
            {pinnedMatches.map((id) => (
              <li key={id}>
                <Link
                  href={`/jogos/${id}`}
                  className="block rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:border-primary/40"
                >
                  Partida {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lembretes */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <Bell className="h-4 w-4 text-primary" />
          Lembretes ({reminders.length})
        </h2>
        {reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Nenhum lembrete"
            description="Ative lembretes em partidas para ser notificado."
          />
        ) : (
          <ul className="space-y-2">
            {reminders.map((id) => (
              <li key={id}>
                <Link
                  href={`/jogos/${id}`}
                  className="block rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:border-primary/40"
                >
                  Lembrete: partida {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}