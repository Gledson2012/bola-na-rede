import { NextResponse } from "next/server"
import { backtestDateRange, runRollingBacktest } from "@/lib/backtest"
import { fetchHistory } from "@/lib/history"

export const dynamic = "force-dynamic"
// A primeira execução busca ~60 dias de partidas e pode passar de 10s.
export const maxDuration = 60

/** Resultado reaproveitado por este tempo para não repetir a varredura. */
const CACHE_TTL_MS = 30 * 60 * 1000

interface CachedBacktest {
  expiresAt: number
  payload: unknown
}

let cache: CachedBacktest | null = null

export async function GET() {
  try {
    if (cache && cache.expiresAt > Date.now()) {
      return NextResponse.json(cache.payload, {
        headers: { "Cache-Control": "no-store" },
      })
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

    cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[analise/backtest] falha ao avaliar o modelo:", error)
    return NextResponse.json(
      { error: "Não foi possível avaliar o modelo agora. Tente novamente." },
      { status: 502 }
    )
  }
}
