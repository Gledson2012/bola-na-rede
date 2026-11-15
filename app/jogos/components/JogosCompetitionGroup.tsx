import { memo } from "react"
import { Star, ChevronDown, ChevronUp } from "lucide-react"
import { MatchCard } from "@/components/futebol/MatchCard"
import { cn } from "@/lib/utils"
import type { CompetitionGroup } from "../hooks/use-jogos-filter"

interface JogosCompetitionGroupProps {
  group: CompetitionGroup
  isCollapsed: boolean
  isPinned: boolean
  onToggleCollapse: (leagueName: string) => void
  onTogglePinLeague: (leagueName: string) => void
}

export const JogosCompetitionGroup = memo(function JogosCompetitionGroup({
  group,
  isCollapsed,
  isPinned,
  onToggleCollapse,
  onTogglePinLeague,
}: JogosCompetitionGroupProps) {
  return (
    <section className="cv-auto space-y-2">
      <div className="flex w-full items-center gap-2 px-0.5 py-1">
        <button
          onClick={() => onToggleCollapse(group.name)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={!isCollapsed}
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-sm">
            {group.flag}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 truncate text-[11px] font-black leading-tight text-foreground">
              {group.name}
              {isPinned && <Star className="h-3 w-3 flex-shrink-0 fill-warning text-warning" />}
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.region} · {group.matches.length}{" "}
              {group.matches.length === 1 ? "jogo" : "jogos"}
            </span>
          </span>
        </button>
        <button
          onClick={() => onTogglePinLeague(group.name)}
          className={cn(
            "press flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border transition-colors",
            isPinned
              ? "border-warning/50 bg-warning/10 text-warning"
              : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
          )}
          title={isPinned ? "Desafixar liga" : "Fixar liga no topo"}
          aria-label={`Fixar liga ${group.name}`}
        >
          <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
        </button>
        <button
          onClick={() => onToggleCollapse(group.name)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={isCollapsed ? "Expandir liga" : "Recolher liga"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-2">
          {group.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </section>
  )
})
