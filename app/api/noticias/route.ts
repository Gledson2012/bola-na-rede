import { NextResponse } from "next/server"
import { mapApiMatchToMatch, mapApiNewsToNews } from "@/lib/api"
import { linkNewsToMatches } from "@/lib/news-matching"
import { getUpstreamJson } from "@/lib/upstream"
import type { ApiMatch, ApiNews } from "@/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Notícias com as partidas correspondentes.
 *
 * A API de notícias não aceita filtro por time ou por jogo, então a
 * correspondência é feita no servidor e devolvida junto com cada matéria.
 */
export async function GET() {
  try {
    const [rawNews, rawMatches] = await Promise.all([
      getUpstreamJson<ApiNews[]>("/news", { revalidate: 300 }),
      getUpstreamJson<ApiMatch[]>("/matches/global", { revalidate: 30 }).catch(
        () => [] as ApiMatch[]
      ),
    ])

    const news = rawNews.map(mapApiNewsToNews)
    const matches = rawMatches.map(mapApiMatchToMatch)
    const linked = linkNewsToMatches(news, matches)

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        news: linked.news,
        matches: linked.matches,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[noticias] falha ao carregar as notícias:", error)
    return NextResponse.json(
      { error: "Não foi possível carregar as notícias agora. Tente novamente." },
      { status: 502 }
    )
  }
}
