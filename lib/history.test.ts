import { describe, expect, it } from "vitest"
import {
  buildStandings,
  historyDateRange,
  recentFormForTeam,
  shiftDate,
  type DatedMatch,
} from "@/lib/history"
import type { Match, Team } from "@/types"

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

function match(overrides: Partial<Match> & { id: string }): Match {
  return {
    homeTeam: team("home"),
    awayTeam: team("away"),
    homeScore: null,
    awayScore: null,
    status: "finished",
    minute: null,
    date: "2026-10-20T15:00:00.000Z",
    competition: "Teste",
    ...overrides,
  }
}

describe("shiftDate", () => {
  it("avança um dia", () => {
    expect(shiftDate("2026-03-01", 1)).toBe("2026-03-02")
  })

  it("atravessa a virada do ano", () => {
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01")
  })

  it("recua um dia", () => {
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31")
  })
})

describe("historyDateRange", () => {
  it("devolve dias anteriores a hoje, do mais antigo ao mais recente", () => {
    const dates = historyDateRange(new Date("2026-10-22T12:00:00.000Z"), 3)
    expect(dates).toEqual(["2026-10-19", "2026-10-20", "2026-10-21"])
  })

  it("nunca inclui o próprio dia", () => {
    const dates = historyDateRange(new Date("2026-10-22T23:59:00.000Z"), 2)
    expect(dates).not.toContain("2026-10-22")
  })
})

describe("recentFormForTeam", () => {
  const dated = (id: string, playedOn: string, extra: Partial<Match> = {}) => ({
    match: match({ id, ...extra }),
    playedOn,
  })

  it("considera só partidas encerradas e com placar", () => {
    const matches: DatedMatch[] = [
      dated("a", "2026-10-20", { homeScore: 1, awayScore: 0 }),
      dated("b", "2026-10-21", { status: "live", homeScore: 1, awayScore: 1 }),
      dated("c", "2026-10-19", { homeScore: null, awayScore: null }),
    ]

    const form = recentFormForTeam(matches, "home")
    expect(form.map((item) => item.match.id)).toEqual(["a"])
  })

  it("ordena da partida mais recente para a mais antiga", () => {
    const matches: DatedMatch[] = [
      dated("antiga", "2026-10-18", { homeScore: 2, awayScore: 0 }),
      dated("recente", "2026-10-21", { homeScore: 3, awayScore: 1 }),
      dated("meio", "2026-10-20", { homeScore: 0, awayScore: 0 }),
    ]

    expect(recentFormForTeam(matches, "home").map((i) => i.match.id)).toEqual([
      "recente",
      "meio",
      "antiga",
    ])
  })

  it("respeita o limite", () => {
    const matches: DatedMatch[] = Array.from({ length: 8 }, (_, index) =>
      dated(`m${index}`, `2026-10-${String(index + 10).padStart(2, "0")}`, {
        homeScore: 1,
        awayScore: 0,
      })
    )
    expect(recentFormForTeam(matches, "home", 5)).toHaveLength(5)
  })

  it("não mistura partidas de outros times", () => {
    const matches: DatedMatch[] = [
      dated("meu", "2026-10-20", {
        homeTeam: team("home"),
        awayTeam: team("away"),
        homeScore: 1,
        awayScore: 0,
      }),
      dated("outro", "2026-10-20", {
        homeTeam: team("x"),
        awayTeam: team("y"),
        homeScore: 1,
        awayScore: 0,
      }),
    ]

    expect(recentFormForTeam(matches, "home").map((i) => i.match.id)).toEqual([
      "meu",
    ])
  })
})

describe("buildStandings", () => {
  it("atribui pontos e ordena por pontos e saldo", () => {
    const matches: Match[] = [
      match({
        id: "1",
        homeTeam: team("a", "Alfa"),
        awayTeam: team("b", "Beta"),
        homeScore: 2,
        awayScore: 0,
      }),
      match({
        id: "2",
        homeTeam: team("a", "Alfa"),
        awayTeam: team("c", "Gama"),
        homeScore: 1,
        awayScore: 1,
      }),
      match({
        id: "3",
        homeTeam: team("b", "Beta"),
        awayTeam: team("c", "Gama"),
        homeScore: 3,
        awayScore: 1,
      }),
    ]

    const table = buildStandings(matches)

    expect(table.map((row) => row.team.id)).toEqual(["a", "b", "c"])
    expect(table[0]).toMatchObject({
      position: 1,
      points: 4,
      won: 1,
      drawn: 1,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      goalDifference: 2,
    })
    expect(table[1]).toMatchObject({ points: 3, goalDifference: 0 })
    expect(table[2]).toMatchObject({ points: 1, goalDifference: -2 })
  })

  it("ignora partidas sem placar", () => {
    const table = buildStandings([
      match({
        id: "x",
        homeTeam: team("a"),
        awayTeam: team("b"),
        homeScore: null,
        awayScore: null,
      }),
    ])
    expect(table).toEqual([])
  })
})
