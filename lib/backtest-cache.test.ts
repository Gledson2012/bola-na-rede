import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  BACKTEST_CACHE_TTL_SECONDS,
  readCachedBacktest,
  writeCachedBacktest,
} from "@/lib/backtest-cache"

const { redisCommand, hasRedisConfiguration } = vi.hoisted(() => ({
  redisCommand: vi.fn(),
  hasRedisConfiguration: vi.fn(),
}))

vi.mock("@/lib/live-monitor-storage", () => ({
  redisCommand,
  hasRedisConfiguration,
}))

describe("cache do backtest", () => {
  beforeEach(() => {
    redisCommand.mockReset()
    hasRedisConfiguration.mockReset()
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  it("não acessa o Redis quando não configurado", async () => {
    hasRedisConfiguration.mockReturnValue(false)

    expect(await readCachedBacktest()).toBeNull()
    await writeCachedBacktest({ ok: true })
    expect(redisCommand).not.toHaveBeenCalled()
  })

  it("lê o payload salvo", async () => {
    hasRedisConfiguration.mockReturnValue(true)
    redisCommand.mockResolvedValue(JSON.stringify({ evaluatedMatches: 42 }))

    expect(await readCachedBacktest()).toEqual({ evaluatedMatches: 42 })
  })

  it("ignora cache inexistente ou corrompido", async () => {
    hasRedisConfiguration.mockReturnValue(true)

    redisCommand.mockResolvedValueOnce(null)
    expect(await readCachedBacktest()).toBeNull()

    redisCommand.mockResolvedValueOnce("{quebrado")
    expect(await readCachedBacktest()).toBeNull()
  })

  it("grava com o TTL compartilhado", async () => {
    hasRedisConfiguration.mockReturnValue(true)
    redisCommand.mockResolvedValue("OK")

    await writeCachedBacktest({ evaluatedMatches: 42 })

    expect(redisCommand).toHaveBeenCalledWith([
      "SET",
      "analise:backtest:v1",
      JSON.stringify({ evaluatedMatches: 42 }),
      "EX",
      BACKTEST_CACHE_TTL_SECONDS,
    ])
    expect(BACKTEST_CACHE_TTL_SECONDS).toBe(30 * 60)
  })
})
