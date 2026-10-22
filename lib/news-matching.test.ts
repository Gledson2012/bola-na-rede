import { describe, expect, it } from "vitest"
import {
  linkNewsToMatches,
  newsForMatch,
  normalizeTeamName,
  teamAppearsInText,
  toRelatedMatch,
} from "@/lib/news-matching"
import type { Match, News, Team } from "@/types"

function team(id: string, name: string, shortName = name.slice(0, 3)): Team {
  return {
    id,
    name,
    shortName,
    logo: "",
    primaryColor: "#000",
    secondaryColor: "#000",
  }
}

function news(overrides: Partial<News> & { id: string }): News {
  return {
    title: "",
    excerpt: "",
    image: "",
    category: "Geral",
    date: "22 out",
    readTime: "2 min",
    ...overrides,
  }
}

function match(
  overrides: Partial<Match> & { id: string; homeTeam: Team; awayTeam: Team }
): Match {
  return {
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    minute: null,
    date: "2026-10-22T16:00:00.000Z",
    competition: "Brasileirão",
    kickoff: "16:00",
    ...overrides,
  }
}

describe("normalizeTeamName", () => {
  it("remove acentos e caixa", () => {
    expect(normalizeTeamName("São Paulo")).toBe("sao paulo")
  })

  it("remove prefixos de clube", () => {
    expect(normalizeTeamName("EC Bahia")).toBe("bahia")
    expect(normalizeTeamName("SC Internacional")).toBe("internacional")
  })

  it("remove sufixo de modalidade", () => {
    expect(normalizeTeamName("Bahia Futebol")).toBe("bahia")
  })
})

describe("teamAppearsInText", () => {
  it("encontra o time ignorando acentos e caixa", () => {
    expect(teamAppearsInText("São Paulo", "O São Paulo venceu o clássico")).toBe(true)
    expect(teamAppearsInText("São Paulo", "O sao paulo venceu")).toBe(true)
  })

  it("respeita limite de palavra", () => {
    expect(teamAppearsInText("Bahia", "O bahiano comemorou")).toBe(false)
  })

  it("ignora nomes curtos demais", () => {
    expect(teamAppearsInText("Cor", "o coração do time")).toBe(false)
  })

  it("aceita texto com pontuação ao redor do nome", () => {
    expect(teamAppearsInText("Flamengo", "Flamengo, o mais querido!")).toBe(true)
  })
})

describe("toRelatedMatch", () => {
  it("monta o rótulo e os times", () => {
    const related = toRelatedMatch(
      match({
        id: "m1",
        homeTeam: team("fla", "Flamengo", "FLA"),
        awayTeam: team("vas", "Vasco", "VAS"),
      })
    )

    expect(related).toMatchObject({
      id: "m1",
      label: "FLA x VAS",
      competition: "Brasileirão",
    })
    expect(related.homeTeam.logo).toBe("")
  })
})

describe("linkNewsToMatches", () => {
  const flamengo = team("fla", "Flamengo", "FLA")
  const vasco = team("vas", "Vasco", "VAS")
  const palmeiras = team("pal", "Palmeiras", "PAL")
  const santos = team("san", "Santos", "SAN")

  const matches = [
    match({ id: "m1", homeTeam: flamengo, awayTeam: vasco }),
    match({ id: "m2", homeTeam: palmeiras, awayTeam: santos }),
  ]

  it("vincula notícia ao jogo quando o time aparece no texto", () => {
    const result = linkNewsToMatches(
      [news({ id: "n1", title: "Flamengo vence o clássico" })],
      matches
    )

    expect(result.news[0].relatedMatches.map((item) => item.id)).toEqual(["m1"])
    expect(result.matches.map((item) => item.id)).toEqual(["m1"])
  })

  it("não vincula quando nenhum time é citado", () => {
    const result = linkNewsToMatches(
      [news({ id: "n2", title: "Mercado da bola movimenta a semana" })],
      matches
    )

    expect(result.news[0].relatedMatches).toEqual([])
    expect(result.matches).toEqual([])
  })

  it("vincula pelos dois lados do confronto", () => {
    const result = linkNewsToMatches(
      [news({ id: "n3", title: "Palmeiras e Santos decidem no domingo" })],
      matches
    )

    expect(result.news[0].relatedMatches.map((item) => item.id)).toEqual(["m2"])
  })

  it("considera o conteúdo completo, não só o título", () => {
    const result = linkNewsToMatches(
      [
        news({
          id: "n4",
          title: "Rodada decisiva",
          content: "O Vasco chega pressionado para o confronto.",
        }),
      ],
      matches
    )

    expect(result.news[0].relatedMatches.map((item) => item.id)).toEqual(["m1"])
  })
})

describe("newsForMatch", () => {
  it("devolve as notícias ligadas ao jogo ou aos seus times", () => {
    const matchRelated = toRelatedMatch(
      match({
        id: "m1",
        homeTeam: team("fla", "Flamengo", "FLA"),
        awayTeam: team("vas", "Vasco", "VAS"),
      })
    )

    const linked = linkNewsToMatches(
      [
        news({ id: "n1", title: "Flamengo anuncia reforço" }),
        news({ id: "n2", title: "Palmeiras treina" }),
      ],
      [
        match({
          id: "m1",
          homeTeam: team("fla", "Flamengo", "FLA"),
          awayTeam: team("vas", "Vasco", "VAS"),
        }),
      ]
    )

    expect(newsForMatch(linked.news, matchRelated).map((item) => item.id)).toEqual([
      "n1",
    ])
  })
})
