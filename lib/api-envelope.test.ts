import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import { unwrapApiPayload } from "@/lib/api-envelope"
import { getUpstreamJson } from "@/lib/upstream"

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function envelope(data: unknown): unknown {
  return { code: 200, message: "ok", data, count: Array.isArray(data) ? data.length : 1 }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("unwrapApiPayload", () => {
  it("desembrulha um array dentro de data", () => {
    const data = [{ id: "1" }, { id: "2" }]
    expect(unwrapApiPayload(envelope(data))).toEqual(data)
  })

  it("desembrulha um objeto dentro de data", () => {
    const data = { id: "match-1", status: "live" }
    expect(unwrapApiPayload(envelope(data))).toEqual(data)
  })

  it("mantém arrays puros", () => {
    const data = [{ position: 1 }]
    expect(unwrapApiPayload(data)).toEqual(data)
  })

  it("mantém objetos de domínio que têm data mas não têm code", () => {
    const payload = { data: "valor de domínio", name: "time" }
    expect(unwrapApiPayload(payload)).toBe(payload)
  })

  it("mantém null", () => {
    expect(unwrapApiPayload(null)).toBeNull()
  })
})

describe("getUpstreamJson", () => {
  it("desembrulha o envelope do upstream", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(envelope([{ id: "1" }])))
    )

    await expect(
      getUpstreamJson<Array<{ id: string }>>("/matches/global")
    ).resolves.toEqual([{ id: "1" }])
  })

  it("aceita o formato antigo sem envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([{ id: "1" }]))
    )

    await expect(
      getUpstreamJson<Array<{ id: string }>>("/matches/global")
    ).resolves.toEqual([{ id: "1" }])
  })
})

describe("cliente da API", () => {
  it("desembrulha o envelope vindo do proxy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(envelope([{ id: "1" }])))
    )

    await expect(api.matchesGlobal()).resolves.toEqual([{ id: "1" }])
  })

  it("mantém endpoints que ainda respondem um array puro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([{ position: 1 }]))
    )

    await expect(api.competitionTable("bra.1")).resolves.toEqual([
      { position: 1 },
    ])
  })
})
