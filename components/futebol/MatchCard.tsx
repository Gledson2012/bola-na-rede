"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import type { Match, Team } from "@/types"
import { useFavoritesStore, useIsPinnedMatch } from "@/lib/store"
import { TeamLogo } from "@/components/futebol/TeamLogo"
import { useToast } from "@/lib/use-toast"
import { Toast } from "@/components/ui/toast"

interface MatchCardProps {
  match: Match
  compact?: boolean
  showCompetition?: boolean
}

function TeamLine({
  team,
  score,
  hasScore,
  isWinner,
  isLoser,
  isLive,
}: {
  team: Team
  score: number | null
  hasScore: boolean
  isWinner: boolean
  isLoser: boolean
  isLive: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamLogo src={team.logo} name={team.name} size={18} />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[12.5px] leading-none",
          isLoser ? "font-medium text-muted-foreground" : "font-bold text-foreground",
          isWinner && "font-black"
        )}
      >
        {team.name}
      </span>
      {hasScore && (
        <span
          className={cn(
            "tabular w-5 text-right text-[13px] leading-none",
            isLive ? "font-black text-live" : isWinner ? "font-black text-foreground" : "font-bold text-muted-foreground"
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}

export function MatchCard({ match, compact = false, showCompetition = false }: MatchCardProps) {
  const togglePinnedMatch = useFavoritesStore((state) => state.togglePinnedMatch)
  const isPinned = useIsPinnedMatch(match.id)
  const isTeamFavorite = useFavoritesStore(
    (state) =>
      (state.favorites || []).includes(match.homeTeam.id) ||
      (state.favorites || []).includes(match.awayTeam.id)
  )
  const { message, show: showFeedback } = useToast()

  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const hasScore = match.homeScore !== null && match.awayScore !== null
  const pinned = isPinned || isTeamFavorite

  const matchTime = match.kickoff || (match.date ? formatTime(match.date) : "A definir")
  const homeWinning = hasScore && (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const awayWinning = hasScore && (match.awayScore ?? 0) > (match.homeScore ?? 0)

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    togglePinnedMatch(match.id)
    showFeedback(isPinned ? "Partida desafixada" : "Partida fixada ⭐")
  }

  return (
    <div
      className={cn(
        "group relative flex items-stretch overflow-hidden rounded-2xl border bg-card transition-all duration-150",
        isLive
          ? "border-live/25 bg-live/[0.025]"
          : "border-border/80 hover:border-primary/30 hover:shadow-sm"
      )}
    >
      {isLive && <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-live" />}

      <Link
        href={`/jogos/${match.id}`}
        aria-label={`${match.homeTeam.name} x ${match.awayTeam.name}`}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 pl-3 pr-1",
          compact ? "py-2" : "py-2.5"
        )}
      >
        {/* Horário / status */}
        <div className="flex w-10 flex-shrink-0 flex-col items-center justify-center gap-1 text-center">
          {isLive ? (
            <>
              <span className="live-dot h-1.5 w-1.5" />
              <span className="tabular text-[10px] font-black leading-none text-live">
                {match.minute ? `${match.minute}'` : "LIVE"}
              </span>
            </>
          ) : isFinished ? (
            <>
              <span className="text-[9px] font-black uppercase leading-none text-muted-foreground">
                Fim
              </span>
              {hasScore && (
                <span className="tabular text-[10px] font-bold leading-none text-muted-foreground">
                  {match.homeScore}-{match.awayScore}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="tabular text-[12px] font-black leading-none text-foreground">
                {matchTime}
              </span>
              <span className="text-[8px] font-bold uppercase leading-none text-muted-foreground">
                Hoje
              </span>
            </>
          )}
        </div>

        {/* Times e placar */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {showCompetition && (
            <p className="line-1 -mb-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              {match.competition}
            </p>
          )}
          <TeamLine
            team={match.homeTeam}
            score={match.homeScore}
            hasScore={hasScore}
            isWinner={homeWinning}
            isLoser={awayWinning}
            isLive={isLive}
          />
          <TeamLine
            team={match.awayTeam}
            score={match.awayScore}
            hasScore={hasScore}
            isWinner={awayWinning}
            isLoser={homeWinning}
            isLive={isLive}
          />
        </div>
      </Link>

      <div className="flex flex-shrink-0 items-center pr-1.5">
        <button
          type="button"
          onClick={handlePin}
          aria-label={pinned ? "Desafixar partida" : "Fixar partida"}
          aria-pressed={pinned}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            pinned
              ? "text-amber-500"
              : "text-muted-foreground/40 hover:bg-muted hover:text-foreground"
          )}
        >
          <Star className={cn("h-4 w-4", pinned && "fill-current")} />
        </button>
      </div>

      {message && <Toast>{message}</Toast>}
    </div>
  )
}
