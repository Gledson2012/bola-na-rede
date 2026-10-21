"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { MatchDetailSkeleton } from "@/components/Skeleton"
import { useMatch, useCompetitionTable, useFavorites } from "@/lib/queries"
import {
  ArrowLeft, Clock, Trophy, MapPin, Share2, Star, Bell,
  ShieldAlert, CheckCircle2, Info
} from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import type { MatchEvent } from "@/types"

interface MatchDetailPageProps {
  params: { id: string }
}

function DetailTeamLogo({ src, alt, name, size = 64 }: { src?: string; alt: string; name: string; size?: number }) {
  const [error, setError] = useState(false)
  const initial = name ? name.trim().charAt(0).toUpperCase() : "⚽"

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-gradient-to-br from-futebol-600 to-futebol-800 text-white font-black flex items-center justify-center text-xl shadow-md border-2 border-background"
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
        className="rounded-full object-cover border-2 border-background shadow-md bg-white"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

export default function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = params
  const { data: match, isLoading, error, refetch } = useMatch(id)
  const { data: tableData = [] } = useCompetitionTable(match?.competitionId)
  const { isPinnedMatch, togglePinnedMatch, hasReminder, toggleReminder, isFavorite } = useFavorites()

  const [activeTab, setActiveTab] = useState<"lances" | "tabela">("lances")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleShare = async () => {
    const title = match ? `${match.homeTeam.name} x ${match.awayTeam.name}` : "Partida"
    const text = match
      ? `Acompanhe ${match.homeTeam.name} vs ${match.awayTeam.name} no Bola na Rede!`
      : "Acompanhe no Bola na Rede!"
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // Ignored if cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast("Link da partida copiado! 📋")
    }
  }

  if (isLoading) {
    return (
      <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar partida" onRetry={() => refetch()} />}>
        <div className="flex-1 space-y-4 py-3">
          <MatchDetailSkeleton />
        </div>
      </ErrorBoundary>
    )
  }

  if (error || !match) {
    return (
      <ErrorBoundary fallback={<ErrorFallback message={error?.message || "Partida não encontrada"} onRetry={() => refetch()} />}>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">Partida não encontrada</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Não foi possível carregar os detalhes desta partida ou o jogo foi removido do calendário.
          </p>
          <Link
            href="/jogos"
            className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors"
          >
            ← Voltar para Lista de Jogos
          </Link>
        </div>
      </ErrorBoundary>
    )
  }

  const isLive = match.status === "live"
  const isFinished = match.status === "finished"
  const isUpcoming = match.status === "upcoming"
  const hasScore = match.homeScore !== null && match.awayScore !== null
  const events: MatchEvent[] = match.events || []

  const isPinned = isPinnedMatch(match.id)
  const isReminded = hasReminder(match.id)
  const matchTime = match.kickoff || (match.date ? formatTime(match.date) : "A definir")

  return (
    <ErrorBoundary fallback={<ErrorFallback message="Erro ao renderizar detalhes da partida" onRetry={() => refetch()} />}>
      <div className="flex flex-col h-full space-y-4 pb-16">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <Link
            href="/jogos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Jogos</span>
          </Link>

          <div className="flex items-center gap-1">
            {isUpcoming && (
              <button
                onClick={() => {
                  toggleReminder(match.id)
                  showToast(isReminded ? "Lembrete cancelado" : "Lembrete definido! 🔔")
                }}
                className={cn(
                  "p-2 rounded-xl transition-colors border",
                  isReminded
                    ? "bg-futebol-50 dark:bg-futebol-950/60 border-futebol-300 text-futebol-600"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                title={isReminded ? "Lembrete ativo" : "Definir lembrete"}
              >
                <Bell className={cn("w-4 h-4", isReminded && "fill-futebol-600")} />
              </button>
            )}

            <button
              onClick={() => {
                togglePinnedMatch(match.id)
                showToast(isPinned ? "Partida desafixada" : "Partida fixada! ⭐")
              }}
              className={cn(
                "p-2 rounded-xl transition-colors border",
                isPinned
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-500"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
              title={isPinned ? "Partida fixada" : "Fixar partida"}
            >
              <Star className={cn("w-4 h-4", isPinned && "fill-amber-400")} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Compartilhar partida"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Scoreboard Stadium Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-futebol-950 via-futebol-900 to-slate-900 text-white p-5 shadow-xl border border-futebol-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-futebol-500/20 via-transparent to-transparent opacity-50 pointer-events-none" />

          {/* Header Tag */}
          <div className="relative z-10 flex items-center justify-between gap-2 text-xs text-white/80 pb-3 border-b border-white/10">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 font-bold uppercase tracking-wider text-[11px]">
              <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-futebol-400" />
              <span className="truncate">
                {match.competition}
                {match.competitionCountry ? ` • ${match.competitionCountry}` : ""}
              </span>
            </div>

            {isLive ? (
              <span className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                AO VIVO {match.minute ? `• ${match.minute}'` : ""}
              </span>
            ) : isFinished ? (
              <span className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Finalizado
              </span>
            ) : (
              <span className="flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-futebol-500/20 text-futebol-300 text-[10px] font-bold uppercase tracking-wider border border-futebol-500/30">
                <Clock className="w-3 h-3" />
                Agendado
              </span>
            )}
          </div>

          {/* Scoreboard Teams Grid */}
          <div className="relative z-10 grid grid-cols-7 items-center gap-3 py-6">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center text-center">
              <DetailTeamLogo
                src={match.homeTeam.logo}
                alt={match.homeTeam.name}
                name={match.homeTeam.name}
                size={58}
              />
              <h2 className="text-sm sm:text-base font-extrabold mt-2 leading-tight text-white">
                {match.homeTeam.name}
              </h2>
              <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mt-0.5">
                {match.homeTeam.shortName}
              </span>
            </div>

            {/* Center Score / Time */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {hasScore ? (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-3xl sm:text-4xl font-black tabular-nums tracking-tight",
                    isLive ? "text-red-400" : "text-white"
                  )}>
                    {match.homeScore}
                  </span>
                  <span className="text-white/40 text-lg font-light">-</span>
                  <span className={cn(
                    "text-3xl sm:text-4xl font-black tabular-nums tracking-tight",
                    isLive ? "text-red-400" : "text-white"
                  )}>
                    {match.awayScore}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white px-2.5 py-1 rounded-xl bg-white/10 border border-white/15">
                    {matchTime}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-white/60 mt-1 font-semibold">
                    Início
                  </span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center text-center">
              <DetailTeamLogo
                src={match.awayTeam.logo}
                alt={match.awayTeam.name}
                name={match.awayTeam.name}
                size={58}
              />
              <h2 className="text-sm sm:text-base font-extrabold mt-2 leading-tight text-white">
                {match.awayTeam.name}
              </h2>
              <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider mt-0.5">
                {match.awayTeam.shortName}
              </span>
            </div>
          </div>

          {/* Footer Venue & Local Time */}
          <div className="relative z-10 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-white/70 gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-futebol-400" />
              <span>
                {match.venue && match.venue !== "Local a confirmar"
                  ? match.venue
                  : "Local a confirmar"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-futebol-400" />
              <span>Horário previsto: {matchTime}</span>
            </div>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide border-b border-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("lances")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
              activeTab === "lances"
                ? "border-futebol-600 text-futebol-600 font-bold bg-futebol-50/50 dark:bg-futebol-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Lances</span>
            {events.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-bold">
                {events.length}
              </span>
            )}
          </button>

          {tableData.length > 0 && (
            <button
              onClick={() => setActiveTab("tabela")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
                activeTab === "tabela"
                  ? "border-futebol-600 text-futebol-600 font-bold bg-futebol-50/50 dark:bg-futebol-950/20"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Classificação</span>
            </button>
          )}
        </div>

        {/* Tab 1: Lances / Timeline */}
        {activeTab === "lances" && (
          <div className="space-y-3">
            {events.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timeline do Jogo</span>
                </h3>

                <div className="space-y-2">
                  {events.map((e) => {
                    const isGoal = e.type.toLowerCase().includes("goal")
                    const isCard = e.type.toLowerCase().includes("card") ||
                      e.type.toLowerCase().includes("yellow") ||
                      e.type.toLowerCase().includes("red")
                    const isSub = e.type.toLowerCase().includes("sub")

                    return (
                      <div
                        key={e.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl border transition-colors",
                          isGoal
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : isCard
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-muted/40 border-border/70"
                        )}
                      >
                        <span className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center text-xs font-bold tabular-nums flex-shrink-0 shadow-sm">
                          {e.minute ? `${e.minute}'` : "•"}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {isGoal ? "⚽" : isCard ? "🟨" : isSub ? "🔄" : "📌"}
                            </span>
                            <span className="text-xs font-bold capitalize text-foreground">
                              {e.type}
                            </span>
                            {e.player && (
                              <span className="text-xs font-medium text-muted-foreground truncate">
                                • {e.player}
                              </span>
                            )}
                          </div>
                          {e.detail && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {e.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Pre-match information card when no live events */
              <div className="space-y-3">
                <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-futebol-600/10 text-futebol-600 flex items-center justify-center">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Informações da Partida
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Ainda não há lances registrados para este jogo
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Competição
                      </span>
                      <span className="font-semibold text-foreground">
                        {match.competition}
                        {match.competitionCountry ? ` • ${match.competitionCountry}` : ""}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Local
                      </span>
                      <span className="font-semibold text-foreground">
                        {match.venue && match.venue !== "Local a confirmar"
                          ? match.venue
                          : "Não informado"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Horário previsto
                      </span>
                      <span className="font-semibold text-foreground">{matchTime}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Situação
                      </span>
                      <span className="font-semibold text-foreground">
                        {isLive ? "Em andamento" : isFinished ? "Encerrada" : "Agendada"}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Estatísticas, escalações e histórico de confrontos não são fornecidos pela fonte de dados atual.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tabela da Competição */}
        {activeTab === "tabela" && tableData.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-futebol-600" />
              <span>Tabela • {match.competition}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] text-muted-foreground uppercase">
                    <th className="py-2 pr-2">Pos</th>
                    <th className="py-2">Clube</th>
                    <th className="py-2 text-center">J</th>
                    <th className="py-2 text-center">V</th>
                    <th className="py-2 text-center">SG</th>
                    <th className="py-2 text-right font-bold text-foreground">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tableData.slice(0, 10).map((row) => {
                    const isHome = row.team.id === match.homeTeam.id
                    const isAway = row.team.id === match.awayTeam.id
                    const isHighlighted = isHome || isAway

                    return (
                      <tr
                        key={row.team.id}
                        className={cn(
                          "transition-colors",
                          isHighlighted ? "bg-futebol-50 dark:bg-futebol-950/40 font-bold" : "hover:bg-muted/40"
                        )}
                      >
                        <td className="py-2 pr-2 tabular-nums">
                          <span className={cn(
                            "w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]",
                            isHighlighted ? "bg-futebol-600 text-white" : "text-muted-foreground"
                          )}>
                            {row.position}
                          </span>
                        </td>
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-4 h-4 relative flex-shrink-0">
                            <Image
                              src={row.team.logo}
                              alt={row.team.name}
                              width={16}
                              height={16}
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          </div>
                          <span className="truncate max-w-[120px] sm:max-w-[180px]">
                            {row.team.name}
                          </span>
                        </td>
                        <td className="py-2 text-center tabular-nums text-muted-foreground">{row.played}</td>
                        <td className="py-2 text-center tabular-nums text-muted-foreground">{row.won}</td>
                        <td className="py-2 text-center tabular-nums text-muted-foreground">{row.goalDifference}</td>
                        <td className="py-2 text-right tabular-nums font-extrabold text-foreground">{row.points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Floating feedback toast */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
