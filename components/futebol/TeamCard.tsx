"use client"

import Link from "next/link"
import { Star, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Team } from "@/types"
import { useFavorites } from "@/lib/queries"
import { TeamLogo } from "@/components/futebol/TeamLogo"

interface TeamCardProps {
  team: Team
  compact?: boolean
  showFavoriteButton?: boolean
  showLeague?: boolean
  showForm?: boolean
  showRecord?: boolean
  showPoints?: boolean
  showPosition?: boolean
}

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Forma: ${form.join(" ")}`}>
      {form.slice(0, 5).map((result, index) => (
        <span
          key={`${result}-${index}`}
          title={result === "W" ? "Vitória" : result === "D" ? "Empate" : "Derrota"}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            result === "W"
              ? "bg-emerald-500"
              : result === "D"
                ? "bg-slate-400 dark:bg-slate-500"
                : "bg-red-500"
          )}
        />
      ))}
    </span>
  )
}

export function TeamCard({
  team,
  showFavoriteButton = true,
  showLeague = true,
  showForm = true,
  showPoints = true,
  showPosition = true,
}: TeamCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(team.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(team.id)
  }

  const isLive = (team.liveMatches ?? 0) > 0
  const playsToday = (team.matchesToday ?? 0) > 0

  return (
    <div className="group relative flex items-center gap-1 rounded-2xl border border-border/80 bg-card pl-3 pr-1.5 transition-colors hover:border-primary/30 hover:shadow-sm">
      <Link
        href={`/times/${team.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5"
        aria-label={team.name}
      >
        <TeamLogo src={team.logo} name={team.name} color={team.primaryColor} size={36} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12.5px] font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {team.name}
            </span>
            {isLive ? (
              <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-live/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-live">
                <span className="live-dot h-1 w-1" />
                Ao vivo
              </span>
            ) : playsToday ? (
              <span className="flex-shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-primary">
                Hoje
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[9.5px] font-medium text-muted-foreground">
            <span className="flex-shrink-0 font-black uppercase tracking-wide text-foreground/50">
              {team.shortName}
            </span>
            {showPosition && team.position !== undefined && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="tabular font-black text-foreground/70">#{team.position}</span>
              </>
            )}
            {showLeague && team.competition && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="truncate">{team.competition}</span>
              </>
            )}
            {showForm && team.form && team.form.length > 0 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <FormDots form={team.form} />
              </>
            )}
          </div>
        </div>

        {showPoints && team.points !== undefined && (
          <span className="tabular flex-shrink-0 text-right">
            <span className="block text-[13px] font-black leading-none text-foreground">
              {team.points}
            </span>
            <span className="text-[8px] font-bold uppercase text-muted-foreground">pts</span>
          </span>
        )}

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>

      {showFavoriteButton && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={favorite}
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors",
            favorite
              ? "text-amber-500"
              : "text-muted-foreground/40 hover:bg-muted hover:text-amber-500"
          )}
        >
          <Star className={cn("h-4 w-4", favorite && "fill-current")} />
        </button>
      )}
    </div>
  )
}
