"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { MatchDetailSkeleton } from "@/components/Skeleton"
import { Toast } from "@/components/ui/toast"
import { useMatch, useCompetitionTable, useFavorites } from "@/lib/queries"
import { useToast } from "@/lib/use-toast"
import { copyToClipboard } from "@/lib/utils"
import {
  ArrowLeft, Clock, Trophy, MapPin, Share2, Star, Bell,
  ShieldAlert, CheckCircle2, Info
} from "lucide-react"
import { cn, formatTime } from "@/lib/utils"
import {
  eventKind,
  localizeEventDetail,
  localizeEventType,
} from "@/lib/pt-br"
import type { MatchDetail, MatchEvent } from "@/types"

interface MatchDetailClientProps {
  id: string
  initialMatch: MatchDetail | null
}

function DetailTeamLogo({ src, alt, name, size = 64 }: { src?: string; alt: string; name: string; size?: number }) {
  const [error, setError] = useState(false)
  const initial = name ? name.trim().charAt(0).toUpperCase() : "⚽"

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl font-black text-white"
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
        className="rounded-full border border-white/15 bg-white object-cover shadow-md"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

export default function MatchDetailClient({
  id,
  initialMatch,
}: MatchDetailClientProps) {
  const { data: match, isLoading, error, refetch } = useMatch(
    id,
    initialMatch ?? undefined
  )
  const { data: tableData = [] } = useCompetitionTable(match?.competitionId)
  const { isPinnedMatch, togglePinnedMatch, hasReminder, toggleReminder } = useFavorites()

  const [selectedTab, setSelectedTab] = useState<"lances" | "tabela">("lances")
  const { message: toastMessage, show: showToast } = useToast()

  // Se a tabela esvaziar (refetch sem dados), a aba "Classificação" some do
  // seletor. Derivar a aba ativa evita um efeito de correção de estado.
  const activeTab: "lances" | "tabela" =
    selectedTab === "tabela" && tableData.length === 0 ? "lances" : selectedTab

  const handleShare = async () => {
    const title = match ? `${match.homeTeam.name} x ${match.awayTeam.name}` : "Partida"
    const text = match
      ? `Acompanhe ${match.homeTeam.name} x ${match.awayTeam.name} no Bola na Rede!`
      : "Acompanhe no Bola na Rede!"
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch (error) {
        // AbortError = usuário cancelou o menu nativo: silencioso é correto.
        if (error instanceof Error && error.name !== "AbortError") {
          showToast("Não foi possível compartilhar.")
        }
      }
      return
    }

    const copied = await copyToClipboard(url)
    showToast(copied ? "Link da partida copiado! 📋" : "Não foi possível copiar o link.")
  }

  if (isLoading) {
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar partida" onRetry={() => { reset(); refetch() }} />)}>
        <div className="flex-1 space-y-4 py-3">
          <MatchDetailSkeleton />
        </div>
      </ErrorBoundary>
    )
  }

  if (!match) {
    // A API upstream só mantém os detalhes das partidas do dia corrente:
    // partidas de dias anteriores respondem 404 mesmo existindo no histórico.
    const isArchived = error instanceof Error && error.message.includes("404")
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message={error?.message || "Partida não encontrada"} onRetry={() => { reset(); refetch() }} />)}>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">
            {isArchived ? "Detalhes indisponíveis" : "Partida não encontrada"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {isArchived
              ? "A fonte de dados mantém os lances apenas das partidas do dia. O resultado continua disponível nos filtros de jogos encerrados."
              : "Não foi possível carregar os detalhes desta partida ou o jogo foi removido do calendário."}
          </p>
          <Link
            href="/jogos"
            className="press mt-4 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors"
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
    <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao renderizar detalhes da partida" onRetry={() => { reset(); refetch() }} />)}>
      <div className="flex flex-col h-full space-y-4 pb-16">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2">
          <Link
            href="/jogos"
            className="press inline-flex h-8 items-center gap-1 rounded-full border border-border/80 bg-card pl-2 pr-3 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Jogos</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {isUpcoming && (
              <button
                onClick={() => {
                  toggleReminder(match.id)
                  showToast(isReminded ? "Lembrete cancelado" : "Lembrete definido! 🔔")
                }}
                className={cn(
                  "press flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                  isReminded
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
                )}
                title={isReminded ? "Lembrete ativo" : "Definir lembrete"}
                aria-label={isReminded ? "Remover lembrete da partida" : "Definir lembrete da partida"}
                aria-pressed={isReminded}
              >
                <Bell className={cn("h-3.5 w-3.5", isReminded && "fill-current")} />
              </button>
            )}

            <button
              onClick={() => {
                togglePinnedMatch(match.id)
                showToast(isPinned ? "Partida desafixada" : "Partida fixada! ⭐")
              }}
              className={cn(
                "press flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                isPinned
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  : "border-border/80 bg-card text-muted-foreground hover:text-foreground"
              )}
              title={isPinned ? "Partida fixada" : "Fixar partida"}
              aria-label={isPinned ? "Desafixar partida" : "Fixar partida no topo"}
              aria-pressed={isPinned}
            >
              <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
            </button>

            <button
              onClick={handleShare}
              className="press flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground"
              title="Compartilhar partida"
              aria-label="Compartilhar partida"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Scoreboard Stadium Card */}
        <div className="relative overflow-hidden rounded-[1.6rem] border border-primary/20 bg-[radial-gradient(130%_130%_at_10%_0%,#0f3d2b_0%,#082219_55%,#061a13_100%)] p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />

          {/* Header Tag */}
          <div className="relative z-10 flex items-center justify-between gap-2 text-xs text-white/80 pb-3 border-b border-white/10">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 font-bold uppercase tracking-wider text-[11px]">
              <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-emerald-300" />
              <span className="truncate">
                {match.competition}
                {match.competitionCountry ? ` • ${match.competitionCountry}` : ""}
              </span>
            </div>

            {isLive ? (
              <span className="inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-live px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Ao vivo {match.minute ? `· ${match.minute}'` : ""}
              </span>
            ) : isFinished ? (
              <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/85">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Finalizado
              </span>
            ) : (
              <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/85">
                <Clock className="h-3 w-3" />
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
                    isLive ? "text-[#5ef0b0]" : "text-white"
                  )}>
                    {match.homeScore}
                  </span>
                  <span className="text-white/40 text-lg font-light">-</span>
                  <span className={cn(
                    "text-3xl sm:text-4xl font-black tabular-nums tracking-tight",
                    isLive ? "text-[#5ef0b0]" : "text-white"
                  )}>
                    {match.awayScore}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-xl font-black tracking-tight text-white sm:text-2xl">
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
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {match.venue && match.venue !== "Local a confirmar"
                  ? match.venue
                  : "Local a confirmar"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Horário previsto: {matchTime}</span>
            </div>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div
          role="tablist"
          aria-label="Seções da partida"
          className="flex items-center gap-1 rounded-2xl border border-border/70 bg-muted/60 p-1 text-xs font-bold"
        >
          <button
            role="tab"
            aria-selected={activeTab === "lances"}
            aria-controls="tab-lances"
            id="tab-btn-lances"
            onClick={() => setSelectedTab("lances")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 transition-all",
              activeTab === "lances"
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Lances</span>
            {events.length > 0 && (
              <span className="tabular rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[9px] font-black">
                {events.length}
              </span>
            )}
          </button>

          {tableData.length > 0 && (
            <button
              role="tab"
              aria-selected={activeTab === "tabela"}
              aria-controls="tab-tabela"
              id="tab-btn-tabela"
              onClick={() => setSelectedTab("tabela")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 transition-all",
                activeTab === "tabela"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Classificação</span>
            </button>
          )}
        </div>

        {/* Tab 1: Lances / Timeline */}
        {activeTab === "lances" && (
          <div id="tab-lances" role="tabpanel" aria-labelledby="tab-btn-lances" className="space-y-3">
            {events.length > 0 ? (
              <div className="surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Lances da partida</span>
                  </h3>
                  <span className="tabular text-[10px] font-bold text-muted-foreground">
                    {events.length}
                  </span>
                </div>

                <ol className="relative mt-3 space-y-1 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-border">
                  {events.map((event) => {
                    const kind = eventKind(event.type)
                    const isGoal = kind === "goal" || kind === "ownGoal"
                    const isRed = kind === "red"
                    const isCard = kind === "yellow"
                    const isSub = kind === "sub"
                    const detail = localizeEventDetail(event.detail, event.type)

                    return (
                      <li
                        key={event.id}
                        className="relative flex items-start gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-muted/40"
                      >
                        <span
                          className={cn(
                            "tabular z-10 flex h-8 min-w-8 flex-shrink-0 items-center justify-center rounded-full border bg-card px-1 text-[10px] font-black shadow-sm",
                            isGoal
                              ? "border-primary/40 text-primary"
                              : isRed
                                ? "border-destructive/40 text-destructive"
                                : isCard
                                  ? "border-warning/40 text-warning"
                                  : "border-border text-muted-foreground"
                          )}
                        >
                          {event.minute ? `${event.minute}'` : "•"}
                        </span>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-center gap-x-1.5">
                            <span className="text-[11px] font-black text-foreground">
                              {localizeEventType(event.type)}
                            </span>
                            {event.player && (
                              <span className="truncate text-[11px] font-medium text-muted-foreground">
                                · {event.player}
                              </span>
                            )}
                          </div>
                          {(event.team || detail) && (
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {[event.team?.name, detail].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>

                        <span className="pt-0.5 text-sm" aria-hidden="true">
                          {isGoal ? "⚽" : isRed ? "🟥" : isCard ? "🟨" : isSub ? "🔄" : "•"}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ) : (
              /* Pre-match information card when no live events */
              <div className="space-y-3">
                <div className="surface space-y-4 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Informações da Partida
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isUpcoming
                          ? "A partida ainda não começou — veja as informações abaixo"
                          : "A fonte de dados não registrou lances para esta partida"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Competição
                      </span>
                      <span className="font-semibold text-foreground">
                        {match.competition}
                        {match.competitionCountry ? ` • ${match.competitionCountry}` : ""}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Local
                      </span>
                      <span className="font-semibold text-foreground">
                        {match.venue && match.venue !== "Local a confirmar"
                          ? match.venue
                          : "Não informado"}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                        Horário previsto
                      </span>
                      <span className="font-semibold text-foreground">{matchTime}</span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
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
          <div
            id="tab-tabela"
            role="tabpanel"
            aria-labelledby="tab-btn-tabela"
            className="surface space-y-3 overflow-hidden p-4"
          >
            <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span>Tabela • {match.competition}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <caption className="sr-only">
                  Classificação de {match.competition}
                </caption>
                <thead>
                  <tr className="border-b border-border text-[10px] text-muted-foreground uppercase">
                    <th scope="col" className="py-2 pr-2">Pos</th>
                    <th scope="col" className="py-2">Clube</th>
                    <th scope="col" className="py-2 text-center">J</th>
                    <th scope="col" className="py-2 text-center">V</th>
                    <th scope="col" className="py-2 text-center">SG</th>
                    <th scope="col" className="py-2 text-right font-bold text-foreground">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tableData.map((row) => {
                    const isHome = row.team.id === match.homeTeam.id
                    const isAway = row.team.id === match.awayTeam.id
                    const isHighlighted = isHome || isAway

                    return (
                      <tr
                        key={row.team.id}
                        className={cn(
                          "transition-colors",
                          isHighlighted ? "bg-primary/5 font-bold" : "hover:bg-muted/40"
                        )}
                      >
                        <td className="py-2 pr-2 tabular-nums">
                          <span className={cn(
                            "w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]",
                            isHighlighted ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {row.position}
                          </span>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 relative flex-shrink-0">
                              <Image
                                src={row.team.logo}
                                alt=""
                                width={16}
                                height={16}
                                className="rounded-full object-cover"
                                unoptimized
                              />
                            </div>
                            <span className="truncate max-w-[120px] sm:max-w-[180px]">
                              {row.team.name}
                            </span>
                          </div>
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


        {toastMessage && <Toast>{toastMessage}</Toast>}
      </div>
    </ErrorBoundary>
  )
}
