import { hasRedisConfiguration, redisCommand } from "@/lib/live-monitor-storage"

/**
 * Cache compartilhado do backtest.
 *
 * O resultado era guardado em uma variável de módulo. Em serverless cada
 * instância tem a sua, então o cache quase nunca era aproveitado e cada clique
 * refazia a varredura de ~59 dias de partidas. O Redis (já configurado para o
 * push) torna o resultado comum a todas as instâncias.
 */

const CACHE_KEY = "analise:backtest:v1"

export const BACKTEST_CACHE_TTL_SECONDS = 30 * 60

export async function readCachedBacktest<T>(): Promise<T | null> {
  if (!hasRedisConfiguration()) return null

  try {
    const raw = await redisCommand<string | null>(["GET", CACHE_KEY])
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch (error) {
    // Cache é otimização: qualquer falha cai no cálculo normal.
    console.warn("[backtest-cache] falha ao ler o cache:", error)
    return null
  }
}

export async function writeCachedBacktest(payload: unknown): Promise<void> {
  if (!hasRedisConfiguration()) return

  try {
    await redisCommand([
      "SET",
      CACHE_KEY,
      JSON.stringify(payload),
      "EX",
      BACKTEST_CACHE_TTL_SECONDS,
    ])
  } catch (error) {
    console.warn("[backtest-cache] falha ao gravar o cache:", error)
  }
}
