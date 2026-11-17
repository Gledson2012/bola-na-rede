import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// vi.hoisted permite declarar mocks antes do vi.mock (que é hoisted)
const hasRedisConfigurationMock = vi.hoisted(() => vi.fn(() => false))
const hasPushConfigurationMock = vi.hoisted(() => vi.fn(() => false))
const getPublicVapidKeyMock = vi.hoisted(() => vi.fn(() => null))

vi.mock("@/lib/live-monitor-storage", () => ({
  hasRedisConfiguration: hasRedisConfigurationMock,
  redisCommand: vi.fn(),
  listSubscriptionIds: vi.fn(() => []),
  redisMGet: vi.fn(() => []),
  subscriptionKey: vi.fn(() => "key"),
  acquireMonitorLock: vi.fn(() => true),
  releaseMonitorLock: vi.fn(() => Promise.resolve()),
}))

vi.mock("@/lib/web-push", () => ({
  hasPushConfiguration: hasPushConfigurationMock,
  getPublicVapidKey: getPublicVapidKeyMock,
  removeSubscription: vi.fn(),
  saveSubscription: vi.fn(),
  loadSubscriptions: vi.fn(),
  sendPushToSubscribers: vi.fn(),
}))

// --- GET /api/push/config ---
import { GET as pushConfigGET } from "./api/push/config/route"

// --- GET /api/rate-limit ---
import { GET as rateLimitGET } from "./api/rate-limit/route"

// --- POST /api/push/subscribe ---
import { POST as pushSubscribePOST } from "./api/push/subscribe/route"

// --- DELETE /api/push/subscribe ---
import { DELETE as pushSubscribeDELETE } from "./api/push/subscribe/route"

function makeRequest(
  url: string,
  { method = "GET", headers, body }: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
): NextRequest {
  const headersObj: Record<string, string> = { ...(headers ?? {}) }
  if (body !== undefined) {
    if (!("Content-Type" in headersObj)) {
      headersObj["Content-Type"] = "application/json"
    }
  }
  return new NextRequest(
    `http://localhost${url}`,
    {
      method,
      headers: headersObj,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    } as any
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  hasRedisConfigurationMock.mockReturnValue(false)
  hasPushConfigurationMock.mockReturnValue(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("GET /api/push/config", () => {
  it("deve retornar configuração de push sem variáveis de ambiente", async () => {
    const req = makeRequest("/api/push/config")
    const res = await (pushConfigGET as any)(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.pushConfigured).toBe(false)
    expect(data.redisConfigured).toBe(false)
    expect(data.aiConfigured).toBe(false)
    expect(data.vapidPublicKey).toBeNull()
    expect(res.headers.get("cache-control")).toContain("no-store")
  })
})

describe("GET /api/rate-limit", () => {
  it("deve permitir requisição quando abaixo do limite", async () => {
    const req = makeRequest("/api/rate-limit")
    const res = await (rateLimitGET as any)(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.remaining).toBeGreaterThanOrEqual(0)
  })

  it("deve retornar headers de rate limit", async () => {
    const req = makeRequest("/api/rate-limit")
    const res = await (rateLimitGET as any)(req)

    expect(res.headers.get("x-ratelimit-limit")).toBe("10")
  })
})

describe("POST /api/push/subscribe", () => {
  const validSubscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test",
    expirationTime: null,
    keys: { p256dh: "abc123", auth: "def456" },
  }

  it("deve rejeitar origem diferente (CORS)", async () => {
    const req = makeRequest("/api/push/subscribe", {
      method: "POST",
      headers: { origin: "https://evil.com" },
      body: validSubscription,
    })
    const res = await (pushSubscribePOST as any)(req)

    expect(res.status).toBe(403)
  })

  it("deve rejeitar body JSON inválido", async () => {
    hasPushConfigurationMock.mockReturnValue(true)
    hasRedisConfigurationMock.mockReturnValue(true)

    const req = new NextRequest("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "http://localhost" },
      body: "not-json",
    })
    const res = await (pushSubscribePOST as any)(req)

    expect(res.status).toBe(400)
  })

  it("deve rejeitar endpoint sem https", async () => {
    hasPushConfigurationMock.mockReturnValue(true)
    hasRedisConfigurationMock.mockReturnValue(true)

    const req = makeRequest("/api/push/subscribe", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: { ...validSubscription, endpoint: "http://not-https.com" },
    })
    const res = await (pushSubscribePOST as any)(req)

    expect(res.status).toBe(400)
  })

  it("deve rejeitar provedor de push não suportado", async () => {
    hasPushConfigurationMock.mockReturnValue(true)
    hasRedisConfigurationMock.mockReturnValue(true)

    const req = makeRequest("/api/push/subscribe", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: { ...validSubscription, endpoint: "https://unknown-provider.com/push" },
    })
    const res = await (pushSubscribePOST as any)(req)

    expect(res.status).toBe(400)
  })

  it("deve retornar 503 quando push não está configurado", async () => {
    const req = makeRequest("/api/push/subscribe", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: validSubscription,
    })
    const res = await (pushSubscribePOST as any)(req)

    expect(res.status).toBe(503)
  })
})

describe("DELETE /api/push/subscribe", () => {
  it("deve rejeitar origem diferente", async () => {
    const req = makeRequest("/api/push/subscribe", {
      method: "DELETE",
      headers: { origin: "https://evil.com" },
      body: { endpoint: "https://fcm.googleapis.com/fcm/send/test" },
    })
    const res = await (pushSubscribeDELETE as any)(req)

    expect(res.status).toBe(403)
  })

  it("deve rejeitar endpoint que não é string", async () => {
    hasPushConfigurationMock.mockReturnValue(true)
    hasRedisConfigurationMock.mockReturnValue(true)

    const req = makeRequest("/api/push/subscribe", {
      method: "DELETE",
      headers: { origin: "http://localhost" },
      body: { endpoint: 12345 },
    })
    const res = await (pushSubscribeDELETE as any)(req)

    expect(res.status).toBe(400)
  })

  it("deve rejeitar endpoint muito longo (>2048 chars)", async () => {
    hasPushConfigurationMock.mockReturnValue(true)
    hasRedisConfigurationMock.mockReturnValue(true)

    const longEndpoint = "https://fcm.googleapis.com/fcm/send/" + "a".repeat(2050)
    const req = makeRequest("/api/push/subscribe", {
      method: "DELETE",
      headers: { origin: "http://localhost" },
      body: { endpoint: longEndpoint },
    })
    const res = await (pushSubscribeDELETE as any)(req)

    expect(res.status).toBe(400)
  })

  it("deve retornar 503 quando push não está configurado", async () => {
    const req = makeRequest("/api/push/subscribe", {
      method: "DELETE",
      headers: { origin: "http://localhost" },
      body: { endpoint: "https://fcm.googleapis.com/fcm/send/test" },
    })
    const res = await (pushSubscribeDELETE as any)(req)

    expect(res.status).toBe(503)
  })
})