import { describe, expect, it } from "vitest"
import { APP_TIME_ZONE, shiftDate, todayInTimeZone } from "@/lib/dates"

describe("todayInTimeZone", () => {
  it("usa o fuso de Brasília, não UTC", () => {
    // 01:30 UTC do dia 23 ainda é 22:30 do dia 22 em Brasília.
    expect(APP_TIME_ZONE).toBe("America/Sao_Paulo")
    expect(todayInTimeZone(new Date("2026-10-23T01:30:00.000Z"))).toBe(
      "2026-10-22"
    )
  })

  it("vira o dia à meia-noite de Brasília", () => {
    expect(todayInTimeZone(new Date("2026-10-23T02:59:59.000Z"))).toBe(
      "2026-10-22"
    )
    expect(todayInTimeZone(new Date("2026-10-23T03:00:00.000Z"))).toBe(
      "2026-10-23"
    )
  })

  it("formata com dois dígitos", () => {
    expect(todayInTimeZone(new Date("2026-01-05T15:00:00.000Z"))).toBe(
      "2026-01-05"
    )
  })
})

describe("shiftDate", () => {
  it("avança e recua dias", () => {
    expect(shiftDate("2026-03-01", 1)).toBe("2026-03-02")
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31")
  })

  it("atravessa anos bissextos", () => {
    expect(shiftDate("2028-02-28", 1)).toBe("2028-02-29")
    expect(shiftDate("2028-02-29", 1)).toBe("2028-03-01")
  })
})
