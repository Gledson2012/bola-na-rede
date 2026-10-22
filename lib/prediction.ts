import type { Match, MatchDetail, Standing } from "@/types"
import type { DatedMatch } from "@/lib/history"

/**
 * Motor de análise estatística do Bola na Rede.
 *
 * Modelo: Poisson independente com forças de ataque/defesa calculadas a partir
 * da classificação real da competição (gols pró, gols contra e jogos disputados).
 * Não usamos odds, xG, posse ou finalizações porque a API não fornece esses dados.
 * O objetivo é estimar probabilidades e a "odd justa" (1 / probabilidade), nunca
 * prometer lucro ou acerto.
 *
 * As forças são estimadas com shrinkagem (Bayes empírico): a taxa observada do
 * time é puxada em direção à média da liga conforme o tamanho da amostra. Times
 * com poucos jogos disputados continuam sendo analisados, mas ficam próximos
 * da média da competição e com confiança baixa, em vez de serem descartados.
 */

export type Confidence = "alta" | "media" | "baixa" | "insuficiente"

export interface OutcomeProbabilities {
  home: number
  draw: number
  away: number
}

export interface MarketProbability {
  probability: number
  fairOdd: number | null
}

export interface ScoreProbability {
  score: string
  probability: number
}

export interface LivePrediction {
  minute: number
  homeScore: number
  awayScore: number
  probabilities: OutcomeProbabilities
  deltaHome: number
  redCardsHome: number
  redCardsAway: number
  remainingExpectedGoals: { home: number; away: number }
}

export interface AnalysisAlert {
  id: string
  matchId: string
  matchLabel: string
  type: "goal" | "red_card" | "penalty"
  minute: number | null
  text: string
}

export interface MatchAnalysis {
  matchId: string
  competition: string
  competitionId: string
  competitionCountry: string
  kickoff: string
  status: Match["status"]
  home: { id: string; name: string; shortName: string; logo: string }
  away: { id: string; name: string; shortName: string; logo: string }
  available: boolean
  reason?: string
  confidence: Confidence
  confidenceScore: number
  sample: {
    homePlayed: number
    awayPlayed: number
    recentHomeGames: number
    recentAwayGames: number
    leagueAvgGoals: number
    format: string
  }
  expectedGoals: { home: number; away: number; total: number }
  probabilities: OutcomeProbabilities
  markets: {
    over25: MarketProbability
    under25: MarketProbability
    bttsYes: MarketProbability
    bttsNo: MarketProbability
  }
  topScores: ScoreProbability[]
  live: LivePrediction | null
  alerts: AnalysisAlert[]
}

export interface SuggestedPick {
  matchId: string
  matchLabel: string
  competition: string
  market: string
  probability: number
  fairOdd: number
}

export interface BetSlip {
  picks: SuggestedPick[]
  combinedProbability: number
  combinedFairOdd: number
  stakeUnits: number
}

export interface AnalysisResponse {
  generatedAt: string
  matches: MatchAnalysis[]
  slip: BetSlip | null
  alerts: AnalysisAlert[]
  summary: {
    total: number
    analyzed: number
    upcoming: number
    /** Partidas com status "live" (mesmo critério do filtro da tela). */
    live: number
    /** Partidas ao vivo que receberam probabilidade recalculada. */
    liveAnalyzed: number
    insufficient: number
  }
}

export interface BacktestResponse {
  generatedAt: string
  testWindowDays: number
  trainingWindowDays: number
  finishedMatches: number
  evaluatedMatches: number
  unavailableDays: number
  coverage: number
  /** Brier score do modelo Poisson com força de ataque/defesa. */
  modelBrierScore: number | null
  /** Brier da frequência histórica de mandante/empate/visitante na competição. */
  baselineBrierScore: number | null
  /** Brier de um Poisson usando apenas a média de gols da liga. */
  poissonBaselineBrierScore: number | null
  /** Brier de um palpite uniforme (1/3 para cada resultado). */
  uniformBrierScore: number | null
  /** Melhor referência entre as três acima. */
  bestBaselineScore: number | null
  bestBaselineLabel: string
  /** Avaliação do modelo contra a melhor referência. */
  assessment: "insufficient" | "better" | "similar" | "worse"
}

const HOME_FACTOR = 1.1
const AWAY_FACTOR = 0.9
const MAX_GOALS = 8
const RECENT_FORM_WEIGHT = 0.25
/**
 * Pseudo-jogos usados como prior na shrinkagem. Equivale a "quantos jogos a
 * liga valeria" para um time sem histórico: com 1 jogo observado o peso real é
 * 1/(1+6) ≈ 14% e com 10 jogos é 10/16 ≈ 63%.
 */
const SHRINKAGE_PRIOR_GAMES = 6
/** Mínimo de jogos para a amostra ser considerada utilizável. */
const MIN_PLAYED = 1
/** Mínimo de linhas com jogos disputados para estimar a média da liga. */
const MIN_ROWS_FOR_LEAGUE_AVG = 2

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((acc, value) => acc + value, 0) / values.length
}

const factorialCache: number[] = [1]

function factorial(n: number): number {
  if (factorialCache[n] !== undefined) return factorialCache[n]
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  factorialCache[n] = result
  return result
}

function poissonPmf(lambda: number, k: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
}

/** Matriz de placares exatos (0..MAX_GOALS), normalizada para somar 1. */
function buildScoreMatrix(lambdaHome: number, lambdaAway: number): number[][] {
  const matrix: number[][] = []
  let total = 0

  for (let home = 0; home <= MAX_GOALS; home++) {
    matrix[home] = []
    for (let away = 0; away <= MAX_GOALS; away++) {
      const probability = poissonPmf(lambdaHome, home) * poissonPmf(lambdaAway, away)
      matrix[home][away] = probability
      total += probability
    }
  }

  if (total > 0) {
    for (let home = 0; home <= MAX_GOALS; home++) {
      for (let away = 0; away <= MAX_GOALS; away++) {
        matrix[home][away] /= total
      }
    }
  }

  return matrix
}

function outcomesFromMatrix(matrix: number[][]): OutcomeProbabilities {
  let home = 0
  let draw = 0
  let away = 0

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const probability = matrix[h][a]
      if (h > a) home += probability
      else if (h === a) draw += probability
      else away += probability
    }
  }

  return { home, draw, away }
}

function marketsFromMatrix(matrix: number[][]): {
  over25: number
  under25: number
  bttsYes: number
  bttsNo: number
} {
  let over25 = 0
  let bttsYes = 0

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const probability = matrix[h][a]
      if (h + a >= 3) over25 += probability
      if (h >= 1 && a >= 1) bttsYes += probability
    }
  }

  return {
    over25,
    under25: 1 - over25,
    bttsYes,
    bttsNo: 1 - bttsYes,
  }
}

function topScoresFromMatrix(matrix: number[][], limit = 3): ScoreProbability[] {
  const scores: ScoreProbability[] = []

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      scores.push({
        score: `${h}-${a}`,
        probability: matrix[h][a],
      })
    }
  }

  return scores.sort((x, y) => y.probability - x.probability).slice(0, limit)
}

function fairOdd(probability: number): number | null {
  if (!Number.isFinite(probability) || probability <= 0.001) return null
  return 1 / probability
}

function market(probability: number): MarketProbability {
  return { probability, fairOdd: fairOdd(probability) }
}

function confidenceFor(minPlayed: number, format: string): {
  confidence: Confidence
  score: number
} {
  if (minPlayed < MIN_PLAYED) return { confidence: "insuficiente", score: 0 }

  if (minPlayed >= 12) {
    return format === "tournament"
      ? { confidence: "media", score: 0.7 }
      : { confidence: "alta", score: 1 }
  }

  if (minPlayed >= 6) return { confidence: "media", score: 0.7 }
  if (minPlayed >= 3) return { confidence: "baixa", score: 0.4 }
  return { confidence: "baixa", score: 0.25 }
}

/**
 * Converte uma taxa observada (gols por jogo) na força relativa à média da
 * liga, encolhendo em direção a 1.0 conforme a amostra é pequena.
 */
function shrunkStrength(
  goalsPerGame: number,
  leagueAvg: number,
  played: number
): number {
  if (leagueAvg <= 0) return 1
  const observed = goalsPerGame / leagueAvg
  const weight = played / (played + SHRINKAGE_PRIOR_GAMES)
  return weight * observed + (1 - weight) * 1
}

/**
 * Probabilidades 1X2 de um Poisson sem nenhuma informação de mando ou força de
 * time: só a média de gols da liga. Serve de referência mínima para o
 * backtest — é o que o modelo precisa superar para justificar a complexidade.
 */
export function leagueBaselineProbabilities(
  leagueAvgGoals: number
): OutcomeProbabilities {
  const average = clamp(leagueAvgGoals, 0.4, 4)
  const matrix = buildScoreMatrix(average * HOME_FACTOR, average * AWAY_FACTOR)
  return outcomesFromMatrix(matrix)
}

function baseAnalysis(match: Match): MatchAnalysis {
  return {
    matchId: match.id,
    competition: match.competition,
    competitionId: match.competitionId ?? "",
    competitionCountry: match.competitionCountry ?? "",
    kickoff: match.kickoff ?? "",
    status: match.status,
    home: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName,
      logo: match.homeTeam.logo,
    },
    away: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName,
      logo: match.awayTeam.logo,
    },
    available: false,
    confidence: "insuficiente",
    confidenceScore: 0,
    sample: {
      homePlayed: 0,
      awayPlayed: 0,
      recentHomeGames: 0,
      recentAwayGames: 0,
      leagueAvgGoals: 0,
      format: "unknown",
    },
    expectedGoals: { home: 0, away: 0, total: 0 },
    probabilities: { home: 1 / 3, draw: 1 / 3, away: 1 / 3 },
    markets: {
      over25: market(0),
      under25: market(0),
      bttsYes: market(0),
      bttsNo: market(0),
    },
    topScores: [],
    live: null,
    alerts: [],
  }
}

function unavailable(
  match: Match,
  reason: string,
  sample?: Partial<MatchAnalysis["sample"]>
): MatchAnalysis {
  const analysis = baseAnalysis(match)
  return {
    ...analysis,
    available: false,
    reason,
    sample: { ...analysis.sample, ...sample },
  }
}

/**
 * Analisa uma partida a partir da tabela de classificação da competição.
 * Retorna uma análise marcada como indisponível quando o clube não aparece na
 * tabela ou ainda não disputou nenhum jogo.
 *
 * `recentForm` traz as últimas partidas encerradas (com data real) de cada
 * time; quando há ao menos 3 jogos, parte do peso sai da média da temporada e
 * vem da forma recente.
 */
export function analyzeMatch(
  match: Match,
  standings: Standing[],
  format: string,
  recentForm?: { home: DatedMatch[]; away: DatedMatch[] }
): MatchAnalysis {
  const homeRow = standings.find((row) => row.team.id === match.homeTeam.id)
  const awayRow = standings.find((row) => row.team.id === match.awayTeam.id)

  if (!homeRow || !awayRow) {
    return unavailable(match, "Clube sem dados de classificação nesta competição", {
      format,
    })
  }

  const homePlayed = homeRow.played
  const awayPlayed = awayRow.played

  if (homePlayed < MIN_PLAYED || awayPlayed < MIN_PLAYED) {
    return unavailable(
      match,
      `Sem jogos disputados: ${homePlayed} do mandante e ${awayPlayed} do visitante`,
      { homePlayed, awayPlayed, format }
    )
  }

  const validRows = standings.filter((row) => row.played >= MIN_PLAYED)
  if (validRows.length < MIN_ROWS_FOR_LEAGUE_AVG) {
    return unavailable(match, "Classificação da competição ainda incompleta", {
      homePlayed,
      awayPlayed,
      format,
    })
  }

  const avgGoalsFor = mean(validRows.map((row) => row.goalsFor / row.played))
  const avgGoalsAgainst = mean(validRows.map((row) => row.goalsAgainst / row.played))
  const leagueAvg = clamp((avgGoalsFor + avgGoalsAgainst) / 2, 0.6, 2.6)

  const recentRates = (formMatches: DatedMatch[], teamId: string, isHome: boolean) => {
    const completed = formMatches.filter(
      ({ match: formMatch }) =>
        formMatch.status === "finished" &&
        formMatch.homeScore !== null &&
        formMatch.awayScore !== null &&
        (formMatch.homeTeam.id === teamId || formMatch.awayTeam.id === teamId)
    )
    const venueMatches = completed.filter(({ match: formMatch }) =>
      isHome
        ? formMatch.homeTeam.id === teamId
        : formMatch.awayTeam.id === teamId
    )
    const selectedMatches = (venueMatches.length >= 2 ? venueMatches : completed).slice(0, 5)
    const goalsFor = selectedMatches.map(({ match: formMatch }) =>
      formMatch.homeTeam.id === teamId
        ? formMatch.homeScore ?? 0
        : formMatch.awayScore ?? 0
    )
    const goalsAgainst = selectedMatches.map(({ match: formMatch }) =>
      formMatch.homeTeam.id === teamId
        ? formMatch.awayScore ?? 0
        : formMatch.homeScore ?? 0
    )

    return {
      played: selectedMatches.length,
      goalsFor: mean(goalsFor),
      goalsAgainst: mean(goalsAgainst),
    }
  }

  const homeRecent = recentRates(recentForm?.home ?? [], match.homeTeam.id, true)
  const awayRecent = recentRates(recentForm?.away ?? [], match.awayTeam.id, false)

  /**
   * Combina a taxa da temporada com a forma recente (25% quando há 3 ou mais
   * jogos) e devolve a taxa final por jogo.
   */
  const blendedRate = (seasonRate: number, recentRate: number, recentGames: number) => {
    const weight = recentGames >= 3 ? RECENT_FORM_WEIGHT : 0
    return seasonRate * (1 - weight) + recentRate * weight
  }

  const homeAttack = clamp(
    shrunkStrength(
      blendedRate(homeRow.goalsFor / homePlayed, homeRecent.goalsFor, homeRecent.played),
      leagueAvg,
      homePlayed
    ),
    0.2,
    3.2
  )
  const homeDefense = clamp(
    shrunkStrength(
      blendedRate(
        homeRow.goalsAgainst / homePlayed,
        homeRecent.goalsAgainst,
        homeRecent.played
      ),
      leagueAvg,
      homePlayed
    ),
    0.2,
    3.2
  )
  const awayAttack = clamp(
    shrunkStrength(
      blendedRate(awayRow.goalsFor / awayPlayed, awayRecent.goalsFor, awayRecent.played),
      leagueAvg,
      awayPlayed
    ),
    0.2,
    3.2
  )
  const awayDefense = clamp(
    shrunkStrength(
      blendedRate(
        awayRow.goalsAgainst / awayPlayed,
        awayRecent.goalsAgainst,
        awayRecent.played
      ),
      leagueAvg,
      awayPlayed
    ),
    0.2,
    3.2
  )

  const lambdaHome = clamp(
    leagueAvg * homeAttack * awayDefense * HOME_FACTOR,
    0.2,
    4.5
  )
  const lambdaAway = clamp(
    leagueAvg * awayAttack * homeDefense * AWAY_FACTOR,
    0.2,
    4.5
  )

  const matrix = buildScoreMatrix(lambdaHome, lambdaAway)
  const outcomes = outcomesFromMatrix(matrix)
  const markets = marketsFromMatrix(matrix)
  const { confidence, score } = confidenceFor(
    Math.min(homePlayed, awayPlayed),
    format
  )

  return {
    ...baseAnalysis(match),
    available: true,
    confidence,
    confidenceScore: score,
    sample: {
      homePlayed,
      awayPlayed,
      recentHomeGames: homeRecent.played,
      recentAwayGames: awayRecent.played,
      leagueAvgGoals: leagueAvg,
      format,
    },
    expectedGoals: {
      home: lambdaHome,
      away: lambdaAway,
      total: lambdaHome + lambdaAway,
    },
    probabilities: outcomes,
    markets: {
      over25: market(markets.over25),
      under25: market(markets.under25),
      bttsYes: market(markets.bttsYes),
      bttsNo: market(markets.bttsNo),
    },
    topScores: topScoresFromMatrix(matrix),
  }
}

function isRedCard(type: string): boolean {
  return type.toLowerCase().includes("red")
}

function isGoal(type: string): boolean {
  const normalized = type.toLowerCase()
  if (normalized.includes("own goal")) return true
  if (normalized.includes("penalty") && normalized.includes("missed")) return false
  return normalized.includes("goal") || (normalized.includes("penalty") && normalized.includes("scored"))
}

function isMissedPenalty(type: string): boolean {
  const normalized = type.toLowerCase()
  return normalized.includes("penalty") && normalized.includes("missed")
}

/**
 * Atualiza a probabilidade durante a partida usando placar, minuto e expulsões.
 * A distribuição de gols restantes é recalculada a partir dos gols esperados pré-jogo.
 */
export function computeLivePrediction(
  analysis: MatchAnalysis,
  detail: MatchDetail
): LivePrediction | null {
  if (!analysis.available || detail.status !== "live") return null

  const minute = clamp(detail.minute ?? 45, 1, 120)
  const remainingFraction = clamp((93 - minute) / 90, 0.02, 1)

  const redCardsHome = detail.events.filter(
    (event) => isRedCard(event.type) && event.team?.id === detail.homeTeam.id
  ).length
  const redCardsAway = detail.events.filter(
    (event) => isRedCard(event.type) && event.team?.id === detail.awayTeam.id
  ).length

  const homeMultiplier =
    Math.pow(0.72, redCardsHome) * Math.pow(1.15, redCardsAway)
  const awayMultiplier =
    Math.pow(0.72, redCardsAway) * Math.pow(1.15, redCardsHome)

  const remainingHome = clamp(
    analysis.expectedGoals.home * remainingFraction * homeMultiplier,
    0.01,
    6
  )
  const remainingAway = clamp(
    analysis.expectedGoals.away * remainingFraction * awayMultiplier,
    0.01,
    6
  )

  const matrix = buildScoreMatrix(remainingHome, remainingAway)
  const homeScore = detail.homeScore ?? 0
  const awayScore = detail.awayScore ?? 0

  let home = 0
  let draw = 0
  let away = 0

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const probability = matrix[h][a]
      const finalHome = homeScore + h
      const finalAway = awayScore + a
      if (finalHome > finalAway) home += probability
      else if (finalHome === finalAway) draw += probability
      else away += probability
    }
  }

  const probabilities = { home, draw, away }

  return {
    minute,
    homeScore,
    awayScore,
    probabilities,
    deltaHome: (probabilities.home - analysis.probabilities.home) * 100,
    redCardsHome,
    redCardsAway,
    remainingExpectedGoals: { home: remainingHome, away: remainingAway },
  }
}

/** Extrai alertas reais (gols, pênaltis e expulsões) dos eventos da partida. */
export function extractLiveAlerts(
  analysis: MatchAnalysis,
  detail: MatchDetail
): AnalysisAlert[] {
  const matchLabel = `${detail.homeTeam.shortName} x ${detail.awayTeam.shortName}`

  return detail.events
    .filter(
      (event) =>
        isGoal(event.type) || isRedCard(event.type) || isMissedPenalty(event.type)
    )
    .map((event) => {
      const normalized = event.type.toLowerCase()
      const teamName = event.team?.name ?? ""
      const player = event.player ?? ""
      const minuteLabel =
        event.minute != null ? ` aos ${event.minute}'` : ""

      let text = ""
      let type: AnalysisAlert["type"] = "goal"

      if (isRedCard(event.type)) {
        type = "red_card"
        text = `Cartão vermelho${player ? ` para ${player}` : ""}${
          teamName ? ` (${teamName})` : ""
        }${minuteLabel}`
      } else if (isMissedPenalty(event.type)) {
        type = "penalty"
        text = `Pênalti perdido${player ? ` por ${player}` : ""}${
          teamName ? ` (${teamName})` : ""
        }${minuteLabel}`
      } else if (normalized.includes("own goal")) {
        text = `Gol contra${player ? ` de ${player}` : ""}${
          teamName ? ` (${teamName})` : ""
        }${minuteLabel}`
      } else if (normalized.includes("penalty")) {
        text = `Gol de pênalti${player ? ` de ${player}` : ""}${
          teamName ? ` (${teamName})` : ""
        }${minuteLabel}`
      } else {
        text = `Gol${player ? ` de ${player}` : ""}${
          teamName ? ` (${teamName})` : ""
        }${minuteLabel}`
      }

      return {
        id: `evt-${event.id}`,
        matchId: analysis.matchId,
        matchLabel,
        type,
        minute: event.minute ?? null,
        text,
      }
    })
    .sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0))
}

/**
 * Monta um bilhete com as seleções de maior probabilidade entre os jogos
 * ainda não iniciados. Exclui baixa confiança e usa apenas uma seleção por jogo.
 */
export function buildSlip(analyses: MatchAnalysis[]): BetSlip | null {
  const candidates: Array<{ pick: SuggestedPick; score: number }> = []

  for (const analysis of analyses) {
    if (
      !analysis.available ||
      analysis.status !== "upcoming" ||
      analysis.confidenceScore < 0.7
    ) {
      continue
    }

    const options: Array<{ market: string; probability: number }> = [
      {
        market: `${analysis.home.shortName} vence`,
        probability: analysis.probabilities.home,
      },
      { market: "Empate", probability: analysis.probabilities.draw },
      {
        market: `${analysis.away.shortName} vence`,
        probability: analysis.probabilities.away,
      },
      {
        market: "Mais de 2.5 gols",
        probability: analysis.markets.over25.probability,
      },
      {
        market: "Menos de 2.5 gols",
        probability: analysis.markets.under25.probability,
      },
      {
        market: "Ambas marcam: Sim",
        probability: analysis.markets.bttsYes.probability,
      },
      {
        market: "Ambas marcam: Não",
        probability: analysis.markets.bttsNo.probability,
      },
    ]

    const best = options.sort((a, b) => b.probability - a.probability)[0]
    if (!best || best.probability < 0.53) continue

    const pick: SuggestedPick = {
      matchId: analysis.matchId,
      matchLabel: `${analysis.home.shortName} x ${analysis.away.shortName}`,
      competition: analysis.competition,
      market: best.market,
      probability: best.probability,
      fairOdd: 1 / best.probability,
    }

    candidates.push({
      pick,
      score: best.probability * (0.85 + 0.15 * analysis.confidenceScore),
    })
  }

  const picks = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((candidate) => candidate.pick)

  if (picks.length === 0) return null

  const combinedProbability = picks.reduce(
    (acc, pick) => acc * pick.probability,
    1
  )

  return {
    picks,
    combinedProbability,
    combinedFairOdd: 1 / combinedProbability,
    stakeUnits: combinedProbability >= 0.4 ? 1 : 0.5,
  }
}
