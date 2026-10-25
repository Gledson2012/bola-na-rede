import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkRateLimit, clientKey } from "@/lib/rate-limit"

const { redisCommand, hasRedisConfiguration } = vi.hoisted(() => ({
  redisCommand: vi.fn(),
  hasRedisConfiguration: vi.fn(),
}))

vi.mock("@/lib/live-monitor-storage", () => ({
  redisCommand,
  hasRedisConfiguration,
}))

describe("checkRateLimit", () => {
  beforeEach(() => {
    redisCommand.mockReset()
    hasRedisConfiguration.mockReset()
  })

  it("libera quando o Redis não está configurado", async () => {
    hasRedisConfiguration.mockReturnValue(false)

    const result = await checkRateLimit("push:1.2.3.4", 10, 60)
    expect(result).toEqual({ limited: false, remaining: 10, retryAfter: 0 })
    expect(redisCommand).not.toHaveBeenCalled()
  })

  it("libera enquanto o contador está dentro do limite", async () => {
    hasRedisConfiguration.mockReturnValue(true)
    redisCommand.mockResolvedValue(3)

    const result = await checkRateLimit("push:1.2.3.4", 10, 60)
    expect(result).toEqual({ limited: false, remaining: 7, retryAfter: 0 })
    expect(redisCommand).toHaveBeenCalledWith([
      "EVAL",
      expect.any(String),
      1,
      "rate-limit:push:1.2.3.4",
      60,
    ])
  })

  it("bloqueia ao passar do limite e informa o Retry-After", async () => {
    hasRedisConfiguration.mockReturnValue(true)
    redisCommand.mockResolvedValue("11")

    const result = await checkRateLimit("push:1.2.3.4", 10, 60)
    expect(result).toEqual({ limited: true, remaining: 0, retryAfter: 60 })
  })

  it("segue sem limitar se o Redis falhar", async () => {
    hasRedisConfiguration.mockReturnValue(true)
    redisCommand.mockRejectedValue(new Error("fora do ar"))
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const result = await checkRateLimit("push:1.2.3.4", 10, 60)
    expect(result.limited).toBe(false)
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })
})

describe("clientKey", () => {
  it("usa o primeiro IP de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })
    expect(clientKey(headers)).toBe("203.0.113.9")
  })

  it("cai para x-real-ip e depois para um valor fixo", () => {
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4"
    )
    expect(clientKey(new Headers())).toBe("desconhecido")
  })
})
