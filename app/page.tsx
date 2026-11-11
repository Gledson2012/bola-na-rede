"use client"

import Link from "next/link"
import { Trophy, TrendingUp, Newspaper, Users, ChevronRight, Sparkles } from "lucide-react"
import { SoccerBallIcon } from "@/components/icons/soccer-ball"
import { ALL_COMPETITIONS } from "@/lib/competitions"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 py-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-[radial-gradient(130%_130%_at_10%_0%,#0f3d2b_0%,#082219_55%,#04120e_100%)] p-6 text-white shadow-xl sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-25 blur-3xl pointer-events-none rounded-full bg-emerald-500" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nova geração · Estatísticas & Poisson</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bola na Rede
            </h1>
            <p className="max-w-md text-xs sm:text-sm font-normal leading-relaxed text-white/80">
              O ecossistema definitivo de futebol. Placares em tempo real, análises preditivas com Dixon-Coles, tabelas oficiais e cobertura jornalística global.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/jogos"
              className="press inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              <span>Ver Jogos de Hoje</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/analise"
              className="press inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <span>Central de Análises</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/jogos"
          className="surface surface-hover group flex flex-col justify-between p-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SoccerBallIcon className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <h2 className="text-xs font-black">Placares ao Vivo</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Acompanhe gols e minutagem em tempo real.</p>
          </div>
        </Link>

        <Link
          href="/analise"
          className="surface surface-hover group flex flex-col justify-between p-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <h2 className="text-xs font-black">Análise Estatística</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Previsões de gols, BTTS e probabilidades 1X2.</p>
          </div>
        </Link>

        <Link
          href="/classificacao"
          className="surface surface-hover group flex flex-col justify-between p-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <h2 className="text-xs font-black">Classificação</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Tabelas oficiais e faixas continentais.</p>
          </div>
        </Link>

        <Link
          href="/noticias"
          className="surface surface-hover group flex flex-col justify-between p-4"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Newspaper className="h-5 w-5" />
          </div>
          <div className="mt-3">
            <h2 className="text-xs font-black">Giro de Notícias</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Matérias das principais fontes do esporte.</p>
          </div>
        </Link>
      </div>

      {/* Featured Competitions Quick Strip */}
      <div className="surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
            Ligas em Destaque
          </h3>
          <Link href="/classificacao" className="text-[10px] font-bold text-primary hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {ALL_COMPETITIONS.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              href={`/classificacao?league=${c.id}`}
              className="press flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 p-2.5 transition-colors hover:bg-muted"
            >
              <span className="text-lg">{c.flag}</span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold text-foreground">{c.shortName}</span>
                <span className="block truncate text-[9px] text-muted-foreground">{c.country}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
