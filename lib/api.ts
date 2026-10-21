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

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json", ...init?.headers },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`)
  return res.json()
}

// Tipos internos da API (conforme OpenAPI)
export interface ApiMatchDetails extends ApiMatch {
  events?: ApiMatchEvent[]
}

export interface ApiMatchEvent {
  id: string
  minute: number | null
  type: string
  team?: ApiTeam | null
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
  teams: () => fetchApi<ApiTeam[]>(`/teams`),
  teamDetails: (id: string) => fetchApi<any>(`/teams/${id}`),
  teamForm: (id: string, limit = 10) =>
    fetchApi<ApiMatch[]>(`/teams/${id}/form?limit=${limit}`),
  teamNext: (id: string) => fetchApi<ApiMatch | null>(`/teams/${id}/next`),
  teamLast: (id: string) => fetchApi<ApiMatch | null>(`/teams/${id}/last`),
  teamStats: (id: string) => fetchApi<any>(`/teams/${id}/stats`),

  matchesToday: () => fetchApi<ApiMatch[]>(`/matches/today`),
  matchesLive: () => fetchApi<ApiMatch[]>(`/matches/live`),
  matchesGlobal: () => fetchApi<ApiMatch[]>(`/matches/global`),
  matchById: (id: string) => fetchApi<ApiMatchDetails>(`/matches/${id}`),

  competitions: () => fetchApi<any[]>(`/competitions`),
  competitionTable: (id: string) =>
    fetchApi<ApiStanding[]>(`/competitions/${id}/table`),

  news: () => fetchApi<ApiNews[]>(`/news`),
  newsCategories: () => fetchApi<any[]>(`/news/categories`),
}

// Mapeadores da API para os tipos internos do app

export function mapApiTeamToTeam(t: any): Team {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName || (t.name ? t.name.slice(0, 3).toUpperCase() : ""),
    logo: t.logo || t.badge || "https://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png",
    primaryColor: t.color || "#0ea5e9",
    secondaryColor: t.color || "#0369a1",
    matchesToday: t.matchesToday ?? 0,
    liveMatches: t.liveMatches ?? 0,
    description: t.description || undefined,
    founded: t.founded || undefined,
    badge: t.badge || undefined,
    venue: t.venue || undefined,
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
    homeTeam: mapApiTeamToTeam(m.home as any),
    awayTeam: mapApiTeamToTeam(m.away as any),
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

export function mapApiMatchToMatchDetail(m: any): MatchDetail {
  const match = mapApiMatchToMatch(m)
  const events: MatchEvent[] = (m.events || []).map((e: any) => ({
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
  const readTime = Math.ceil((n.summary?.split(" ").length || 100) / 200) + " min"
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
