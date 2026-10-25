import { hasRedisConfiguration, redisCommand } from "@/lib/live-monitor-storage"

/**
 * Rate limit simples no Redis (INCR + EXPIRE atômicos via Lua).
 *
 * Sem isso, `/api/push/subscribe` aceitava qualquer número de inscrições de
 * qualquer origem — inclusive requisições sem header `Origin` — e o Redis
 * crescia sem limite.
 */

export interface RateLimitResult {
  limited: boolean
  remaining: number
  retryAfter: number
}

const INCREMENT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!hasRedisConfiguration()) {
    // Sem Redis o push já não funciona; não bloqueia o restante do app.
    return { limited: false, remaining: limit, retryAfter: 0 }
  }

  try {
    const count = Number(
      await redisCommand<number | string>([
        "EVAL",
        INCREMENT_SCRIPT,
        1,
        `rate-limit:${key}`,
        windowSeconds,
      ])
    )

    if (!Number.isFinite(count)) {
      return { limited: false, remaining: limit, retryAfter: 0 }
    }

    return {
      limited: count > limit,
      remaining: Math.max(0, limit - count),
      retryAfter: count > limit ? windowSeconds : 0,
    }
  } catch (error) {
    // Falha do Redis não deve derrubar a rota: segue sem limitar.
    console.warn("[rate-limit] falha ao consultar o Redis:", error)
    return { limited: false, remaining: limit, retryAfter: 0 }
  }
}

/** Identifica o cliente pelo IP encaminhado pela borda. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") ?? ""
  const ip =
    forwarded.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "desconhecido"

  return ip
}
