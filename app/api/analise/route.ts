import { NextResponse } from "next/server"
import {
  mapApiMatchToMatch,
  mapApiMatchToMatchDetail,
  mapApiStandingToStanding,
  type ApiMatchDetails,
  type ApiStanding,
} from "@/lib/api"
import { getCompetitionMeta } from "@/lib/competitions"
import { fetchHistory, historyDateRange, recentFormForTeam } from "@/lib/history"
import { getUpstreamJson } from "@/lib/upstream"
import {
  analyzeMatch,
  buildSlip,
  computeLivePrediction,
  extractLiveAlerts,
  type AnalysisAlert,
  type AnalysisResponse,
  type MatchAnalysis,
} from "@/lib/prediction"
import type { ApiMatch, MatchDetail, Standing } from "@/types"

// A resposta é global (não depende do usuário): o cache de rota mantém o
// resultado por 15s e serve o anterior enquanto revalida, em vez de recalcular
// o modelo a cada visitante e a cada polling da tela.
export const revalidate = 15
export const maxDuration = 60

/** Janela de histórico usada para reconstruir a forma recente dos times. */
const HISTORY_DAYS = 14

export async function GET() {
  const start = performance.now()
  try {
    // ... (resto do código existente)

    const duration = Math.round(performance.now() - start)
    console.log(`[analise] Request took ${duration}ms`)

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
        "X-Response-Time": `${duration}ms`,
      },
    })
  } catch (error) {
    const duration = Math.round(performance.now() - start)
    console.error(`[analise] Falha após ${duration}ms:`, error)
    return NextResponse.json(
      { error: "Não foi possível gerar a análise agora. Tente novamente." },
      { status: 502 }
    )
  }
}
