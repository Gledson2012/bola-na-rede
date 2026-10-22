import type {
  ApiTeam,
  ApiMatch,
  ApiNews,
  Team,
  Match,
  MatchDetail,
  MatchEvent,
  News,
  Standing,
} from "@/types"

const API_BASE = "/api/proxy"
const REQUEST_TIMEOUT_MS = 15_000

/**
 * `fetch` com timeout.
 *
 * Sem isso, uma conexão móvel instável deixava a tela presa no skeleton para
 * sempre (o WebView não cancela a requisição sozinho). O sinal externo, quando
 * existir, também é respeitado.
 */
export function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort(
      new DOMException("A requisição excedeu o tempo limite.", "TimeoutError")
    )
  }, timeoutMs)

  const externalSignal = init.signal
  const forwardAbort = () => controller.abort(externalSignal?.reason)
  externalSignal?.addEventListener("abort", forwardAbort, { once: true })

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer)
    externalSignal?.removeEventListener("abort", forwardAbort)
  })
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError"
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetchWithTimeout(`${API_BASE}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      cache: "no-store",
    })
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(
        "A conexão demorou demais. Verifique sua internet e tente novamente."
      )
    }
    throw error
  }

  if (!res.ok) {
    // A API upstream devolve `{ code, message }`; a mensagem ajuda a distinguir
    // "partida encerrada não está mais disponível" de uma falha real.
    let detail = ""
    try {
      const body = (await res.json()) as { message?: unknown }
      if (typeof body.message === "string" && body.message.trim()) {
        detail = ` — ${body.message.trim()}`
      }
    } catch {
      // Corpo não-JSON: mantém a mensagem padrão.
    }
    throw new Error(`API error: ${res.status}${detail}`)
  }

  try {
    return (await res.json()) as T
  } catch {
    throw new Error("A resposta do servidor não pôde ser lida.")
  }
}

// Tipos internos da API (conforme OpenAPI)
export interface ApiMatchDetails extends ApiMatch {
  events?: ApiMatchEvent[]
}

/** Shape parcial do time no upstream: nem todos os campos vêm em todas as rotas. */
export interface ApiTeamLike {
  id?: string
  name?: string
  shortName?: string
  logo?: string
  badge?: string
  color?: string
  matchesToday?: number
  liveMatches?: number
  description?: string
  founded?: number | string
  venue?: unknown
}

export interface ApiMatchEvent {
  id: string
  minute: number | null
  type: string
  team?: ApiTeamLike | null
  player: string | null
  detail: string | null
}

export interface ApiStanding {
  position: number
  team: ApiTeam
  played: number | null
  wins: number | null
  draws: number | null
  losses: number | null
  goalsFor: number | null
  goalsAgainst: number | null
  goalDifference: number | null
  points: number | null
  form?: string | null
}

export const api = {
  teams: () => fetchApi<ApiTeamLike[]>("/teams"),
  teamDetails: (id: string) => fetchApi<ApiTeamLike>(`/teams/${id}`),
  teamForm: (id: string, limit = 10) =>
    fetchApi<ApiMatch[]>(`/teams/${id}/form?limit=${limit}`),
  teamNext: (id: string) => fetchApi<ApiMatch | null>(`/teams/${id}/next`),
  teamLast: (id: string) => fetchApi<ApiMatch | null>(`/teams/${id}/last`),
  teamStats: (id: string) => fetchApi<unknown>(`/teams/${id}/stats`),

  matchesToday: () => fetchApi<ApiMatch[]>("/matches/today"),
  matchesLive: () => fetchApi<ApiMatch[]>("/matches/live"),
  matchesGlobal: () => fetchApi<ApiMatch[]>("/matches/global"),
  matchById: (id: string) => fetchApi<ApiMatchDetails>(`/matches/${id}`),

  competitions: () => fetchApi<CompetitionDto[]>("/competitions"),
  competitionTable: (id: string) =>
    fetchApi<ApiStanding[]>(`/competitions/${id}/table`),

  news: () => fetchApi<ApiNews[]>("/news"),
  newsCategories: () => fetchApi<NewsCategoryDto[]>("/news/categories"),
}

export interface CompetitionDto {
  id?: string
  name?: string
  shortName?: string
  totalMatches?: number
  liveMatches?: number
  upcomingMatches?: number
  finishedMatches?: number
}

export interface NewsCategoryDto {
  id?: string
  name?: string
  slug?: string
}

// Mapeadores da API para os tipos internos do app

function parseVenue(value: unknown): Team["venue"] {
  if (!value || typeof value !== "object") return undefined
  const venue = value as { name?: unknown; city?: unknown; capacity?: unknown }
  return {
    name: typeof venue.name === "string" ? venue.name : undefined,
    city: typeof venue.city === "string" ? venue.city : undefined,
    capacity: typeof venue.capacity === "number" ? venue.capacity : undefined,
  }
}

export function mapApiTeamToTeam(t: ApiTeamLike): Team {
  return {
    id: t.id ?? "",
    name: t.name ?? "",
    shortName: t.shortName || (t.name ? t.name.slice(0, 3).toUpperCase() : ""),
    logo: t.logo || t.badge || "https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png",
    primaryColor: t.color || "#0ea5e9",
    secondaryColor: t.color || "#0369a1",
    matchesToday: t.matchesToday ?? 0,
    liveMatches: t.liveMatches ?? 0,
    description: t.description || undefined,
    founded: typeof t.founded === "number" ? t.founded : undefined,
    badge: t.badge || undefined,
    venue: parseVenue(t.venue),
  }
}

/**
 * The upstream API only exposes a kickoff time ("15:00"), not a full date.
 * We build an ISO value for the current day so time formatting/sorting works,
 * but the UI must not treat it as a reliable calendar date.
 */
function buildMatchDate(kickoff?: string): string {
  const today = new Date()
  if (!kickoff) return today.toISOString()
  const [hours, minutes] = kickoff.split(":").map(Number)
  const matchDate = new Date(today)
  matchDate.setHours(isNaN(hours) ? 12 : hours, isNaN(minutes) ? 0 : minutes, 0, 0)
  return matchDate.toISOString()
}

/**
 * The API reports the current match minute in SECONDS (e.g. 3060),
 * while match events already use real minutes.
 */
function toMatchMinute(seconds?: number | null): number | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null
  return Math.floor(seconds / 60)
}

export function mapApiMatchToMatch(m: ApiMatch): Match {
  return {
    id: m.id,
    homeTeam: mapApiTeamToTeam(m.home),
    awayTeam: mapApiTeamToTeam(m.away),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    minute: toMatchMinute(m.minute),
    date: buildMatchDate(m.kickoff),
    competition: m.competition,
    competitionCountry: m.competitionCountry,
    competitionId: m.competitionId,
    venue: m.venue,
    kickoff: m.kickoff,
  }
}

export function mapApiMatchToMatchDetail(m: ApiMatchDetails): MatchDetail {
  const match = mapApiMatchToMatch(m)
  const events: MatchEvent[] = (m.events || []).map((e) => ({
    id: e.id,
    minute: e.minute,
    type: e.type,
    team: e.team ? mapApiTeamToTeam(e.team) : null,
    player: e.player,
    detail: e.detail,
  }))
  return {
    ...match,
    events,
  }
}

export function mapApiNewsToNews(n: ApiNews): News {
  const excerpt = n.summary || n.title
  const image = n.image || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80"
  const date = new Date(n.publishedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  // O tempo de leitura usa o texto mais longo disponível: o conteúdo integral
  // quando a fonte fornece, senão o resumo.
  const words = (n.content || n.summary || "").split(/\s+/).filter(Boolean).length
  const readTime = `${Math.max(1, Math.ceil(words / 200))} min`
  return {
    id: n.id,
    title: n.title,
    excerpt,
    image,
    category: n.category || "Futebol",
    date,
    readTime,
    url: n.url,
    provider: n.provider || "Notícias",
    publishedAt: n.publishedAt,
    content: n.content ?? null,
  }
}

export function mapApiStandingToStanding(s: ApiStanding): Standing {
  return {
    position: s.position,
    team: mapApiTeamToTeam(s.team),
    played: s.played ?? 0,
    won: s.wins ?? 0,
    drawn: s.draws ?? 0,
    lost: s.losses ?? 0,
    goalsFor: s.goalsFor ?? 0,
    goalsAgainst: s.goalsAgainst ?? 0,
    goalDifference: s.goalDifference ?? 0,
    points: s.points ?? 0,
    form: parseFormString(s.form),
  }
}

/** The API returns form as a string like "WWDLW". */
function parseFormString(form?: string | null): ("W" | "D" | "L")[] {
  if (!form || typeof form !== "string") return []
  return form
    .toUpperCase()
    .split("")
    .filter((c): c is "W" | "D" | "L" => c === "W" || c === "D" || c === "L")
}
