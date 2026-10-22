"use client"

import { Activity, AlertTriangle, Clock, TrendingDown, TrendingUp } from "lucide-react"
import { cn, percent } from "@/lib/utils"
import type { MatchAnalysis } from "@/lib/prediction"
import { TeamLogo } from "@/components/futebol/TeamLogo"

function odd(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 1) return "—"
  return value.toFixed(2).replace(".", ",")
}

const CONFIDENCE_STYLES: Record<
  MatchAnalysis["confidence"],
  { label: string; className: string; dots: number }
> = {
  alta: {
    label: "Amostra alta",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    dots: 3,
  },
  media: {
    label: "Amostra média",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25",
    dots: 2,
  },
  baixa: {
    label: "Amostra baixa",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    dots: 1,
  },
  insuficiente: {
    label: "Sem amostra",
    className: "bg-muted text-muted-foreground border-border",
    dots: 0,
  },
}

function ConfidenceBadge({ analysis }: { analysis: MatchAnalysis }) {
  const style = CONFIDENCE_STYLES[analysis.confidence]

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold",
        style.className
      )}
      title={`${style.label} (${analysis.sample.homePlayed}/${analysis.sample.awayPlayed} jogos na tabela)`}
    >
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 w-1 rounded-full",
              index < style.dots ? "bg-current" : "bg-current/25"
            )}
          />
        ))}
      </span>
      {style.label}
    </span>
  )
}

function OutcomeTile({
  label,
  probability,
  isFavorite,
  accent,
}: {
  label: string
  probability: number
  isFavorite: boolean
  accent: string
}) {
  const fairOdd = probability > 0.001 ? 1 / probability : null

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-2 text-center transition-colors",
        isFavorite
          ? "border-futebol-500/30 bg-futebol-500/[0.07]"
          : "border-transparent bg-muted/50"
      )}
    >
      {isFavorite && (
        <span
          className={cn("absolute inset-x-0 top-0 h-0.5", accent)}
          aria-hidden="true"
        />
      )}
      <p className="truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-black tabular-nums",
          isFavorite ? "text-foreground" : "text-foreground/80"
        )}
      >
        {percent(probability)}
      </p>
      <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
        odd {odd(fairOdd)}
      </p>
    </div>
  )
}

function MarketRow({
  label,
  leftLabel,
  left,
  rightLabel,
  right,
  leftClassName,
  rightClassName,
}: {
  label: string
  leftLabel: string
  left: number
  rightLabel: string
  right: number
  leftClassName: string
  rightClassName: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold">{label}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          <span className={cn("font-bold", left >= right ? "text-foreground" : "text-muted-foreground")}>
            {percent(left)}
          </span>
          <span className="opacity-50"> / </span>
          <span className={cn("font-bold", right > left ? "text-foreground" : "text-muted-foreground")}>
            {percent(right)}
          </span>
        </span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
        <span className={leftClassName} style={{ width: `${left * 100}%` }} />
        <span className={rightClassName} style={{ width: `${right * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

function LiveDelta({ analysis }: { analysis: MatchAnalysis }) {
  if (!analysis.live) return null

  const delta = analysis.live.deltaHome
  const positive = delta >= 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
        positive
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400"
      )}
      title="Variação da probabilidade do mandante desde o início da partida"
    >
      {positive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {delta.toFixed(1).replace(".", ",")} p.p. mandante
    </span>
  )
}

export function MatchAnalysisCard({ analysis }: { analysis: MatchAnalysis }) {
  const probabilities = analysis.live?.probabilities ?? analysis.probabilities
  const outcomes = [
    {
      label: analysis.home.shortName,
      value: probabilities.home,
      accent: "bg-futebol-600",
    },
    { label: "Empate", value: probabilities.draw, accent: "bg-amber-400" },
    {
      label: analysis.away.shortName,
      value: probabilities.away,
      accent: "bg-sky-500",
    },
  ]
  const best = outcomes.reduce((a, b) => (b.value > a.value ? b : a))

  if (!analysis.available) {
    return (
      <article className="rounded-2xl border border-dashed border-border bg-card/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo src={analysis.home.logo} name={analysis.home.name} size={28} />
            <span className="truncate text-xs font-semibold">
              {analysis.home.shortName} x {analysis.away.shortName}
            </span>
            <TeamLogo src={analysis.away.logo} name={analysis.away.name} size={28} />
          </div>
          <ConfidenceBadge analysis={analysis} />
        </div>
        <p className="mt-2 truncate text-[10px] text-muted-foreground">
          {analysis.competition}
          {analysis.competitionCountry ? ` · ${analysis.competitionCountry}` : ""}
        </p>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {analysis.reason || "Dados insuficientes para gerar uma estimativa."}
        </p>
      </article>
    )
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Cabeçalho: competição + amostra */}
      <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-muted/30 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-muted-foreground">
            {analysis.competition}
            {analysis.competitionCountry ? ` · ${analysis.competitionCountry}` : ""}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            {analysis.status === "live" ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                Ao vivo
                {analysis.live ? ` · ${analysis.live.minute}'` : ""}
              </>
            ) : analysis.status === "finished" ? (
              "Encerrado"
            ) : (
              <>
                <Clock className="h-3 w-3" />
                {analysis.kickoff || "Horário indisponível"}
              </>
            )}
          </p>
        </div>
        <ConfidenceBadge analysis={analysis} />
      </div>

      {/* Times e placar */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamLogo src={analysis.home.logo} name={analysis.home.name} size={32} />
          <span className="truncate text-sm font-bold">{analysis.home.name}</span>
        </div>
        <div className="flex shrink-0 flex-col items-center px-1">
          {analysis.live ? (
            <span className="text-lg font-black tabular-nums leading-none">
              {analysis.live.homeScore}–{analysis.live.awayScore}
            </span>
          ) : (
            <span className="text-xs font-bold text-muted-foreground">x</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-right text-sm font-bold">
            {analysis.away.name}
          </span>
          <TeamLogo src={analysis.away.logo} name={analysis.away.name} size={32} />
        </div>
      </div>

      {/* Probabilidades 1X2 */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {outcomes.map((outcome) => (
            <OutcomeTile
              key={outcome.label}
              label={outcome.label}
              probability={outcome.value}
              isFavorite={outcome.label === best.label}
              accent={outcome.accent}
            />
          ))}
        </div>

        {/* Barra de proporção */}
        <div
          className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={`Mandante ${percent(probabilities.home)}, empate ${percent(probabilities.draw)}, visitante ${percent(probabilities.away)}`}
        >
          <span
            className="bg-futebol-600"
            style={{ width: `${probabilities.home * 100}%` }}
          />
          <span
            className="bg-amber-400"
            style={{ width: `${probabilities.draw * 100}%` }}
          />
          <span
            className="bg-sky-500"
            style={{ width: `${probabilities.away * 100}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            Gols esperados pré-jogo:{" "}
            <strong className="tabular-nums text-foreground">
              {analysis.expectedGoals.home.toFixed(1).replace(".", ",")} –{" "}
              {analysis.expectedGoals.away.toFixed(1).replace(".", ",")}
            </strong>
          </span>
          <LiveDelta analysis={analysis} />
        </div>
      </div>

      {/* Mercados */}
      <div className="mt-3 space-y-2.5 border-t border-border/70 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Mercados pré-jogo
        </p>
        <MarketRow
          label="Total de gols"
          leftLabel="Mais de 2,5"
          left={analysis.markets.over25.probability}
          rightLabel="Menos de 2,5"
          right={analysis.markets.under25.probability}
          leftClassName="bg-futebol-600"
          rightClassName="bg-slate-400 dark:bg-slate-600"
        />
        <MarketRow
          label="Ambos marcam"
          leftLabel="Sim"
          left={analysis.markets.bttsYes.probability}
          rightLabel="Não"
          right={analysis.markets.bttsNo.probability}
          leftClassName="bg-emerald-500"
          rightClassName="bg-slate-400 dark:bg-slate-600"
        />
      </div>

      {/* Placar mais provável + amostra */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-4 py-2.5">
        {analysis.topScores.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />
            {analysis.topScores.map((score) => (
              <span
                key={score.score}
                className="rounded-md bg-card px-1.5 py-0.5 text-[10px] font-bold tabular-nums ring-1 ring-border"
                title={`Probabilidade ${percent(score.probability)}`}
              >
                {score.score}
                <span className="ml-1 font-normal text-muted-foreground">
                  {percent(score.probability)}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}

        <p className="text-[10px] text-muted-foreground">
          {analysis.sample.recentHomeGames > 0 ||
          analysis.sample.recentAwayGames > 0
            ? `Forma: ${analysis.sample.recentHomeGames}/${analysis.sample.recentAwayGames} jogos`
            : `Tabela: ${analysis.sample.homePlayed}/${analysis.sample.awayPlayed} jogos`}
        </p>
      </div>

      {/* Aviso de amostra curta */}
      {analysis.sample.homePlayed < 6 && (
        <p className="flex items-start gap-1.5 border-t border-border/70 px-4 py-2 text-[10px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
          Amostra curta: a força de cada time foi encolhida em direção à média da
          competição, então a estimativa tende ao padrão do campeonato.
        </p>
      )}
    </article>
  )
}
