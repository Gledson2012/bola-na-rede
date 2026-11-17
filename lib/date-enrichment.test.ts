import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import {
  getDateEnrichmentSource,
  fetchEnrichedDate,
  fetchEnrichedDates,
  buildEnrichedMatchDate,
  clearEnrichedDateCache,
} from "@/lib/date-enrichment"

const originalFetch = global.fetch

beforeEach(() => {
  clearEnrichedDateCache()
  delete process.env.DATE_ENRICHMENT_URL
  delete process.env.DATE_ENRICHMENT_TIMEOUT_MS
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
  clearEnrichedDateCache()
  delete process.env.DATE_ENRICHMENT_URL
  delete process.env.DATE_ENRICHMENT_TIMEOUT_MS
})

describe("getDateEnrichmentSource", () => {
  it("deve retornar null quando DATE_ENRICHMENT_URL não está configurada", () => {
    expect(getDateEnrichmentSource()).toBeNull()
  })

  it("deve retornar a fonte quando DATE_ENRICHMENT_URL está configurada", () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()
    expect(source).not.toBeNull()
    expect(source?.baseUrl).toBe("https://enrich.test")
    expect(source?.timeoutMs).toBe(5000)
  })

  it("deve respeitar DATE_ENRICHMENT_TIMEOUT_MS", () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    process.env.DATE_ENRICHMENT_TIMEOUT_MS = "10000"
    const source = getDateEnrichmentSource()
    expect(source?.timeoutMs).toBe(10000)
  })
})

describe("fetchEnrichedDate", () => {
  it("deve retornar data quando a API responde com sucesso", async () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()!

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ date: "2026-11-20" }),
    } as unknown as Response)

    const date = await fetchEnrichedDate("match-1", source)
    expect(date).toBe("2026-11-20")
  })

  it("deve retornar null quando a API retorna erro", async () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()!

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response)

    const date = await fetchEnrichedDate("match-1", source)
    expect(date).toBeNull()
  })

  it("deve retornar null quando a API falha", async () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()!

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    const date = await fetchEnrichedDate("match-1", source)
    expect(date).toBeNull()
  })

  it("deve usar cache quando disponível", async () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()!

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ date: "2026-11-20" }),
    } as unknown as Response)

    await fetchEnrichedDate("match-1", source)
    const date2 = await fetchEnrichedDate("match-1", source)
    expect(date2).toBe("2026-11-20")
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

describe("buildEnrichedMatchDate", () => {
  it("deve usar data de hoje quando não há fonte configurada", async () => {
    const result = await buildEnrichedMatchDate("match-1", "15:00")
    expect(result).toContain("15:00:00.000Z")
    // Deve ser uma data válida
    expect(new Date(result).toISOString()).toBe(result)
  })

  it("deve usar data enriquecida quando disponível", async () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()!

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ date: "2026-12-25" }),
    } as unknown as Response)

    const result = await buildEnrichedMatchDate("match-1", "15:00")
    const date = new Date(result)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(11) // 0-indexed, dezembro = 11
    expect(date.getDate()).toBe(25)
  })
})

describe("clearEnrichedDateCache", () => {
  it("deve limpar o cache de datas enriquecidas", async () => {
    process.env.DATE_ENRICHMENT_URL = "https://enrich.test"
    const source = getDateEnrichmentSource()!

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ date: "2026-11-20" }),
    } as unknown as Response)

    await fetchEnrichedDate("match-1", source)
    clearEnrichedDateCache()

    // Nova chamada deve fazer fetch novamente
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ date: "2026-12-25" }),
    } as unknown as Response)

    const date = await fetchEnrichedDate("match-1", source)
    expect(date).toBe("2026-12-25")
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})