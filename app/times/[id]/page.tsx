"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { TeamDetailSkeleton } from "@/components/Skeleton"
import { useTeam, useTeamForm, useTeamNext, useTeamLast, useFavorites } from "@/lib/queries"
import {
  ArrowLeft, Clock, Trophy, MapPin, Calendar, Star, Share2,
  TrendingUp, Shield, Info, ChevronRight, CheckCircle2, AlertCircle
} from "lucide-react"
import { cn, formatTime } from "@/lib/utils"

interface TeamDetailPageProps {
  params: { id: string }
}

function TeamHeaderLogo({ src, alt, name, color, size = 72 }: { src?: string; alt: string; name: string; color?: string; size?: number }) {
  const [error, setError] = useState(false)
  const initial = name ? name.trim().charAt(0).toUpperCase() : "⚽"

  if (!src || error) {
    return (
      <div
        style={{ width: size, height: size, backgroundColor: color || "#0ea5e9" }}
        className="rounded-3xl text-white font-black flex items-center justify-center text-2xl shadow-xl flex-shrink-0 border-4 border-background"
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
        className="rounded-3xl object-cover border-4 border-background shadow-xl bg-white p-1"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

export default function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = params
  const { data: team, isLoading: teamLoading, error: teamError, refetch } = useTeam(id)
  const { data: formMatches = [], isLoading: formLoading } = useTeamForm(id, 6)
  const { data: nextMatch, isLoading: nextLoading } = useTeamNext(id)
  const { data: lastMatch, isLoading: lastLoading } = useTeamLast(id)
  const { isFavorite, toggleFavorite } = useFavorites()

  const [activeTab, setActiveTab] = useState<"geral" | "sobre" | "jogos">("geral")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleShare = async () => {
    const title = team ? `Perfil do ${team.name}` : "Clube"
    const text = team ? `Veja as estatísticas e jogos do ${team.name} no Bola na Rede!` : "Bola na Rede"
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast("Link do clube copiado! 📋")
    }
  }

  const loading = teamLoading || formLoading || nextLoading || lastLoading

  if (teamError) {
    return (
      <ErrorBoundary fallback={<ErrorFallback message={teamError.message} onRetry={() => refetch()} />}>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold">Clube não encontrado</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Não foi possível carregar as informações deste clube.
          </p>
          <Link
            href="/times"
            className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors"
          >
            ← Voltar para Todos os Times
          </Link>
        </div>
      </ErrorBoundary>
    )
  }

  if (loading || !team) {
    return (
      <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar clube" onRetry={() => refetch()} />}>
        <div className="flex-1 space-y-4 py-3">
          <TeamDetailSkeleton />
        </div>
      </ErrorBoundary>
    )
  }

  const favorite = isFavorite(team.id)

  return (
    <ErrorBoundary fallback={<ErrorFallback message="Erro ao renderizar detalhes do time" onRetry={() => refetch()} />}>
      <div className="flex flex-col h-full space-y-4 pb-16">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2 border-b border-border/80">
          <Link
            href="/times"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Times</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                toggleFavorite(team.id)
                showToast(favorite ? "Removido dos favoritos" : "Adicionado aos favoritos ⭐")
              }}
              className={cn(
                "p-2 rounded-xl transition-colors border",
                favorite
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-500"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-amber-500"
              )}
              title={favorite ? "Remover dos favoritos" : "Favoritar time"}
            >
              <Star className={cn("w-4 h-4", favorite && "fill-amber-400")} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Compartilhar clube"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Club Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-futebol-950 to-slate-900 text-white p-5 shadow-xl border border-futebol-800">
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
                    <MapPin className="w-3.5 h-3.5 text-futebol-400" />
                    <span>{team.venue.name}</span>
                  </div>
                )}
                {team.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-futebol-400" />
                    <span>Fundado em {team.founded}</span>
                  </div>
                )}
              </div>

              {/* Status Tag */}
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                {team.liveMatches && team.liveMatches > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider animate-pulse shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    Jogando Agora
                  </span>
                ) : team.matchesToday && team.matchesToday > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-futebol-500/20 text-futebol-300 text-[11px] font-bold border border-futebol-500/30">
                    <Clock className="w-3 h-3" />
                    Partida agendada para hoje
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-medium">
                    Temporada Regular
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 border-b border-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("geral")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
              activeTab === "geral"
                ? "border-futebol-600 text-futebol-600 font-bold bg-futebol-50/50 dark:bg-futebol-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab("jogos")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
              activeTab === "jogos"
                ? "border-futebol-600 text-futebol-600 font-bold bg-futebol-50/50 dark:bg-futebol-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Jogos Recentes</span>
          </button>

          <button
            onClick={() => setActiveTab("sobre")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
              activeTab === "sobre"
                ? "border-futebol-600 text-futebol-600 font-bold bg-futebol-50/50 dark:bg-futebol-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Sobre o Clube</span>
          </button>
        </div>

        {/* Tab 1: Visão Geral */}
        {activeTab === "geral" && (
          <div className="space-y-4">
            {/* Next and Last Match Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Next Match */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-futebol-600" />
                    Próximo Jogo
                  </span>
                  {nextMatch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-futebol-50 dark:bg-futebol-950/50 text-futebol-600 font-bold">
                      {nextMatch.competition || "Agendado"}
                    </span>
                  )}
                </div>

                {nextMatch ? (
                  <Link
                    href={`/jogos/${nextMatch.id}`}
                    className="block p-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-colors border border-border/80 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{nextMatch.homeTeam.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-background text-xs font-bold tabular-nums">
                        {nextMatch.kickoff || formatTime(nextMatch.date)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{nextMatch.awayTeam.name}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/50">
                      <span>Ver centro da partida</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground py-3">Sem partida agendada para os próximos dias.</p>
                )}
              </div>

              {/* Last Match */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Último Resultado
                  </span>
                  {lastMatch && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold">
                      {lastMatch.competition || "Encerrado"}
                    </span>
                  )}
                </div>

                {lastMatch ? (
                  <Link
                    href={`/jogos/${lastMatch.id}`}
                    className="block p-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-colors border border-border/80 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{lastMatch.homeTeam.name}</span>
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-background font-bold text-xs tabular-nums shadow-sm">
                        <span>{lastMatch.homeScore ?? "-"}</span>
                        <span>:</span>
                        <span>{lastMatch.awayScore ?? "-"}</span>
                      </div>
                      <span className="text-xs font-semibold">{lastMatch.awayTeam.name}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/50">
                      <span>Ver pós-jogo</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ) : (
                  <p className="text-xs text-muted-foreground py-3">Sem partidas registradas recentemente.</p>
                )}
              </div>
            </div>

            {/* Recent Form Cards */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-futebol-600" />
                  <span>Histórico de Resultados Recentes</span>
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  {formMatches.length} jogos analisados
                </span>
              </div>

              {formMatches.length > 0 ? (
                <div className="space-y-2">
                  {formMatches.map((m) => {
                    const isHome = m.homeTeam.id === team.id
                    const myScore = isHome ? m.homeScore : m.awayScore
                    const oppScore = isHome ? m.awayScore : m.homeScore
                    const opponent = isHome ? m.awayTeam : m.homeTeam

                    let statusText = "E"
                    let statusBg = "bg-amber-500 text-white"
                    let statusLabel = "Empate"

                    if (myScore !== null && oppScore !== null) {
                      if (myScore > oppScore) {
                        statusText = "V"
                        statusBg = "bg-emerald-600 text-white"
                        statusLabel = "Vitória"
                      } else if (myScore < oppScore) {
                        statusText = "D"
                        statusBg = "bg-red-600 text-white"
                        statusLabel = "Derrota"
                      }
                    }

                    return (
                      <Link
                        key={m.id}
                        href={`/jogos/${m.id}`}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/30 hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={cn("w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm", statusBg)}>
                            {statusText}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {isHome ? "Casa contra" : "Fora contra"} {opponent.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              {m.competition}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tabular-nums">
                            {myScore !== null && oppScore !== null ? `${myScore} - ${oppScore}` : m.kickoff}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Calendário do {team.name}
              </h3>
              {formMatches.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {formMatches.map((m) => (
                    <Link
                      key={m.id}
                      href={`/jogos/${m.id}`}
                      className="py-3 flex items-center justify-between hover:bg-muted/30 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span>{m.homeTeam.name}</span>
                          <span className="font-bold text-futebol-600">vs</span>
                          <span>{m.awayTeam.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {m.competition} • {m.kickoff || formatTime(m.date)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4">Nenhum jogo listado no calendário.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Sobre o Clube */}
        {activeTab === "sobre" && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                História & Informações
              </h3>
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                {team.description ||
                  "Informações sobre a história deste clube não estão disponíveis na fonte de dados atual."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  Estádio Oficial
                </span>
                <span className="font-semibold text-foreground">
                  {team.venue?.name && team.venue.name !== "Local a confirmar"
                    ? team.venue.name
                    : "Não informado"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  Ano de Fundação
                </span>
                <span className="font-semibold text-foreground">
                  {team.founded || "Não informado"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
