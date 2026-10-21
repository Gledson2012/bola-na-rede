"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Team } from "@/types"
import { ChevronRight, Star, Trophy, Radio } from "lucide-react"
import { useFavorites } from "@/lib/queries"

interface TeamCardProps {
  team: Team
  compact?: boolean
  showFavoriteButton?: boolean
}

function TeamLogo({ src, alt, name, color, size = 42 }: { src?: string; alt: string; name: string; color?: string; size?: number }) {
  const [error, setError] = useState(false)
  const initial = name ? name.trim().charAt(0).toUpperCase() : "⚽"

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: color || "#0ea5e9" }}
        className="rounded-2xl text-white font-black flex items-center justify-center text-sm shadow-sm flex-shrink-0 border border-border"
        aria-label={alt}
      >
        {initial}
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size }} className="relative flex-shrink-0">
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="rounded-2xl object-cover border border-border shadow-sm bg-white p-0.5"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

export function TeamCard({ team, compact = false, showFavoriteButton = true }: TeamCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorite = isFavorite(team.id)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(team.id)
  }

  if (compact) {
    return (
      <Link
        href={`/times/${team.id}`}
        className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-futebol-300 transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamLogo src={team.logo} alt={team.name} name={team.name} color={team.primaryColor} size={28} />
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-futebol-600 transition-colors">
              {team.name}
            </h4>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              {team.shortName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {team.matchesToday && team.matchesToday > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-futebol-50 dark:bg-futebol-950/60 text-futebol-600 text-[10px] font-bold">
              Jogo hoje
            </span>
          )}

          {showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                favorite ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30" : "text-muted-foreground hover:text-amber-500 hover:bg-muted"
              )}
              aria-label={favorite ? "Remover dos favoritos" : "Favoritar time"}
            >
              <Star className={cn("w-3.5 h-3.5", favorite && "fill-amber-400")} />
            </button>
          )}

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-futebol-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/times/${team.id}`}
      className="block relative overflow-hidden rounded-2xl border border-border bg-card p-4 hover:border-futebol-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Team accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-futebol-600 to-transparent opacity-75"
        style={{
          background: team.primaryColor
            ? `linear-gradient(to right, ${team.primaryColor}, transparent)`
            : undefined,
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <TeamLogo
            src={team.logo}
            alt={team.name}
            name={team.name}
            color={team.primaryColor}
            size={42}
          />

          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground truncate group-hover:text-futebol-600 transition-colors leading-tight">
              {team.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-semibold uppercase">
                {team.shortName}
              </span>

              {team.liveMatches && team.liveMatches > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Jogando agora
                </span>
              ) : team.matchesToday && team.matchesToday > 0 ? (
                <span className="text-[10px] text-futebol-600 font-semibold">
                  • Joga hoje
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showFavoriteButton && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "p-2 rounded-xl transition-colors border",
                favorite
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-500"
                  : "border-border text-muted-foreground hover:text-amber-500 hover:bg-muted"
              )}
              title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star className={cn("w-4 h-4", favorite && "fill-amber-400")} />
            </button>
          )}

          <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-futebol-50 dark:group-hover:bg-futebol-950 group-hover:text-futebol-600 transition-colors">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  )
}
