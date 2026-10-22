import type { ApiNews, News } from "@/types"
import { mapApiNewsToNews } from "@/lib/api"
import { getUpstreamJson } from "@/lib/upstream"
import NoticiasClient from "./NoticiasClient"

/** Notícias mudam menos que os placares: 2 minutos de cache de rota bastam. */
export const revalidate = 120

async function loadInitialNews(): Promise<News[]> {
  try {
    const data = await getUpstreamJson<ApiNews[]>("/news", { revalidate })
    return data.map(mapApiNewsToNews)
  } catch {
    // Sem dados no build/render: o cliente busca novamente ao montar.
    return []
  }
}

export default async function NoticiasPage() {
  const initialNews = await loadInitialNews()
  return <NoticiasClient initialNews={initialNews} />
}
