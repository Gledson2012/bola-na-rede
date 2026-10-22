import { createHash } from "node:crypto"

interface RedisResponse {
  result?: unknown
  error?: string
}

function redisConfiguration() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error("Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN")
  }
  return { url: url.replace(/\/$/, ""), token }
}

export function hasRedisConfiguration(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

export async function redisCommand<T = unknown>(
  command: Array<string | number>
): Promise<T> {
  const { url, token } = redisConfiguration()
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`Redis REST respondeu ${response.status}`)
  }

  const body = (await response.json()) as RedisResponse
  if (body.error) throw new Error(`Redis REST: ${body.error}`)
  return body.result as T
}

export function subscriptionKey(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex")
}

/** Lê vários valores do Redis em uma única ida e volta (MGET). */
export async function redisMGet<T = unknown>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return []
  const values = await redisCommand<(string | null)[]>(["MGET", ...keys])
  return values.map((value) => (value === null ? null : (value as unknown as T)))
}

/** Lista os identificadores das assinaturas push ativas. */
export async function listSubscriptionIds(): Promise<string[]> {
  const ids = await redisCommand<string[]>(["SMEMBERS", "live-monitor:subscriptions"])
  return Array.isArray(ids) ? ids : []
}

export async function acquireMonitorLock(token: string): Promise<boolean> {
  const result = await redisCommand<string | null>([
    "SET",
    "live-monitor:lock",
    token,
    "NX",
    "EX",
    240,
  ])
  return result === "OK"
}

export async function releaseMonitorLock(token: string): Promise<void> {
  await redisCommand<number>([
    "EVAL",
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    1,
    "live-monitor:lock",
    token,
  ])
}
