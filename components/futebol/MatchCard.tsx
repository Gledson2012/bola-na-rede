"use client"

import Link from "next/link"
import { cn, formatTime } from "@/lib/utils"
import { useToast } from "@/lib/use-toast"
import type { Match } from "@/types"
import { ChevronRight, Clock, Star, Bell, MapPin, Check } from "lucide-react"
import { useFavoritesStore, useIsPinnedMatch, useHasReminder } from "@/lib/store"
import { TeamLogo } from "@/components/futebol/TeamLogo"

interface MatchCardProps {
  match: Match
  compact?: boolean
  showCompetition?: boolean
}

export function MatchCard({ match, compact = false, showCompetition = false }: MatchCardProps) {
  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"
  const hasScore = match.homeScore !== null && match.awayScore !== null

  // Seletores finos: o card só re-renderiza quando o *seu* estado muda,
  // e não a cada favoritar/desfavoritar de qualquer time.
  const togglePinnedMatch = useFavoritesStore((state) => state.togglePinnedMatch)
  const toggleReminder = useFavoritesStore((state) => state.toggleReminder)
  const isPinned = useIsPinnedMatch(match.id)
  const isReminded = useHasReminder(match.id)
  const isTeamFavorite = useFavoritesStore(
    (state) =>
      (state.favorites || []).includes(match.homeTeam.id) ||
      (state.favorites || []).includes(match.awayTeam.id)
  )
  const { message: toastMessage, show: showFeedback } = useToast()

  const matchTime = match.kickoff || (match.date ? formatTime(match.date) : "A definir")

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    togglePinnedMatch(match.id)
    showFeedback(isPinned ? "Partida desafixada" : "Partida fixada no topo ⭐")
  }

  const handleReminder = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleReminder(match.id)
    showFeedback(isReminded ? "Lembrete cancelado" : "Lembrete definido para o jogo 🔔")
  }

  const homeWinning = hasScore && (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const awayWinning = hasScore && (match.awayScore ?? 0) > (match.homeScore ?? 0)

  // Compact Mode (FlashScore / SofaScore style list row)
  if (compact) {
    return (
      <div className="relative group">
        <Link
          href={`/jogos/${match.id}`}
          className={cn(
            "flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all duration-150 bg-card hover:bg-muted/40",
            isLive
              ? "border-red-500/40 bg-red-500/5 shadow-sm"
              : isPinned
              ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
              : "border-border hover:border-futebol-300 dark:hover:border-futebol-700"
          )}
        >
          {/* Status / Time Column */}
          <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center text-center">
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {match.minute ? `${match.minute}'` : "AO VIVO"}
              </span>
            ) : isFinished ? (
              <span className="text-[11px] font-medium text-muted-foreground uppercase">Fim</span>
            ) : (
              <span className="text-xs font-bold text-foreground tracking-tight">{matchTime}</span>
            )}
            {showCompetition && match.competition && (
              <span className="text-[9px] text-muted-foreground truncate max-w-[60px]">
                {match.competition}
              </span>
            )}
          </div>

          {/* Teams Column */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo src={match.homeTeam.logo} name={match.homeTeam.name} size={18} />
                <span className={cn(
                  "text-xs truncate",
                  homeWinning ? "font-bold text-foreground" : "font-normal text-foreground/90"
                )}>
                  {match.homeTeam.name}
                </span>
              </div>
              <span className={cn(
                "text-xs font-bold px-1 tabular-nums",
                isLive && "text-red-600 dark:text-red-400",
                homeWinning ? "text-foreground" : "text-muted-foreground"
              )}>
                {hasScore ? match.homeScore : "-"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo src={match.awayTeam.logo} name={match.awayTeam.name} size={18} />
                <span className={cn(
                  "text-xs truncate",
                  awayWinning ? "font-bold text-foreground" : "font-normal text-foreground/90"
                )}>
                  {match.awayTeam.name}
                </span>
              </div>
              <span className={cn(
                "text-xs font-bold px-1 tabular-nums",
                isLive && "text-red-600 dark:text-red-400",
                awayWinning ? "text-foreground" : "text-muted-foreground"
              )}>
                {hasScore ? match.awayScore : "-"}
              </span>
            </div>
          </div>

          {/* Pin Button */}
          <button
            onClick={handlePin}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-muted transition-colors flex-shrink-0"
            aria-label={isPinned ? "Desafixar jogo" : "Fixar jogo"}
          >
            <Star className={cn("w-3.5 h-3.5", isPinned && "fill-amber-400 text-amber-500")} />
          </button>
        </Link>
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-1 left-1/2 -translate-x-1/2 z-30 px-2.5 py-0.5 bg-foreground text-background text-[10px] font-semibold rounded-full shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
          >
            {toastMessage}
          </div>
        )}
      </div>
    )
  }

  // Standard Card Mode
  return (
    <div className="relative group">
      <Link
        href={`/jogos/${match.id}`}
        className={cn(
          "block relative overflow-hidden rounded-2xl border transition-all duration-200 bg-card p-4",
          isLive
            ? "border-red-500/50 bg-gradient-to-b from-red-500/[0.04] to-card shadow-md shadow-red-500/5 ring-1 ring-red-500/30"
            : isPinned
            ? "border-amber-400/50 bg-gradient-to-b from-amber-400/[0.04] to-card shadow-md shadow-amber-400/5 ring-1 ring-amber-400/30"
            : "border-border hover:shadow-lg hover:border-futebol-400/50 hover:-translate-y-0.5"
        )}
      >
        {/* Top bar inside card: Competition or Live Tag + Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                AO VIVO {match.minute ? `• ${match.minute}'` : ""}
              </span>
            ) : isFinished ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <Check className="w-3 h-3 text-emerald-600" />
                Encerrado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-futebol-50 dark:bg-futebol-950/60 text-futebol-700 dark:text-futebol-300 text-[10px] font-bold uppercase tracking-wider border border-futebol-200/50">
                <Clock className="w-3 h-3" />
                Agendado • {matchTime}
              </span>
            )}

            {match.competition && (
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {match.competition}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isUpcoming && (
              <button
                onClick={handleReminder}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isReminded
                    ? "text-futebol-600 bg-futebol-50 dark:bg-futebol-950/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={isReminded ? "Lembrete ativo" : "Definir lembrete"}
                aria-label="Definir lembrete de partida"
              >
                <Bell className={cn("w-3.5 h-3.5", isReminded && "fill-futebol-600")} />
              </button>
            )}

            <button
              onClick={handlePin}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isPinned || isTeamFavorite
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                  : "text-muted-foreground hover:text-amber-500 hover:bg-muted"
              )}
              title={isPinned ? "Partida fixada" : "Fixar partida"}
              aria-label="Fixar partida"
            >
              <Star className={cn("w-3.5 h-3.5", (isPinned || isTeamFavorite) && "fill-amber-400")} />
            </button>
          </div>
        </div>

        {/* Center Scoreboard Grid */}
        <div className="grid grid-cols-7 items-center gap-2 my-2">
          {/* Home Team (3 cols) */}
          <div className="col-span-3 flex items-center justify-end gap-2.5 min-w-0 text-right">
            <div className="min-w-0">
              <p className={cn(
                "text-xs sm:text-sm font-semibold truncate leading-tight",
                homeWinning ? "text-foreground font-bold" : "text-foreground/90"
              )}>
                {match.homeTeam.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {match.homeTeam.shortName}
              </p>
            </div>
            <TeamLogo
              src={match.homeTeam.logo}
              name={match.homeTeam.name}
              size={36}
            />
          </div>

          {/* Center Column: Score or Kickoff Time (1 col) */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            {hasScore ? (
              <div className="flex items-center justify-center gap-1.5">
                <span className={cn(
                  "text-lg sm:text-xl font-black tabular-nums tracking-tight",
                  isLive ? "text-red-600 dark:text-red-400 scale-105" : "text-foreground"
                )}>
                  {match.homeScore}
                </span>
                <span className="text-muted-foreground font-light text-xs">:</span>
                <span className={cn(
                  "text-lg sm:text-xl font-black tabular-nums tracking-tight",
                  isLive ? "text-red-600 dark:text-red-400 scale-105" : "text-foreground"
                )}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-sm sm:text-base font-extrabold text-foreground tracking-tight px-2 py-0.5 rounded-lg bg-muted/60">
                  {matchTime}
                </span>
              </div>
            )}
          </div>

          {/* Away Team (3 cols) */}
          <div className="col-span-3 flex items-center justify-start gap-2.5 min-w-0 text-left">
            <TeamLogo
              src={match.awayTeam.logo}
              name={match.awayTeam.name}
              size={36}
            />
            <div className="min-w-0">
              <p className={cn(
                "text-xs sm:text-sm font-semibold truncate leading-tight",
                awayWinning ? "text-foreground font-bold" : "text-foreground/90"
              )}>
                {match.awayTeam.name}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {match.awayTeam.shortName}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info: Stadium / Venue and View Details Link */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 truncate max-w-[70%]">
            <MapPin className="w-3 h-3 flex-shrink-0 text-muted-foreground/70" />
            <span className="truncate">
              {match.venue && match.venue !== "Local a confirmar"
                ? match.venue
                : match.competitionCountry || "Futebol Internacional"}
            </span>
          </div>

          <div className="flex items-center gap-0.5 text-futebol-600 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Detalhes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </Link>

      {/* Floating feedback toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-foreground text-background text-xs font-semibold rounded-full shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}
