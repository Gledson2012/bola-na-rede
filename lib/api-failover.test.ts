import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import {
  fetchWithFailover,
  getSourcesStatus,
  resetSources,
  configureSources,
} from "@/lib/api-failover"

// Mock do fetch global
const originalFetch = global.fetch

beforeEach(() => {
  configureSources(["http://primary.test", "http://fallback.test"])
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
  resetSources()
})

describe("fetchWithFailover", () => {
  it("deve retornar dados da fonte primária quando bem-sucedida", async () => {
    const mockData = { code: 200, data: [{ id: "1" }] }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    } as unknown as Response)

    const result = await fetchWithFailover("/matches/test")
    expect(result).toEqual(mockData.data)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      "http://primary.test/matches/test",
      expect.anything()
    )
  })

  it("deve fazer failover para a fonte secundária quando a primária falhar", async () => {
    const fallbackData = { code: 200, data: [{ id: "fallback" }] }

    let callCount = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++
      if (url.includes("primary.test")) {
        return Promise.reject(new Error("Primary down"))
      }
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue(fallbackData),
      } as unknown as Response)
    }) as any

    const result = await fetchWithFailover("/matches/test")
    expect(result).toEqual(fallbackData.data)
    expect(callCount).toBe(2)
  })

  it("deve lançar erro quando todas as fontes falham", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("All down")) as any

    await expect(fetchWithFailover("/matches/test")).rejects.toThrow("All down")
  })

  it("deve marcar fonte como indisponível após 3 falhas consecutivas", async () => {
    configureSources(["http://primary.test"])

    global.fetch = vi.fn().mockRejectedValue(new Error("Down")) as any

    // 3 falhas consecutivas
    for (let i = 0; i < 3; i++) {
      try {
        await fetchWithFailover("/matches/test")
      } catch {
        // esperado
      }
    }

    const status = getSourcesStatus()
    const primary = status.find((s) => s.baseUrl === "http://primary.test")
    expect(primary?.consecutiveFailures).toBe(3)
    expect(primary?.available).toBe(false)
  })
})

describe("getSourcesStatus", () => {
  it("deve retornar todas as fontes com status", () => {
    configureSources(["http://primary.test", "http://fallback.test"])

    const status = getSourcesStatus()
    expect(status.length).toBe(2)
    expect(status[0].baseUrl).toBe("http://primary.test")
    expect(status[1].baseUrl).toBe("http://fallback.test")
    expect(status.every((s) => s.available)).toBe(true)
  })
})