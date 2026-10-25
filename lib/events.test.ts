import { describe, expect, it } from "vitest"
import {
  classifyEvent,
  describeEvent,
  eventLabel,
  isGoalEvent,
  isMonitorableEvent,
  isPenaltyEvent,
} from "@/lib/events"

describe("classifyEvent", () => {
  it("classifica os tipos da API", () => {
    expect(classifyEvent("Goal")).toBe("goal")
    expect(classifyEvent("Goal - Header")).toBe("goal")
    expect(classifyEvent("Own Goal")).toBe("own_goal")
    expect(classifyEvent("Penalty - Scored")).toBe("penalty_goal")
    expect(classifyEvent("Penalty - Missed")).toBe("penalty_missed")
    expect(classifyEvent("Penalty - Saved")).toBe("penalty_saved")
    expect(classifyEvent("Red Card")).toBe("red_card")
    expect(classifyEvent("Yellow Card")).toBe("other")
    expect(classifyEvent("Substitution")).toBe("other")
    expect(classifyEvent("VAR Decision")).toBe("other")
  })

  it("aceita variações em português", () => {
    expect(classifyEvent("Gol")).toBe("goal")
    expect(classifyEvent("Gol contra")).toBe("own_goal")
    expect(classifyEvent("Gol de pênalti")).toBe("penalty_goal")
    expect(classifyEvent("Pênalti perdido")).toBe("penalty_missed")
    expect(classifyEvent("Pênalti defendido")).toBe("penalty_saved")
    expect(classifyEvent("Cartão vermelho")).toBe("red_card")
  })

  it("trata pênalti apenas marcado como pênalti, nunca como gol", () => {
    expect(classifyEvent("Penalty")).toBe("penalty_awarded")
    expect(classifyEvent("Pênalti")).toBe("penalty_awarded")
  })

  it("não confunde 'scored' com 'red' (regressão)", () => {
    // `"scored".includes("red")` é true: a leitura antiga contava o pênalti
    // convertido como cartão vermelho e o push anunciava expulsão.
    expect(classifyEvent("Penalty - Scored")).not.toBe("red_card")
    expect(classifyEvent("Goal - Scored")).not.toBe("red_card")
  })

  it("não confunde 'goalkeeper' com gol", () => {
    expect(classifyEvent("Goalkeeper Save")).toBe("other")
  })

  it("lida com valores vazios", () => {
    expect(classifyEvent()).toBe("other")
    expect(classifyEvent("")).toBe("other")
    expect(classifyEvent(null)).toBe("other")
  })
})

describe("helpers de classificação", () => {
  it("só considera gol os desfechos de gol", () => {
    expect(isGoalEvent("goal")).toBe(true)
    expect(isGoalEvent("own_goal")).toBe(true)
    expect(isGoalEvent("penalty_goal")).toBe(true)
    expect(isGoalEvent("penalty_awarded")).toBe(false)
    expect(isGoalEvent("penalty_missed")).toBe(false)
    expect(isGoalEvent("penalty_saved")).toBe(false)
    expect(isGoalEvent("red_card")).toBe(false)
  })

  it("agrupa todos os pênaltis", () => {
    expect(isPenaltyEvent("penalty_goal")).toBe(true)
    expect(isPenaltyEvent("penalty_awarded")).toBe(true)
    expect(isPenaltyEvent("goal")).toBe(false)
  })

  it("monitora gols, pênaltis e expulsões", () => {
    expect(isMonitorableEvent("goal")).toBe(true)
    expect(isMonitorableEvent("penalty_saved")).toBe(true)
    expect(isMonitorableEvent("red_card")).toBe(true)
    expect(isMonitorableEvent("other")).toBe(false)
  })
})

describe("describeEvent", () => {
  it("monta a frase completa do lance", () => {
    expect(
      describeEvent("penalty_goal", {
        player: "Fulano",
        team: "Time A",
        minute: 30,
      })
    ).toBe("Gol de pênalti de Fulano (Time A) aos 30'")
  })

  it("usa a preposição certa por tipo", () => {
    expect(describeEvent("red_card", { player: "Beltrano" })).toBe(
      "Cartão vermelho para Beltrano"
    )
    expect(describeEvent("penalty_missed", { player: "Ciclano" })).toBe(
      "Pênalti perdido por Ciclano"
    )
    expect(describeEvent("penalty_awarded", { player: "Ciclano" })).toBe(
      "Pênalti marcado para Ciclano"
    )
  })

  it("omite partes ausentes", () => {
    expect(describeEvent("goal")).toBe("Gol")
    expect(describeEvent("own_goal", { minute: 12 })).toBe("Gol contra aos 12'")
    expect(describeEvent("other", { player: "X" })).toBe("")
  })

  it("tem rótulo curto para todos os lances monitoráveis", () => {
    expect(eventLabel("penalty_awarded")).toBe("Pênalti marcado")
    expect(eventLabel("penalty_saved")).toBe("Pênalti defendido")
    expect(eventLabel("other")).toBe("")
  })
})
