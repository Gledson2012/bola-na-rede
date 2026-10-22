import { describe, expect, it } from "vitest"
import { formatRelativeTime, formatShortDateTime, percent } from "@/lib/utils"

describe("percent", () => {
  it("formata com uma casa decimal e vírgula", () => {
    expect(percent(0.624)).toBe("62,4%")
    expect(percent(0)).toBe("0,0%")
    expect(percent(1)).toBe("100,0%")
  })

  it("devolve travessão para valores não finitos", () => {
    expect(percent(Number.NaN)).toBe("—")
    expect(percent(Number.POSITIVE_INFINITY)).toBe("—")
  })
})

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-22T12:00:00.000Z")
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it("usa 'agora' para menos de um minuto", () => {
    expect(formatRelativeTime(ago(30_000), now)).toBe("agora")
  })

  it("conta minutos, horas e dias com singular/plural", () => {
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe("há 5 min")
    expect(formatRelativeTime(ago(2 * 3_600_000), now)).toBe("há 2 h")
    expect(formatRelativeTime(ago(86_400_000), now)).toBe("há 1 dia")
    expect(formatRelativeTime(ago(3 * 86_400_000), now)).toBe("há 3 dias")
  })

  it("conta meses com singular/plural", () => {
    expect(formatRelativeTime(ago(30 * 86_400_000), now)).toBe("há 1 mês")
    expect(formatRelativeTime(ago(60 * 86_400_000), now)).toBe("há 2 meses")
  })

  it("devolve vazio para data inválida", () => {
    expect(formatRelativeTime("nao-e-uma-data", now)).toBe("")
  })
})

describe("formatShortDateTime", () => {
  const now = new Date("2026-10-22T12:00:00.000Z")

  it("inclui o ano quando a data não é do ano corrente", () => {
    expect(formatShortDateTime("2024-03-05T15:30:00.000Z", now)).toContain("2024")
  })

  it("omite o ano quando a data é do ano corrente", () => {
    expect(formatShortDateTime("2026-03-05T15:30:00.000Z", now)).not.toContain(
      "2026"
    )
  })
})
