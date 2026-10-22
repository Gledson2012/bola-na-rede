import type { ApiMatch, Match } from "@/types"
import { mapApiMatchToMatch } from "@/lib/api"
import { getUpstreamJson } from "@/lib/upstream"
import JogosClient from "./JogosClient"

/**
 * A lista de jogos é pública e igual para todos: renderizar no servidor deixa
 * o HTML pronto (sem skeleton no primeiro paint) e o cache de rota evita uma
 * chamada ao upstream por visitante. O cliente revalida em seguida.
 */
export const revalidate = 60

async function loadInitialMatches(): Promise<Match[]> {
  try {
    const data = await getUpstreamJson<ApiMatch[]>("/matches/global", {
      revalidate,
    })
    return data.map(mapApiMatchToMatch)
  } catch {
    // Sem dados no build/render: o cliente busca novamente ao montar.
    return []
  }
}

export default async function JogosPage() {
  const initialMatches = await loadInitialMatches()
  return <JogosClient initialMatches={initialMatches} />
}
