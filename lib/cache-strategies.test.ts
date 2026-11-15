import { describe, it, expect } from "vitest"
import {
  cacheStrategies,
  withInitialData,
  conditionalRefetch,
} from "./cache-strategies"

describe("cacheStrategies", () => {
  it("provides fast refetch for live matches", () => {
    expect(cacheStrategies.liveMatches.refetchInterval).toBe(10_000)
    expect(cacheStrategies.liveMatches.staleTime).toBe(5_000)
  })

  it("provides dynamic strategy for match detail based on live status", () => {
    const liveStrategy = cacheStrategies.matchDetail(true)
    expect(liveStrategy.refetchInterval).toBe(15_000)
    expect(liveStrategy.staleTime).toBe(10_000)

    const finishedStrategy = cacheStrategies.matchDetail(false)
    expect(finishedStrategy.refetchInterval).toBe(false)
    expect(finishedStrategy.staleTime).toBe(60_000)
  })

  it("sets long stale time for static data like competitions and teams", () => {
    expect(cacheStrategies.teams.staleTime).toBeGreaterThanOrEqual(5 * 60_000)
    expect(cacheStrategies.competitions.staleTime).toBeGreaterThanOrEqual(10 * 60_000)
  })
})

describe("withInitialData", () => {
  it("returns empty object when data is undefined", () => {
    expect(withInitialData(undefined)).toEqual({})
  })

  it("returns initialData with updatedAt 0 to trigger immediate background revalidation", () => {
    const mockData = [{ id: "1", name: "Team" }]
    const result = withInitialData(mockData)

    expect(result).toEqual({
      initialData: mockData,
      initialDataUpdatedAt: 0,
    })
  })
})

describe("conditionalRefetch", () => {
  it("returns interval when condition is true", () => {
    expect(conditionalRefetch(true, 15_000)).toBe(15_000)
  })

  it("returns false when condition is false", () => {
    expect(conditionalRefetch(false, 15_000)).toBe(false)
  })
})
