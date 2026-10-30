"use client"

import { use, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { TeamDetailSkeleton } from "@/components/Skeleton"
import { Toast } from "@/components/ui/toast"
import { useTeam, useTeamForm, useTeamNext, useTeamLast, useFavorites } from "@/lib/queries"
import { useToast } from "@/lib/use-toast"
import {
  ArrowLeft, Clock, MapPin, Calendar, Star, Share2,
  TrendingUp, Shield, Info, ChevronRight, CheckCircle2
} from "lucide-react"
import { cn, formatTime, copyToClipboard } from "@/lib/utils"

interface TeamDetailPageProps {
  params: Promise<{ id: string }>
}

function TeamHeaderLogo({ src, alt, name, color, size = 72 }: { src?: string; alt: string; name: string; color?: string; size?: number }) {
  const [error, setError] = useState(false)
  const initial = name ? name.trim().charAt(0).toUpperCase() : "⚽"

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: color || "#0ea5e9" }}
        className="flex flex-shrink-0 items-center justify-center rounded-2xl border border-white/20 text-2xl font-black text-white shadow-lg"
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
        className="rounded-2xl border border-white/20 bg-white object-cover p-1 shadow-lg"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = use(params)
  const { data: team, isLoading: teamLoading, error: teamError, refetch } = useTeam(id)
  const { data: formMatches = [], isLoading: formLoading } = useTeamForm(id, 6)
  const { data: nextMatch, isLoading: nextLoading } = useTeamNext(id)
  const { data: lastMatch, isLoading: lastLoading } = useTeamLast(id)
  const { isFavorite, toggleFavorite } = useFavorites()

  const [activeTab, setActiveTab] = useState<"geral" | "sobre" | "jogos">("geral")
  const { message: toastMessage, show: showToast } = useToast()

  const handleShare = async () => {
    const title = team ? `Perfil do ${team.name}` : "Clube"
    const text = team ? `Veja as estatísticas e jogos do ${team.name} no Bola na Rede!` : "Bola na Rede"
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          showToast("Não foi possível compartilhar.")
        }
      }
      return
    }

    const copied = await copyToClipboard(url)
    showToast(copied ? "Link do clube copiado! 📋" : "Não foi possível copiar o link.")
  }

  const loading = teamLoading || formLoading || nextLoading || lastLoading

  if (teamError) {
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message={teamError.message} onRetry={() => { reset(); refetch() }} />)}>
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-base font-black">Clube não encontrado</h2>
          <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
            Não foi possível carregar as informações deste clube.
          </p>
          <Link
            href="/times"
            className="press mt-4 rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
          >
            Voltar para Times
          </Link>
        </div>
      </ErrorBoundary>
    )
  }

  if (loading || !team) {
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar clube" onRetry={() => { reset(); refetch() }} />)}>
        <div className="flex-1 space-y-4 py-3">
          <TeamDetailSkeleton />
        </div>
      </ErrorBoundary>
    )
  }

  const favorite = isFavorite(team.id)

  return (
    <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao renderizar detalhes do time" onRetry={() => { reset(); refetch() }} />)}>
      <div className="flex flex-col gap-4 pb-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2">
          <Link
            href="/times"
            className="press inline-flex h-8 items-center gap-1 rounded-full border border-border/80 bg-card pl-2 pr-3 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Times</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                toggleFavorite(team.id)
                showToast(favorite ? "Removido dos favoritos" : "Adicionado aos favoritos ⭐")
              }}
              className={cn(
                "press flex h-8 w-8 items-center justify-center rounded-full border transition-colors",
                favorite
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                  : "border-border/80 bg-card text-muted-foreground hover:text-amber-500"
              )}
              title={favorite ? "Remover dos favoritos" : "Favoritar time"}
              aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              aria-pressed={favorite}
            >
              <Star className={cn("h-3.5 w-3.5", favorite && "fill-current")} />
            </button>

            <button
              onClick={handleShare}
              className="press flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground"
              title="Compartilhar clube"
              aria-label="Compartilhar clube"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Club Hero Banner */}
        <div className="relative overflow-hidden rounded-[1.6rem] border border-primary/20 bg-[radial-gradient(130%_130%_at_10%_0%,#0f3d2b_0%,#082219_55%,#061a13_100%)] p-5 text-white shadow-lg">
          <div
            className="absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl pointer-events-none rounded-full"
            style={{ backgroundColor: team.primaryColor || "#0ea5e9" }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <TeamHeaderLogo
              src={team.logo}
              alt={team.name}
              name={team.name}
              color={team.primaryColor}
              size={76}
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {team.name}
                </h1>
                <span className="px-2 py-0.5 rounded-lg bg-white/15 text-white text-xs font-bold uppercase tracking-wider">
                  {team.shortName}
                </span>
                {favorite && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                    Meu Clube
                  </span>
                )}
              </div>

              {/* Stadium & City info */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-white/70 mt-2">
                {team.venue?.name && team.venue.name !== "Local a confirmar" && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{team.venue.name}</span>
                  </div>
                )}
                {team.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Fundado em {team.founded}</span>
                  </div>
                )}
              </div>

              {/* Status Tag */}
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                {team.liveMatches && team.liveMatches > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-live px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Jogando agora
                  </span>
                ) : team.matchesToday && team.matchesToday > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80">
                    <Clock className="h-3 w-3" />
                    Joga hoje
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/80">
                    Temporada regular
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div
          role="tablist"
          aria-label="Seções do clube"
          className="flex items-center gap-1 rounded-2xl border border-border/70 bg-muted/60 p-1 text-[11px] font-bold"
        >
          {[
            { id: "geral" as const, label: "Visão geral", icon: TrendingUp },
            { id: "jogos" as const, label: "Jogos", icon: Clock },
            { id: "sobre" as const, label: "Sobre", icon: Info },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tab-${tab.id}`}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-all",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab 1: Visão Geral */}
        {activeTab === "geral" && (
          <div
            id="tab-geral"
            role="tabpanel"
            aria-labelledby="tab-btn-geral"
            className="space-y-4"
          >
            {/* Next and Last Match Cards */}
            <div className="grid gap-3">
              {/* Next Match */}
              <div className="surface space-y-2 p-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-black uppercase tracking-[0.12em]">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Próximo jogo
                  </span>
                  {nextMatch && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                      {nextMatch.competition || "Agendado"}
                    </span>
                  )}
                </div>

                {nextMatch ? (
                  <Link
                    href={`/jogos/${nextMatch.id}`}
                    className="group block rounded-xl border border-border/70 bg-muted/40 p-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">{nextMatch.homeTeam.name}</span>
                      <span className="tabular rounded-lg bg-background px-2 py-0.5 text-xs font-black">
                        {nextMatch.kickoff || formatTime(nextMatch.date)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right text-xs font-bold">{nextMatch.awayTeam.name}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground">
                      <span>Ver centro da partida</span>
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ) : (
                  <p className="py-3 text-[11px] text-muted-foreground">Sem partida agendada para os próximos dias.</p>
                )}
              </div>

              {/* Last Match */}
              <div className="surface space-y-2 p-4">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-black uppercase tracking-[0.12em]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Último resultado
                  </span>
                  {lastMatch && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                      {lastMatch.competition || "Encerrado"}
                    </span>
                  )}
                </div>

                {lastMatch ? (
                  <Link
                    href={`/jogos/${lastMatch.id}`}
                    className="group block rounded-xl border border-border/70 bg-muted/40 p-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">{lastMatch.homeTeam.name}</span>
                      <div className="tabular flex items-center gap-1 rounded-lg bg-background px-2.5 py-0.5 text-xs font-black shadow-sm">
                        <span>{lastMatch.homeScore ?? "-"}</span>
                        <span className="text-muted-foreground">:</span>
                        <span>{lastMatch.awayScore ?? "-"}</span>
                      </div>
                      <span className="min-w-0 flex-1 truncate text-right text-xs font-bold">{lastMatch.awayTeam.name}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5 text-[10px] text-muted-foreground">
                      <span>Ver pós-jogo</span>
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ) : (
                  <p className="py-3 text-[11px] text-muted-foreground">Sem partidas registradas recentemente.</p>
                )}
              </div>
            </div>

            {/* Recent Form Cards */}
            <div className="surface space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span>Resultados recentes</span>
                </h3>
                <span className="tabular text-[10px] font-bold text-muted-foreground">
                  {formMatches.length}
                </span>
              </div>

              {formMatches.length > 0 ? (
                <div className="space-y-2">
                  {formMatches.map((m) => {
                    const isHome = m.homeTeam.id === team.id
                    const myScore = isHome ? m.homeScore : m.awayScore
                    const oppScore = isHome ? m.awayScore : m.homeScore
                    const opponent = isHome ? m.awayTeam : m.homeTeam

                    let statusText = "–"
                    let statusBg = "bg-muted text-muted-foreground"
                    let statusLabel = "Sem placar"

                    if (myScore !== null && oppScore !== null) {
                      if (myScore > oppScore) {
                        statusText = "V"
                        statusBg = "bg-primary text-primary-foreground"
                        statusLabel = "Vitória"
                      } else if (myScore < oppScore) {
                        statusText = "D"
                        statusBg = "bg-live text-white"
                        statusLabel = "Derrota"
                      } else {
                        statusText = "E"
                        statusBg = "bg-warning text-white"
                        statusLabel = "Empate"
                      }
                    }

                    return (
                      <Link
                        key={m.id}
                        href={`/jogos/${m.id}`}
                        className="group flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-2.5 transition-colors hover:bg-muted"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            title={statusLabel}
                            aria-label={statusLabel}
                            className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black", statusBg)}
                          >
                            {statusText}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-foreground">
                              {isHome ? "Casa" : "Fora"} · {opponent.name}
                            </p>
                            <span className="block truncate text-[9.5px] text-muted-foreground">
                              {m.competition}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className="tabular text-[11px] font-black">
                            {myScore !== null && oppScore !== null ? `${myScore} - ${oppScore}` : m.kickoff}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Sem dados de partidas anteriores disponíveis no momento.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Jogos */}
        {activeTab === "jogos" && (
          <div
            id="tab-jogos"
            role="tabpanel"
            aria-labelledby="tab-btn-jogos"
            className="space-y-3"
          >
            <div className="surface space-y-3 p-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Últimos jogos do {team.name}
              </h3>
              {formMatches.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {formMatches.map((m) => (
                    <Link
                      key={m.id}
                      href={`/jogos/${m.id}`}
                      className="flex items-center justify-between rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate text-[11px] font-bold">
                          <span className="truncate">{m.homeTeam.name}</span>
                          <span className="flex-shrink-0 font-black text-primary">x</span>
                          <span className="truncate">{m.awayTeam.name}</span>
                        </div>
                        <span className="text-[9.5px] text-muted-foreground">
                          {m.competition} · {m.kickoff || formatTime(m.date)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-[11px] text-muted-foreground">Nenhum jogo recente disponível.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Sobre o Clube */}
        {activeTab === "sobre" && (
          <div
            id="tab-sobre"
            role="tabpanel"
            aria-labelledby="tab-btn-sobre"
            className="surface space-y-4 p-4"
          >
            <div>
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                História & informações
              </h3>
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-foreground/80">
                {team.description ||
                  "Informações sobre a história deste clube não estão disponíveis na fonte de dados atual."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px]">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-2.5">
                <span className="mb-0.5 block text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                  Estádio
                </span>
                <span className="font-bold text-foreground">
                  {team.venue?.name && team.venue.name !== "Local a confirmar"
                    ? team.venue.name
                    : "Não informado"}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/40 p-2.5">
                <span className="mb-0.5 block text-[9px] font-black uppercase tracking-wide text-muted-foreground">
                  Fundação
                </span>
                <span className="font-bold text-foreground">
                  {team.founded || "Não informado"}
                </span>
              </div>
            </div>
          </div>
        )}

        {toastMessage && <Toast>{toastMessage}</Toast>}
      </div>
    </ErrorBoundary>
  )
}
