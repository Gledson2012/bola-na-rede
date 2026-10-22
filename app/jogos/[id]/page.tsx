import { mapApiMatchToMatchDetail, type ApiMatchDetails } from "@/lib/api"
import { getUpstreamJson } from "@/lib/upstream"
import type { MatchDetail } from "@/types"
import MatchDetailClient from "./MatchDetailClient"

/**
 * O detalhe é público e muda rápido: renderizar no servidor faz os lances
 * aparecerem no primeiro paint, e o cliente revalida em seguida (placar ao
 * vivo continua atualizando a cada 15 s).
 */
export const revalidate = 20

async function loadInitialMatch(id: string): Promise<MatchDetail | null> {
  try {
    const raw = await getUpstreamJson<ApiMatchDetails>(`/matches/${id}`, {
      revalidate: 15,
    })
    return mapApiMatchToMatchDetail(raw)
  } catch {
    // Partida arquivada/removida: o cliente trata o 404 e mostra o aviso.
    return null
  }
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const initialMatch = await loadInitialMatch(id)
  return <MatchDetailClient id={id} initialMatch={initialMatch} />
}
