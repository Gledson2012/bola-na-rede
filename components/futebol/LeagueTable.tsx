"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Standing } from "@/types"
import { Star, Trophy, ChevronRight } from "lucide-react"
import { useFavorites } from "@/lib/queries"
import { getCompetitionMeta } from "@/lib/competitions"

interface LeagueTableProps {
  standings: Standing[]
  competitionId?: string
  filterText?: string
}

function TableTeamLogo({ src, alt, name, size = 22 }: { src?: string; alt: string; name: string; size?: number }) {
  const [error, setError] = useState(false)
  const initial = name ? name.trim().charAt(0).toUpperCase() : "⚽"

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-gradient-to-br from-futebol-600 to-futebol-800 text-white font-bold flex items-center justify-center text-[10px] shadow-xs flex-shrink-0"
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
        className="rounded-full object-cover border border-border/80 bg-white shadow-xs"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

export function LeagueTable({ standings, competitionId = "", filterText = "" }: LeagueTableProps) {
  const { isFavorite } = useFavorites()

  // Filter teams if user is searching
  const filtered = filterText.trim()
    ? standings.filter((s) =>
        s.team.name.toLowerCase().includes(filterText.toLowerCase()) ||
        s.team.shortName.toLowerCase().includes(filterText.toLowerCase())
      )
    : standings

  const totalTeams = standings.length
  const competitionMeta = getCompetitionMeta(competitionId)
  const isChampionsFormat = competitionId.includes("champions")
  const isTournament = competitionMeta.format === "tournament"

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
            <tr>
              <th className="py-3 pl-3 pr-2 w-10 text-center">Pos</th>
              <th className="py-3 px-2 font-bold text-foreground">Clube</th>
              <th className="py-3 px-2 text-center font-bold text-foreground w-8">Pts</th>
              <th className="py-3 px-2 text-center w-8">J</th>
              <th className="py-3 px-2 text-center w-8">V</th>
              <th className="py-3 px-2 text-center w-8">E</th>
              <th className="py-3 px-2 text-center w-8">D</th>
              <th className="py-3 px-2 text-center w-10">SG</th>
              <th className="py-3 px-2 text-center w-8 hidden sm:table-cell">GP</th>
              <th className="py-3 px-2 text-center w-8 hidden sm:table-cell">GC</th>
              <th className="py-3 pr-3 text-right w-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((s, index) => {
              const pos = s.position || index + 1
              const favorite = isFavorite(s.team.id)

              // Zone logic
              let zoneBorder = "border-l-transparent"
              let zoneBadgeClass = "bg-muted text-muted-foreground"

              if (isChampionsFormat) {
                if (pos <= 8) {
                  zoneBorder = "border-l-emerald-500 bg-emerald-500/[0.04]"
                  zoneBadgeClass = "bg-emerald-600 text-white font-bold"
                } else if (pos <= 24) {
                  zoneBorder = "border-l-amber-500 bg-amber-500/[0.03]"
                  zoneBadgeClass = "bg-amber-500 text-white font-bold"
                } else {
                  zoneBorder = "border-l-red-500/50"
                  zoneBadgeClass = "bg-muted text-muted-foreground"
                }
              } else if (isTournament) {
                // Formats vary (groups, knockouts): do not invent zone meanings
                zoneBorder = "border-l-futebol-500/40"
                zoneBadgeClass = "bg-futebol-600 text-white font-bold"
              } else {
                if (pos <= 4) {
                  zoneBorder = "border-l-emerald-500 bg-emerald-500/[0.04]"
                  zoneBadgeClass = "bg-emerald-600 text-white font-bold"
                } else if (pos <= 6) {
                  zoneBorder = "border-l-futebol-500 bg-futebol-500/[0.03]"
                  zoneBadgeClass = "bg-futebol-600 text-white font-bold"
                } else if (pos >= totalTeams - 2 && totalTeams > 6) {
                  zoneBorder = "border-l-red-500 bg-red-500/[0.04]"
                  zoneBadgeClass = "bg-red-600 text-white font-bold"
                }
              }

              return (
                <tr
                  key={s.team.id}
                  className={cn(
                    "border-l-4 transition-colors hover:bg-muted/50 group",
                    zoneBorder,
                    favorite && "bg-amber-400/[0.06]"
                  )}
                >
                  {/* Position */}
                  <td className="py-2.5 pl-3 pr-2 text-center">
                    <span className={cn("w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]", zoneBadgeClass)}>
                      {pos}
                    </span>
                  </td>

                  {/* Team */}
                  <td className="py-2.5 px-2">
                    <Link
                      href={`/times/${s.team.id}`}
                      className="flex items-center gap-2 group-hover:text-futebol-600 transition-colors"
                    >
                      <TableTeamLogo src={s.team.logo} alt={s.team.name} name={s.team.name} size={22} />
                      <span className="font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                        {s.team.name}
                      </span>
                      {favorite && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
                      )}
                    </Link>
                  </td>

                  {/* Points */}
                  <td className="py-2.5 px-2 text-center font-black text-sm text-foreground tabular-nums">
                    {s.points}
                  </td>

                  {/* Played, Won, Drawn, Lost */}
                  <td className="py-2.5 px-2 text-center text-muted-foreground tabular-nums font-medium">
                    {s.played}
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground tabular-nums">
                    {s.won}
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground tabular-nums">
                    {s.drawn}
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground tabular-nums">
                    {s.lost}
                  </td>

                  {/* Goal Difference */}
                  <td className="py-2.5 px-2 text-center font-bold tabular-nums">
                    <span className={cn(
                      s.goalDifference > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : s.goalDifference < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    )}>
                      {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                    </span>
                  </td>

                  {/* Goals For & Against (Desktop) */}
                  <td className="py-2.5 px-2 text-center text-muted-foreground tabular-nums hidden sm:table-cell">
                    {s.goalsFor}
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground tabular-nums hidden sm:table-cell">
                    {s.goalsAgainst}
                  </td>

                  {/* Action arrow */}
                  <td className="py-2.5 pr-3 text-right">
                    <Link
                      href={`/times/${s.team.id}`}
                      className="text-muted-foreground hover:text-futebol-600"
                    >
                      <ChevronRight className="w-3.5 h-3.5 inline group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {isChampionsFormat ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>1-8: Oitavas Diretas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>9-24: Play-offs</span>
              </div>
            </>
          ) : isTournament ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-futebol-600" />
              <span>Formato de copa: a classificação reflete a fase atual</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Fase Principal / Libertadores</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-futebol-600" />
                <span>Sul-Americana / Playoff</span>
              </div>
              {totalTeams > 6 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>Rebaixamento</span>
                </div>
              )}
            </>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground">
          Toque no clube para abrir o perfil completo.
        </span>
      </div>
    </div>
  )
}
