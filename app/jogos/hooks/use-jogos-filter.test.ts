import { describe, it, expect } from "vitest"
import { matchTimeKey } from "./use-jogos-filter"
import type { Match } from "@/types"

describe("matchTimeKey", () => {
  it("uses kickoff time directly when available", () => {
    const match = {
      kickoff: "16:00",
      date: "2026-11-15T19:00:00.000Z",
    } as unknown as Match

    expect(matchTimeKey(match)).toBe("16:00")
  })

  it("extracts HH:MM from date when kickoff is absent", () => {
    const match = {
      date: "2026-11-15T15:30:00.000Z",
    } as unknown as Match

    const result = matchTimeKey(match)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it("returns fallback for invalid date", () => {
    const match = {
      date: "invalid-date",
    } as unknown as Match

    expect(matchTimeKey(match)).toBe("99:99")
  })
})
