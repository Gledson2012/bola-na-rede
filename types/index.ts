export type MatchStatus = "upcoming" | "live" | "finished"

export interface ApiTeam {
  id: string
  name: string
  shortName: string
  color: string
  logo: string
  matchesToday: number
  liveMatches: number
}

export interface ApiMatch {
  id: string
  competition: string
  competitionCountry: string
  competitionId: string
  kickoff: string
  status: MatchStatus
  minute: number
  home: {
    id: string
    name: string
    shortName: string
    color: string
    logo: string
  }
  away: {
    id: string
    name: string
    shortName: string
    color: string
    logo: string
  }
  homeScore: number | null
  awayScore: number | null
  venue: string | null
  weather: any
}

export interface ApiNews {
  id: string
  title: string
  summary: string
  content: string | null
  url: string
  image: string | null
  provider: string
  category: string
  publishedAt: string
}

export interface Team {
  id: string
  name: string
  shortName: string
  logo: string
  primaryColor: string
  secondaryColor: string
  matchesToday?: number
  liveMatches?: number
  description?: string
  founded?: number
  badge?: string
  venue?: {
    name?: string | null
    city?: string | null
    capacity?: number | null
  } | null
  points?: number
  position?: number
  /** Sigla da competição a que o clube pertence (opcional). */
  competition?: string
  /** Forma recente ("W"/"D"/"L"), quando a fonte fornecer. */
  form?: ("W" | "D" | "L")[]
  won?: number
  lost?: number
}

export interface Match {
  id: string
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  status: MatchStatus
  minute: number | null
  date: string
  competition: string
  competitionLogo?: string
  competitionCountry?: string
  competitionId?: string
  venue?: string | null
  kickoff?: string
}

export interface Standing {
  position: number
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: ("W" | "D" | "L")[]
}

export interface MatchEvent {
  id: string
  minute: number | null
  type: string
  team: Team | null
  player: string | null
  detail: string | null
}

export interface MatchDetail extends Match {
  events: MatchEvent[]
}

export interface News {
  id: string
  title: string
  excerpt: string
  image: string
  category: string
  date: string
  readTime: string
  url?: string
  provider?: string
  /** Data real de publicação (ISO 8601). */
  publishedAt?: string
  /** Texto integral quando a fonte fornece; pode ser nulo. */
  content?: string | null
}

export type Tab = "jogos" | "times" | "classificacao" | "noticias"

/** Partida resumida, usada para vincular notícias a jogos. */
export interface RelatedMatch {
  id: string
  label: string
  competition: string
  status: MatchStatus
  kickoff?: string
  homeTeam: { id: string; name: string; shortName: string; logo: string }
  awayTeam: { id: string; name: string; shortName: string; logo: string }
}

/** Notícia com as partidas às quais ela se refere. */
export interface NewsWithMatches extends News {
  relatedMatches: RelatedMatch[]
}
