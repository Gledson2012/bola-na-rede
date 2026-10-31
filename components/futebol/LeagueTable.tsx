"use client"

import Link from "next/link"
import { cn, formatOdd } from "@/lib/utils"
import type { Standing } from "@/types"
import { Star, ChevronRight } from "lucide-react"
import { useFavorites } from "@/lib/queries"
import {
  getCompetitionMeta,
  getZoneForPosition,
  ZONE_STYLES,
  type ZoneColor,
} from "@/lib/competitions"
import { TeamLogo } from "@/components/futebol/TeamLogo"

interface LeagueTableProps {
  standings: Standing[]
  competitionId?: string
  filterText?: string
}

const NEUTRAL_ZONE = {
  badge: "bg-muted text-muted-foreground",
  border: "border-l-transparent",
  dot: "bg-muted-foreground/50",
  text: "text-muted-foreground",
}

function FormDots({ form }: { form: Standing["form"] }) {
  if (!form || form.length === 0) {
    return <span className="text-[10px] text-muted-foreground">—</span>
  }

  return (
    <span className="flex items-center gap-0.5" aria-label={`Forma: ${form.join(" ")}`}>
      {form.map((result, index) => (
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

export function LeagueTable({
  standings,
  competitionId = "",
  filterText = "",
}: LeagueTableProps) {
  const { isFavorite } = useFavorites()

  const query = filterText.trim().toLocaleLowerCase("pt-BR")
  const filtered = query
    ? standings.filter((row) =>
        [row.team.name, row.team.shortName]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(query)
      )
    : standings

  const competitionMeta = getCompetitionMeta(competitionId)
  const zones = competitionMeta.zones

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <caption className="sr-only">
            Classificação — {competitionMeta.name}
          </caption>
          <thead className="border-b border-border bg-muted/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="w-9 py-3 pl-3 pr-1 text-center">Pos</th>
              <th scope="col" className="px-2 py-3 font-bold text-foreground">Clube</th>
              <th scope="col" className="w-9 px-1 py-3 text-center font-bold text-foreground">Pts</th>
              <th scope="col" className="w-7 px-1 py-3 text-center">J</th>
              <th scope="col" className="w-8 px-1 py-3 text-center">SG</th>
              <th scope="col" className="hidden w-14 px-1 py-3 text-center sm:table-cell">Forma</th>
              <th scope="col" className="hidden w-8 px-1 py-3 text-center lg:table-cell">PP</th>
              <th scope="col" className="hidden w-8 px-1 py-3 text-center md:table-cell">V</th>
              <th scope="col" className="hidden w-8 px-1 py-3 text-center md:table-cell">E</th>
              <th scope="col" className="hidden w-8 px-1 py-3 text-center md:table-cell">D</th>
              <th scope="col" className="hidden w-8 px-1 py-3 text-center lg:table-cell">GP</th>
              <th scope="col" className="hidden w-8 px-1 py-3 text-center lg:table-cell">GC</th>
              <th scope="col" className="w-6 py-3 pr-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((row, index) => {
              const position = row.position || index + 1
              const favorite = isFavorite(row.team.id)
              const zone = getZoneForPosition(zones, position)
              const style = zone ? ZONE_STYLES[zone.color as ZoneColor] : NEUTRAL_ZONE
              const pointsPerGame =
                row.played > 0 ? formatOdd(row.points / row.played) : "—"

              return (
                <tr
                  key={row.team.id}
                  className={cn(
                    "group border-l-4 transition-colors hover:bg-muted/50",
                    style.border,
                    favorite && "bg-amber-400/[0.06]"
                  )}
                >
                  {/* Posição */}
                  <td className="py-2.5 pl-3 pr-1 text-center">
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                        style.badge
                      )}
                      title={zone ? zone.label : undefined}
                    >
                      {position}
                    </span>
                  </td>

                  {/* Clube */}
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/times/${row.team.id}`}
                      className="flex items-center gap-2 transition-colors group-hover:text-primary"
                    >
                      <TeamLogo src={row.team.logo} name={row.team.name} size={22} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1">
                          <span className="truncate font-semibold">{row.team.name}</span>
                          {favorite && (
                            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" />
                          )}
                        </span>
                        {zone && (
                          <span
                            className={cn(
                              "block truncate text-[9px] font-medium leading-tight",
                              style.text
                            )}
                          >
                            {zone.label}
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>

                  {/* Pontos */}
                  <td className="px-1 py-2.5 text-center text-sm font-black tabular-nums text-foreground">
                    {row.points}
                  </td>

                  {/* Jogos */}
                  <td className="px-1 py-2.5 text-center font-medium tabular-nums text-muted-foreground">
                    {row.played}
                  </td>

                  {/* Saldo de gols */}
                  <td className="px-1 py-2.5 text-center font-bold tabular-nums">
                    <span
                      className={cn(
                        row.goalDifference > 0
                          ? "text-success"
                          : row.goalDifference < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      )}
                    >
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </span>
                  </td>

                  {/* Forma recente */}
                  <td className="hidden px-1 py-2.5 text-center sm:table-cell">
                    <span className="inline-flex justify-center">
                      <FormDots form={row.form} />
                    </span>
                  </td>

                  {/* Pontos por jogo */}
                  <td className="hidden px-1 py-2.5 text-center tabular-nums text-muted-foreground lg:table-cell">
                    {pointsPerGame}
                  </td>

                  {/* Vitórias / Empates / Derrotas */}
                  <td className="hidden px-1 py-2.5 text-center tabular-nums text-muted-foreground md:table-cell">
                    {row.won}
                  </td>
                  <td className="hidden px-1 py-2.5 text-center tabular-nums text-muted-foreground md:table-cell">
                    {row.drawn}
                  </td>
                  <td className="hidden px-1 py-2.5 text-center tabular-nums text-muted-foreground md:table-cell">
                    {row.lost}
                  </td>

                  {/* Gols pró / contra */}
                  <td className="hidden px-1 py-2.5 text-center tabular-nums text-muted-foreground lg:table-cell">
                    {row.goalsFor}
                  </td>
                  <td className="hidden px-1 py-2.5 text-center tabular-nums text-muted-foreground lg:table-cell">
                    {row.goalsAgainst}
                  </td>

                  {/* Ação */}
                  <td className="py-2.5 pr-3 text-right">
                    <Link
                      href={`/times/${row.team.id}`}
                      className="text-muted-foreground hover:text-primary"
                      aria-label={`Abrir perfil de ${row.team.name}`}
                    >
                      <ChevronRight className="inline h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="border-t border-border p-6 text-center text-xs text-muted-foreground">
          Nenhum clube encontrado para “{filterText}”.
        </p>
      )}

      {/* Legenda das faixas */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
        {zones && zones.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {zones.map((zone) => (
              <div key={`${zone.from}-${zone.to}`} className="flex items-center gap-1.5">
                <span
                  className={cn("h-2.5 w-2.5 rounded-full", ZONE_STYLES[zone.color].dot)}
                />
                <span>
                  {zone.from === zone.to
                    ? `${zone.from}º`
                    : `${zone.from}º–${zone.to}º`}{" "}
                  {zone.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p>
            {competitionMeta.format === "tournament"
              ? "Formato de copa: a classificação reflete a fase atual."
              : "Classificação geral, sem faixas de classificação continental definidas."}
          </p>
        )}

        <span className="text-[10px]">Toque no clube para abrir o perfil.</span>
      </div>
    </div>
  )
}
