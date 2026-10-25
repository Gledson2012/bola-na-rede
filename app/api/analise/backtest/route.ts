import { NextResponse } from "next/server"
import { backtestDateRange, runRollingBacktest } from "@/lib/backtest"
import {
  BACKTEST_CACHE_TTL_SECONDS,
  readCachedBacktest,
  writeCachedBacktest,
} from "@/lib/backtest-cache"
import { fetchHistory } from "@/lib/history"

export const dynamic = "force-dynamic"
// A primeira execução busca ~60 dias de partidas e pode passar de 10s.
export const maxDuration = 60

/** Resultado reaproveitado por este tempo para não repetir a varredura. */
const CACHE_TTL_MS = BACKTEST_CACHE_TTL_SECONDS * 1000

interface CachedBacktest {
  expiresAt: number
  payload: unknown
}

/**
 * Cache L1 por instância. O cache compartilhado (Redis) está em
 * `@/lib/backtest-cache`; este evita até a ida ao Redis quando a mesma
 * instância recebe cliques seguidos.
 */
let memoryCache: CachedBacktest | null = null

const NO_STORE = { "Cache-Control": "no-store" }

export async function GET() {
  try {
    if (memoryCache && memoryCache.expiresAt > Date.now()) {
      return NextResponse.json(memoryCache.payload, { headers: NO_STORE })
    }

    const shared = await readCachedBacktest<unknown>()
    if (shared) {
      memoryCache = { expiresAt: Date.now() + CACHE_TTL_MS, payload: shared }
      return NextResponse.json(shared, { headers: NO_STORE })
    }

    const now = new Date()
    const dates = backtestDateRange(now)

    const history = await fetchHistory(dates, {
      // O histórico de partidas encerradas muda pouco: cache mais longo.
      revalidate: 21_600,
      concurrency: 8,
    })

    const datedMatches = history.matches

    const payload = runRollingBacktest(
      datedMatches,
      now,
      14,
      45,
      history.unavailableDays
    )

    memoryCache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }
    await writeCachedBacktest(payload)

    return NextResponse.json(payload, { headers: NO_STORE })
  } catch (error) {
    console.error("[analise/backtest] falha ao avaliar o modelo:", error)
    return NextResponse.json(
      { error: "Não foi possível avaliar o modelo agora. Tente novamente." },
      { status: 502 }
    )
  }
}
