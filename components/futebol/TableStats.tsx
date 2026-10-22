"use client"

import { Goal, Shield, Sparkles, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Standing } from "@/types"
import { TeamLogo } from "@/components/futebol/TeamLogo"

interface TableStatsProps {
  standings: Standing[]
}

/** Resumo da tabela: líder, melhor ataque, melhor defesa e média de gols. */
export function TableStats({ standings }: TableStatsProps) {
  // Em pré-temporada/rodada 1 todas as linhas podem ter `played = 0`. Sem
  // filtrar, "melhor defesa" elegeria um clube arbitrário (0 gols sofridos)
  // e a média viraria divisão por zero.
  const active = standings.filter((row) => row.played > 0)
  if (active.length === 0) return null

  const leader = active.reduce((best, row) =>
    row.points > best.points ? row : best
  )
  const bestAttack = active.reduce((best, row) =>
    row.goalsFor > best.goalsFor ? row : best
  )
  const bestDefense = active.reduce((best, row) =>
    row.goalsAgainst < best.goalsAgainst ? row : best
  )

  const totalGoals = active.reduce((sum, row) => sum + row.goalsFor, 0)
  const totalMatches = active.reduce((sum, row) => sum + row.played, 0) / 2
  const goalsPerMatch =
    totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2).replace(".", ",") : "—"

  return (
    <section
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label="Resumo da classificação"
    >
      <StatCard
        icon={<Trophy className="h-3.5 w-3.5" />}
        label="Líder"
        value={leader.team.name}
        detail={`${leader.points} pts`}
        logo={leader.team.logo}
        accent="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        icon={<Goal className="h-3.5 w-3.5" />}
        label="Melhor ataque"
        value={bestAttack.team.name}
        detail={`${bestAttack.goalsFor} gols`}
        logo={bestAttack.team.logo}
        accent="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        icon={<Shield className="h-3.5 w-3.5" />}
        label="Melhor defesa"
        value={bestDefense.team.name}
        detail={`${bestDefense.goalsAgainst} gols contra`}
        logo={bestDefense.team.logo}
        accent="text-sky-600 dark:text-sky-400"
      />
      <StatCard
        icon={<Sparkles className="h-3.5 w-3.5" />}
        label="Média de gols"
        value={`${goalsPerMatch} por jogo`}
        detail={`${Math.round(totalGoals)} gols na competição`}
        accent="text-futebol-600 dark:text-futebol-400"
      />
    </section>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
  logo,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  logo?: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <p className={cn("flex items-center gap-1 text-[10px] font-semibold", accent)}>
        {icon}
        {label}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        {logo && <TeamLogo src={logo} name={value} size={20} />}
        <span className="min-w-0 truncate text-xs font-bold">{value}</span>
      </div>
      <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">{detail}</p>
    </div>
  )
}
