import type { Match } from "@/types"
import {
  analyzeMatch,
  leagueBaselineProbabilities,
  type BacktestResponse,
} from "@/lib/prediction"
import {
  buildStandings,
  recentFormForTeam,
  type DatedMatch,
} from "@/lib/history"
import { shiftDate, todayInTimeZone } from "@/lib/dates"

export type { DatedMatch }

/** Brier multiclasse: soma do quadrado da diferença em cada um dos 3 resultados. */
function brierScore(
  probabilities: { home: number; draw: number; away: number },
  homeScore: number,
  awayScore: number
): number {
  const actual = {
    home: homeScore > awayScore ? 1 : 0,
    draw: homeScore === awayScore ? 1 : 0,
    away: homeScore < awayScore ? 1 : 0,
  }

  return (
    (probabilities.home - actual.home) ** 2 +
    (probabilities.draw - actual.draw) ** 2 +
    (probabilities.away - actual.away) ** 2
  )
}

/** Brier constante de um palpite uniforme (1/3 para cada resultado). */
const UNIFORM_BRIER = 2 / 3

export function runRollingBacktest(
  datedMatches: DatedMatch[],
  now = new Date(),
  testWindowDays = 14,
  trainingWindowDays = 45,
  unavailableDays = 0
): BacktestResponse {
  const today = todayInTimeZone(now)
  const testDates = Array.from({ length: testWindowDays }, (_, index) =>
    shiftDate(today, index - testWindowDays)
  )
  const firstTestDate = testDates[0]
  const finishedMatches = datedMatches.filter(
    ({ match, playedOn }) =>
      playedOn >= firstTestDate &&
      playedOn < today &&
      match.status === "finished" &&
      match.homeScore !== null &&
      match.awayScore !== null
  )

  let modelScoreTotal = 0
  let baselineScoreTotal = 0
  let poissonScoreTotal = 0
  let evaluatedMatches = 0

  for (const testDate of testDates) {
    const trainingStart = shiftDate(testDate, -trainingWindowDays)
    const trainingMatches = datedMatches.filter(
      ({ match, playedOn }) =>
        playedOn >= trainingStart &&
        playedOn < testDate &&
        match.status === "finished" &&
        match.homeScore !== null &&
        match.awayScore !== null
    )
    const testMatches = finishedMatches.filter(
      ({ playedOn }) => playedOn === testDate
    )

    for (const { match } of testMatches) {
      if (!match.competitionId) continue
      const competitionHistory = trainingMatches.filter(
        ({ match: previous }) => previous.competitionId === match.competitionId
      )
      const standings = buildStandings(
        competitionHistory.map(({ match: previous }) => previous)
      )
      const analysis = analyzeMatch(
        match,
        standings,
        "league",
        {
          home: recentFormForTeam(competitionHistory, match.homeTeam.id),
          away: recentFormForTeam(competitionHistory, match.awayTeam.id),
        }
      )
      if (!analysis.available) continue

      const outcomes = competitionHistory.reduce(
        (counts, { match: previous }) => {
          if ((previous.homeScore ?? 0) > (previous.awayScore ?? 0)) counts.home++
          else if ((previous.homeScore ?? 0) < (previous.awayScore ?? 0)) counts.away++
          else counts.draw++
          return counts
        },
        { home: 0, draw: 0, away: 0 }
      )
      const outcomeCount = outcomes.home + outcomes.draw + outcomes.away
      if (outcomeCount === 0) continue

      const baseline = {
        home: outcomes.home / outcomeCount,
        draw: outcomes.draw / outcomeCount,
        away: outcomes.away / outcomeCount,
      }

      // Poisson sem força de time: só a média de gols da competição.
      const leagueAvgGoals =
        competitionHistory.reduce(
          (total, { match: previous }) =>
            total + (previous.homeScore ?? 0) + (previous.awayScore ?? 0),
          0
        ) / outcomeCount
      const poissonBaseline = leagueBaselineProbabilities(leagueAvgGoals)

      modelScoreTotal += brierScore(
        analysis.probabilities,
        match.homeScore ?? 0,
        match.awayScore ?? 0
      )
      baselineScoreTotal += brierScore(
        baseline,
        match.homeScore ?? 0,
        match.awayScore ?? 0
      )
      poissonScoreTotal += brierScore(
        poissonBaseline,
        match.homeScore ?? 0,
        match.awayScore ?? 0
      )
      evaluatedMatches++
    }
  }

  const hasScores = evaluatedMatches > 0
  const modelBrierScore = hasScores ? modelScoreTotal / evaluatedMatches : null
  const baselineBrierScore = hasScores
    ? baselineScoreTotal / evaluatedMatches
    : null
  const poissonBaselineBrierScore = hasScores
    ? poissonScoreTotal / evaluatedMatches
    : null
  const uniformBrierScore = hasScores ? UNIFORM_BRIER : null

  const references = [
    { label: "frequência de resultados na liga", score: baselineBrierScore },
    { label: "Poisson com a média de gols da liga", score: poissonBaselineBrierScore },
    { label: "palpite uniforme", score: uniformBrierScore },
  ].filter((reference): reference is { label: string; score: number } =>
    reference.score !== null
  )

  const bestReference = references.reduce<
    { label: string; score: number } | null
  >(
    (best, reference) =>
      best === null || reference.score < best.score ? reference : best,
    null
  )

  const difference =
    modelBrierScore !== null && bestReference !== null
      ? modelBrierScore - bestReference.score
      : null

  return {
    generatedAt: now.toISOString(),
    testWindowDays,
    trainingWindowDays,
    finishedMatches: finishedMatches.length,
    evaluatedMatches,
    unavailableDays,
    coverage:
      finishedMatches.length > 0 ? evaluatedMatches / finishedMatches.length : 0,
    modelBrierScore,
    baselineBrierScore,
    poissonBaselineBrierScore,
    uniformBrierScore,
    bestBaselineScore: bestReference?.score ?? null,
    bestBaselineLabel: bestReference?.label ?? "",
    assessment:
      evaluatedMatches < 30 || difference === null
        ? "insufficient"
        : difference < -0.01
          ? "better"
          : difference > 0.01
            ? "worse"
            : "similar",
  }
}

/** Janela completa de dados necessária: histórico + janela de teste. */
export function backtestDateRange(now = new Date()): string[] {
  const today = todayInTimeZone(now)
  const firstTestDate = shiftDate(today, -14)
  const firstHistoryDate = shiftDate(firstTestDate, -45)
  const dates: string[] = []

  for (let date = firstHistoryDate; date < today; date = shiftDate(date, 1)) {
    dates.push(date)
  }

  return dates
}

export type { Match }
