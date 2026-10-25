import { describe, expect, it } from "vitest"
import { backtestDateRange, runRollingBacktest } from "@/lib/backtest"

describe("backtestDateRange", () => {
  it("termina no dia anterior de Brasília, não no de UTC", () => {
    // 01:30 UTC de 23/10 = 22:30 de 22/10 em Brasília: a janela deve
    // terminar em 21/10, não em 22/10.
    const dates = backtestDateRange(new Date("2026-10-23T01:30:00.000Z"))

    expect(dates).toHaveLength(59)
    expect(dates[0]).toBe("2026-08-24")
    expect(dates.at(-1)).toBe("2026-10-21")
    expect(dates).not.toContain("2026-10-22")
  })
})

describe("runRollingBacktest", () => {
  it("devolve avaliação insuficiente sem amostra", () => {
    const result = runRollingBacktest([], new Date("2026-10-22T15:00:00.000Z"))

    expect(result.evaluatedMatches).toBe(0)
    expect(result.modelBrierScore).toBeNull()
    expect(result.bestBaselineScore).toBeNull()
    expect(result.assessment).toBe("insufficient")
  })
})
