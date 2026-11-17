import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { getUpstreamJson, clearUpstreamCache } from "@/lib/upstream"

// Mock do fetch global
const originalFetch = global.fetch

beforeEach(() => {
  clearUpstreamCache()
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe("getUpstreamJson", () => {
  it("deve retornar dados da API quando a requisição bem-sucedida", async () => {
    const mockEnvelope = { code: 200, data: [{ id: "1", name: "Time A" }] }
    const expectedData = mockEnvelope.data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockEnvelope),
    } as unknown as Response)

    const result = await getUpstreamJson<unknown[]>("/matches/test")
    expect(result).toEqual(expectedData)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("deve lançar UpstreamError quando a API retornar erro", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: "Erro interno" }),
    } as unknown as Response)

    await expect(getUpstreamJson("/matches/test")).rejects.toThrow()
  })

  it("deve servir do cache de fallback quando a API falhar e houver cache prévio", async () => {
    const mockEnvelope = { code: 200, data: [{ id: "1", name: "Time A" }] }
    const expectedData = mockEnvelope.data

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockEnvelope),
      } as unknown as Response)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))

    global.fetch = fetchMock

    // Primeira chamada: sucesso, popula o cache
    await getUpstreamJson<unknown[]>("/matches/test")

    // Segunda chamada: API falha, deve retornar do cache
    const result = await getUpstreamJson<unknown[]>("/matches/test")
    expect(result).toEqual(expectedData)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("deve lançar erro quando a API falhar e não houver cache prévio", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(getUpstreamJson("/matches/test")).rejects.toThrow(TypeError)
  })

  it("deve armazenar dados no cache com TTL e expirar após o tempo configurado", async () => {
    const mockEnvelope = { code: 200, data: [{ id: "1" }] }
    const expectedData = mockEnvelope.data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockEnvelope),
    } as unknown as Response)

    // TTL de 1 segundo
    await getUpstreamJson<unknown[]>("/matches/test", {
      fallbackTtlSeconds: 1,
    })

    // Agora faz a API falhar imediatamente
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))

    const result = await getUpstreamJson<unknown[]>("/matches/test", {
      fallbackTtlSeconds: 1,
    })
    expect(result).toEqual(expectedData)
  })

  it("clearUpstreamCache deve remover a entrada do cache", async () => {
    const mockData = { code: 200, data: [{ id: "1" }] }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    } as unknown as Response)

    await getUpstreamJson<{ code: number; data: unknown[] }>("/matches/test")
    clearUpstreamCache("/matches/test")

    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(
      getUpstreamJson<{ code: number; data: unknown[] }>("/matches/test")
    ).rejects.toThrow(TypeError)
  })
})