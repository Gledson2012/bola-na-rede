import type { Match, Standing } from "@/types"
import { mapApiMatchToMatch } from "@/lib/api"
import type { ApiMatch } from "@/types"
import { getUpstreamJson } from "@/lib/upstream"
import { mapWithConcurrency } from "@/lib/concurrency"
import { shiftDate, todayInTimeZone } from "@/lib/dates"

// `shiftDate` nasceu aqui e é reexportado para não quebrar quem já importa de
// `@/lib/history`; a implementação vive em `@/lib/dates`, junto do fuso.
export { shiftDate }

/**
 * Histórico datado de partidas.
 *
 * A API `/teams/{id}/form` não devolve partidas encerradas (devolve o
 * próximo jogo ou uma lista vazia), então a forma recente é reconstruída a
 * partir de `/matches?date=YYYY-MM-DD`, que expõe o resultado real de cada
 * dia. `playedOn` guarda a data verdadeira — `Match.date` é fabricada com o
 * dia de hoje e não serve para ordenar.
 */
export interface DatedMatch {
  match: Match
  playedOn: string
}

/** Lista de datas (YYYY-MM-DD) anteriores a hoje, do mais antigo ao mais recente. */
export function historyDateRange(now = new Date(), days = 14): string[] {
  // "Hoje" no fuso do app, não em UTC (ver `@/lib/dates`).
  const today = todayInTimeZone(now)
  const dates: string[] = []
  for (let index = days; index >= 1; index--) {
    dates.push(shiftDate(today, -index))
  }
  return dates
}

/** Últimas partidas encerradas de um time, da mais recente para a mais antiga. */
export function recentFormForTeam(
  matches: DatedMatch[],
  teamId: string,
  limit = 5
): DatedMatch[] {
  return matches
    .filter(
      ({ match }) =>
        match.homeTeam.id === teamId || match.awayTeam.id === teamId
    )
    .filter(
      ({ match }) =>
        match.status === "finished" &&
        match.homeScore !== null &&
        match.awayScore !== null
    )
    .sort(
      (a, b) =>
        b.playedOn.localeCompare(a.playedOn) ||
        (b.match.kickoff ?? "").localeCompare(a.match.kickoff ?? "")
    )
    .slice(0, limit)
}

/** Constrói uma classificação a partir de um conjunto de partidas. */
export function buildStandings(matches: Match[]): Standing[] {
  const teams = new Map<string, Standing>()

  const getTeam = (team: Match["homeTeam"]): Standing => {
    let row = teams.get(team.id)
    if (!row) {
      row = {
        position: 0,
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      }
      teams.set(team.id, row)
    }
    return row
  }

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) continue

    const home = getTeam(match.homeTeam)
    const away = getTeam(match.awayTeam)
    home.played++
    away.played++
    home.goalsFor += match.homeScore
    home.goalsAgainst += match.awayScore
    away.goalsFor += match.awayScore
    away.goalsAgainst += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.won++
      home.points += 3
      away.lost++
    } else if (match.homeScore < match.awayScore) {
      away.won++
      away.points += 3
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points++
      away.points++
    }
  }

  return Array.from(teams.values())
    .map((row) => ({
      ...row,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
    )
    .map((row, index) => ({ ...row, position: index + 1 }))
}

export interface HistoryResult {
  matches: DatedMatch[]
  /** Dias sem dados (a API falhou ou não tinha partidas). */
  unavailableDays: number
}

/**
 * Busca o histórico dos dias informados. Dias com falha da API não derrubam o
 * restante: são contabilizados e o chamador decide como reportar.
 */
export async function fetchHistory(
  dates: string[],
  options: { revalidate?: number; concurrency?: number } = {}
): Promise<HistoryResult> {
  const { revalidate = 900, concurrency = 8 } = options

  const daily = await mapWithConcurrency(dates, concurrency, async (date) => {
    try {
      const raw = await getUpstreamJson<ApiMatch[]>(
        `/matches?date=${encodeURIComponent(date)}&limit=500`,
        { revalidate }
      )
      return { date, matches: raw.map(mapApiMatchToMatch), unavailable: false }
    } catch (error) {
      console.warn(`[history] histórico indisponível para ${date}:`, error)
      return { date, matches: [] as Match[], unavailable: true }
    }
  })

  const seen = new Set<string>()
  const matches: DatedMatch[] = []

  for (const { date, matches: dayMatches } of daily) {
    for (const match of dayMatches) {
      // A mesma partida pode aparecer em mais de um dia: mantém a primeira.
      if (seen.has(match.id)) continue
      seen.add(match.id)
      matches.push({ match, playedOn: date })
    }
  }

  return {
    matches,
    unavailableDays: daily.filter(({ unavailable }) => unavailable).length,
  }
}
