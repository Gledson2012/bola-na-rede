import { describe, expect, it } from "vitest"
import {
  eventKind,
  localizeCompetition,
  localizeCountry,
  localizeEventDetail,
  localizeEventType,
  localizeNewsCategory,
} from "@/lib/pt-br"

describe("localizeCompetition", () => {
  it("traduz competições europeias e sauditas", () => {
    expect(localizeCompetition("Europa League")).toBe("Liga Europa")
    expect(localizeCompetition("Conference League")).toBe("Liga Conferência")
    expect(localizeCompetition("Champions League")).toBe("Liga dos Campeões")
    expect(localizeCompetition("Saudi Pro League")).toBe("Liga Saudita")
  })

  it("preserva nomes já em português e desconhecidos", () => {
    expect(localizeCompetition("Copa Libertadores")).toBe("Copa Libertadores")
    expect(localizeCompetition("Liga Municipal")).toBe("Liga Municipal")
    expect(localizeCompetition()).toBe("")
  })
})

describe("localizeCountry", () => {
  it("traduz países em inglês", () => {
    expect(localizeCountry("Saudi Arabia")).toBe("Arábia Saudita")
    expect(localizeCountry("Brazil")).toBe("Brasil")
    expect(localizeCountry("England")).toBe("Inglaterra")
  })

  it("preserva países já em português", () => {
    expect(localizeCountry("Arábia Saudita")).toBe("Arábia Saudita")
    expect(localizeCountry("Internacional")).toBe("Internacional")
  })
})

describe("localizeEventType", () => {
  it("traduz os tipos devolvidos pela API", () => {
    expect(localizeEventType("Goal")).toBe("Gol")
    expect(localizeEventType("Own Goal")).toBe("Gol contra")
    expect(localizeEventType("Penalty - Scored")).toBe("Gol de pênalti")
    expect(localizeEventType("Penalty - Missed")).toBe("Pênalti perdido")
    expect(localizeEventType("Yellow Card")).toBe("Cartão amarelo")
    expect(localizeEventType("Red Card")).toBe("Cartão vermelho")
    expect(localizeEventType("Substitution")).toBe("Substituição")
  })

  it("traduz tipo com detalhe embutido", () => {
    expect(localizeEventType("Goal - Header")).toBe("Gol")
  })

  it("mantém desconhecidos e vazio", () => {
    expect(localizeEventType("Water Break")).toBe("Water Break")
    expect(localizeEventType()).toBe("")
  })
})

describe("eventKind", () => {
  it("classifica cada lance", () => {
    expect(eventKind("Goal")).toBe("goal")
    expect(eventKind("Own Goal")).toBe("ownGoal")
    expect(eventKind("Red Card")).toBe("red")
    expect(eventKind("Second Yellow Card")).toBe("red")
    expect(eventKind("Yellow Card")).toBe("yellow")
    expect(eventKind("Substitution")).toBe("sub")
    expect(eventKind("Penalty - Missed")).toBe("other")
    expect(eventKind("Water Break")).toBe("other")
  })

  it("aceita o texto já em português", () => {
    expect(eventKind("Gol")).toBe("goal")
    expect(eventKind("Gol contra")).toBe("ownGoal")
    expect(eventKind("Cartão amarelo")).toBe("yellow")
    expect(eventKind("Substituição")).toBe("sub")
  })
})

describe("localizeEventDetail", () => {
  it("esconde o texto gerado que repete o tipo e o jogador", () => {
    expect(
      localizeEventDetail("Ziyad Al Jari (Al Fateh) Substitution at 45'", "Substitution")
    ).toBeNull()
    expect(
      localizeEventDetail("Ricardo Mathias (Al Shabab) Goal at 17'", "Goal")
    ).toBeNull()
  })

  it("traduz quando o texto acrescenta informação", () => {
    expect(
      localizeEventDetail("Fulano (Time) Penalty - Scored at 30'", "Goal")
    ).toBe("Gol de pênalti aos 30'")
  })

  it("traduz fragmentos soltos", () => {
    expect(localizeEventDetail("Assist: Cicrano", "Goal")).toBe(
      "Assistência: Cicrano"
    )
    expect(localizeEventDetail("Own Goal", "Goal")).toBe("Gol contra")
  })

  it("devolve null para detalhe vazio", () => {
    expect(localizeEventDetail(null, "Goal")).toBeNull()
    expect(localizeEventDetail("   ", "Goal")).toBeNull()
  })
})

describe("localizeNewsCategory", () => {
  it("traduz categorias em inglês", () => {
    expect(localizeNewsCategory("general")).toBe("Geral")
    expect(localizeNewsCategory("Transfers")).toBe("Transferências")
  })

  it("usa Futebol como padrão", () => {
    expect(localizeNewsCategory()).toBe("Futebol")
    expect(localizeNewsCategory("Geral")).toBe("Geral")
  })
})
