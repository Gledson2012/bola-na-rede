import { describe, expect, it } from "vitest"
import {
  analyzeMatch,
  computeLivePrediction,
  extractLiveAlerts,
  leagueBaselineProbabilities,
} from "@/lib/prediction"
import type { Match, MatchDetail, MatchEvent, Standing, Team } from "@/types"

function team(id: string, name = id): Team {
  return {
    id,
    name,
    shortName: name.slice(0, 3).toUpperCase(),
    logo: "",
    primaryColor: "#000",
    secondaryColor: "#000",
  }
}

const home = team("home", "Casa")
const away = team("away", "Fora")

function standing(
  rowTeam: Team,
  overrides: Partial<Standing> = {}
): Standing {
  return {
    position: 1,
    team: rowTeam,
    played: 10,
    won: 6,
    drawn: 2,
    lost: 2,
    goalsFor: 18,
    goalsAgainst: 10,
    goalDifference: 8,
    points: 20,
    form: [],
    ...overrides,
  }
}

const standings: Standing[] = [
  standing(home, { position: 1, goalsFor: 20, goalsAgainst: 9 }),
  standing(away, { position: 2, goalsFor: 12, goalsAgainst: 15 }),
]

function matchFixture(overrides: Partial<Match> = {}): Match {
  return {
    id: "match-1",
    homeTeam: home,
    awayTeam: away,
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    minute: null,
    date: "2026-10-25T15:00:00.000Z",
    competition: "Campeonato Teste",
    competitionId: "test.1",
    ...overrides,
  }
}

const analysis = analyzeMatch(matchFixture(), standings, "league")

function event(
  id: string,
  type: string,
  overrides: Partial<MatchEvent> = {}
): MatchEvent {
  return {
    id,
    minute: 30,
    type,
    team: home,
    player: "Fulano",
    detail: null,
    ...overrides,
  }
}

function detailFixture(events: MatchEvent[]): MatchDetail {
  return {
    ...matchFixture({ status: "live", minute: 60, homeScore: 1, awayScore: 0 }),
    events,
  }
}

describe("analyzeMatch", () => {
  it("devolve probabilidades normalizadas e mercados coerentes", () => {
    expect(analysis.available).toBe(true)
    const { home: h, draw: d, away: a } = analysis.probabilities
    expect(h + d + a).toBeCloseTo(1, 10)
    expect(analysis.markets.over25.probability + analysis.markets.under25.probability)
      .toBeCloseTo(1, 10)
    expect(analysis.markets.bttsYes.probability + analysis.markets.bttsNo.probability)
      .toBeCloseTo(1, 10)
    expect(analysis.expectedGoals.home).toBeGreaterThan(0)
    expect(analysis.expectedGoals.total).toBeCloseTo(
      analysis.expectedGoals.home + analysis.expectedGoals.away,
      10
    )
  })

  it("ordena os placares mais prováveis", () => {
    expect(analysis.topScores).toHaveLength(3)
    const [first, second, third] = analysis.topScores
    expect(first.probability).toBeGreaterThanOrEqual(second.probability)
    expect(second.probability).toBeGreaterThanOrEqual(third.probability)
    expect(first.probability).toBeLessThanOrEqual(1)
  })

  it("marca como indisponível quando o time não está na tabela", () => {
    const other = analyzeMatch(
      matchFixture({ homeTeam: team("missing", "Sumido") }),
      standings,
      "league"
    )
    expect(other.available).toBe(false)
    expect(other.reason).toMatch(/classificação/i)
  })

  it("exige amostra mínima da liga", () => {
    const onlyOne = analyzeMatch(matchFixture(), [standings[0]], "league")
    expect(onlyOne.available).toBe(false)
  })
})

describe("leagueBaselineProbabilities", () => {
  it("é uma distribuição válida de 1X2", () => {
    const probabilities = leagueBaselineProbabilities(2.7)
    const total = probabilities.home + probabilities.draw + probabilities.away
    expect(total).toBeCloseTo(1, 10)
    expect(probabilities.home).toBeGreaterThan(probabilities.away)
  })
})

describe("computeLivePrediction", () => {
  it("conta expulsões sem confundir pênalti convertido com cartão vermelho", () => {
    const live = computeLivePrediction(
      analysis,
      detailFixture([
        event("e1", "Penalty - Scored", { minute: 20 }),
        event("e2", "Red Card", { minute: 40, team: away, player: "Beltrano" }),
      ])
    )

    expect(live).not.toBeNull()
    // Regressão: "scored" contém "red", então a leitura antiga somava uma
    // expulsão inexistente para o time que converteu o pênalti.
    expect(live?.redCardsHome).toBe(0)
    expect(live?.redCardsAway).toBe(1)
    expect(
      (live?.probabilities.home ?? 0) +
        (live?.probabilities.draw ?? 0) +
        (live?.probabilities.away ?? 0)
    ).toBeCloseTo(1, 10)
  })

  it("devolve null fora de jogo ao vivo ou sem estimativa pré-jogo", () => {
    expect(
      computeLivePrediction(analysis, {
        ...detailFixture([]),
        status: "finished",
      })
    ).toBeNull()

    const unavailable = analyzeMatch(
      matchFixture({ homeTeam: team("missing", "Sumido") }),
      standings,
      "league"
    )
    expect(computeLivePrediction(unavailable, detailFixture([]))).toBeNull()
  })
})

describe("extractLiveAlerts", () => {
  it("rotula cada lance pelo desfecho correto", () => {
    const alerts = extractLiveAlerts(
      analysis,
      detailFixture([
        event("e1", "Penalty - Scored", { minute: 20 }),
        event("e2", "Penalty - Missed", { minute: 25 }),
        event("e3", "Penalty", { minute: 26 }),
        event("e4", "Red Card", { minute: 40 }),
        event("e5", "Yellow Card", { minute: 41 }),
        event("e6", "Substitution", { minute: 55 }),
      ])
    )

    expect(alerts).toHaveLength(4)
    const byId = new Map(alerts.map((alert) => [alert.id, alert]))

    expect(byId.get("evt-e1")).toMatchObject({
      type: "goal",
      text: "Gol de pênalti de Fulano (Casa) aos 20'",
    })
    expect(byId.get("evt-e2")).toMatchObject({
      type: "penalty",
      text: "Pênalti perdido por Fulano (Casa) aos 25'",
    })
    // Pênalti apenas marcado não pode aparecer como gol.
    expect(byId.get("evt-e3")).toMatchObject({
      type: "penalty",
      text: "Pênalti marcado para Fulano (Casa) aos 26'",
    })
    expect(byId.get("evt-e4")).toMatchObject({
      type: "red_card",
      text: "Cartão vermelho para Fulano (Casa) aos 40'",
    })
  })

  it("ordena do lance mais recente para o mais antigo", () => {
    const alerts = extractLiveAlerts(
      analysis,
      detailFixture([
        event("e1", "Goal", { minute: 10 }),
        event("e2", "Goal", { minute: 80 }),
      ])
    )
    expect(alerts.map((alert) => alert.minute)).toEqual([80, 10])
  })

  it("ignora lances sem relação com gols, pênaltis ou expulsões", () => {
    const alerts = extractLiveAlerts(
      analysis,
      detailFixture([
        event("e1", "Yellow Card"),
        event("e2", "Corner"),
        event("e3", "VAR Decision"),
      ])
    )
    expect(alerts).toEqual([])
  })
})
