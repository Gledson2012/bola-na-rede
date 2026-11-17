import { NextRequest, NextResponse } from "next/server"
import { mapApiMatchToMatchAsync } from "@/lib/api"
import { getUpstreamJson } from "@/lib/upstream"
import type { ApiMatch } from "@/types"

export const dynamic = "force-dynamic"

interface EnrichInput {
  matchIds?: string[]
}

export async function POST(request: NextRequest) {
  let input: EnrichInput
  try {
    input = (await request.json()) as EnrichInput
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 })
  }

  const matchIds = Array.isArray(input.matchIds) ? input.matchIds : []
  if (matchIds.length === 0) {
    return NextResponse.json({ error: "matchIds é obrigatório." }, { status: 400 })
  }

  try {
    const allMatches = await getUpstreamJson<ApiMatch[]>("/matches/global", {
      revalidate: 30,
    })

    const enriched = await Promise.all(
      allMatches
        .filter((m) => matchIds.includes(m.id))
        .map((m) => mapApiMatchToMatchAsync(m))
    )

    return NextResponse.json({
      matches: enriched,
      enrichedCount: enriched.length,
    })
  } catch (error) {
    console.error("[enrich] falha ao enriquecer partidas:", error)
    return NextResponse.json(
      { error: "Não foi possível enriquecer as partidas." },
      { status: 502 }
    )
  }
}