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

// A rota precisa rodar a cada requisição; o cache fica nos fetches individuais.
export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Janela de histórico usada para reconstruir a forma recente dos times. */
const HISTORY_DAYS = 14

export async function GET() {
  try {
    const rawMatches = await getUpstreamJson<ApiMatch[]>("/matches/global", {
      revalidate: 20,
    })
    const matches = rawMatches.map(mapApiMatchToMatch)

    const competitionIds = Array.from(
      new Set(
        matches
          .map((match) => match.competitionId)
          .filter((id): id is string => Boolean(id))
      )
    )

    const tables = new Map<string, Standing[]>()

    await Promise.all(
      competitionIds.map(async (competitionId) => {
        try {
          const rawTable = await getUpstreamJson<ApiStanding[]>(
            `/competitions/${competitionId}/table`,
            { revalidate: 60 }
          )
          tables.set(competitionId, rawTable.map(mapApiStandingToStanding))
        } catch (error) {
          // Uma competição sem tabela não deve derrubar a análise das demais.
          console.warn(`[analise] falha ao carregar tabela ${competitionId}:`, error)
          tables.set(competitionId, [])
        }
      })
    )

    // O endpoint `/teams/{id}/form` não devolve partidas encerradas, então a
    // forma recente vem do histórico datado (`/matches?date=`).
    const history = await fetchHistory(historyDateRange(new Date(), HISTORY_DAYS), {
      revalidate: 900,
      concurrency: 8,
    })

    const analyses: MatchAnalysis[] = matches.map((match) => {
      const meta = getCompetitionMeta(
        match.competitionId || match.competition
      )
      const table = match.competitionId
        ? tables.get(match.competitionId) ?? []
        : []

      return analyzeMatch(match, table, meta.format ?? "league", {
        home: recentFormForTeam(history.matches, match.homeTeam.id),
        away: recentFormForTeam(history.matches, match.awayTeam.id),
      })
    })

    // Busca os eventos apenas dos jogos ao vivo (necessário para expulsões/alertas).
    const liveAnalyses = analyses.filter(
      (analysis) => analysis.status === "live" && analysis.available
    )
    const details = new Map<string, MatchDetail>()

    await Promise.all(
      liveAnalyses.map(async (analysis) => {
        try {
          const rawDetail = await getUpstreamJson<ApiMatchDetails>(
            `/matches/${analysis.matchId}`,
            { revalidate: 15 }
          )
          details.set(analysis.matchId, mapApiMatchToMatchDetail(rawDetail))
        } catch (error) {
          // Sem detalhes, o jogo fica sem probabilidade ao vivo e sem alertas.
          console.warn(
            `[analise] falha ao carregar detalhes da partida ${analysis.matchId}:`,
            error
          )
        }
      })
    )

    const alerts: AnalysisAlert[] = []

    for (const analysis of analyses) {
      const detail = details.get(analysis.matchId)
      if (!detail) continue

      analysis.live = computeLivePrediction(analysis, detail)
      analysis.alerts = extractLiveAlerts(analysis, detail)
      alerts.push(...analysis.alerts)
    }

    alerts.sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0))

    const payload: AnalysisResponse = {
      generatedAt: new Date().toISOString(),
      matches: analyses,
      slip: buildSlip(analyses),
      alerts,
      summary: {
        total: analyses.length,
        analyzed: analyses.filter((analysis) => analysis.available).length,
        upcoming: analyses.filter((analysis) => analysis.status === "upcoming")
          .length,
        // `live` conta as partidas ao vivo (mesmo critério do filtro da tela);
        // `liveAnalyzed` conta apenas as que receberam probabilidade ao vivo.
        live: analyses.filter((analysis) => analysis.status === "live").length,
        liveAnalyzed: analyses.filter((analysis) => analysis.live !== null).length,
        insufficient: analyses.filter((analysis) => !analysis.available).length,
      },
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    console.error("[analise] falha ao gerar análise:", error)
    return NextResponse.json(
      { error: "Não foi possível gerar a análise agora. Tente novamente." },
      { status: 502 }
    )
  }
}
