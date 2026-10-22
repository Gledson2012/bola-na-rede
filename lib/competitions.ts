export type ZoneColor = "emerald" | "futebol" | "amber" | "red" | "sky" | "slate"

export interface CompetitionZone {
  /** Posição inicial (inclusive). */
  from: number
  /** Posição final (inclusive). */
  to: number
  label: string
  color: ZoneColor
}

export interface CompetitionMeta {
  id: string
  name: string
  shortName: string
  country: string
  continent: "América do Sul" | "Europa" | "América do Norte" | "Internacional"
  flag: string
  color: string
  totalTeams?: number
  format?: "league" | "tournament"
  /**
   * Faixas da tabela (classificação continental, rebaixamento, playoffs).
   * Definidas por competição porque cada liga tem um formato diferente —
   * a mesma faixa verde não significa a mesma coisa em toda parte.
   */
  zones?: CompetitionZone[]
}

export const ZONE_STYLES: Record<
  ZoneColor,
  { badge: string; border: string; dot: string; text: string }
> = {
  emerald: {
    badge: "bg-emerald-600 text-white font-bold",
    border: "border-l-emerald-500 bg-emerald-500/[0.04]",
    dot: "bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  futebol: {
    badge: "bg-futebol-600 text-white font-bold",
    border: "border-l-futebol-500 bg-futebol-500/[0.03]",
    dot: "bg-futebol-600",
    text: "text-futebol-700 dark:text-futebol-400",
  },
  amber: {
    badge: "bg-amber-500 text-white font-bold",
    border: "border-l-amber-500 bg-amber-500/[0.03]",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  sky: {
    badge: "bg-sky-600 text-white font-bold",
    border: "border-l-sky-500 bg-sky-500/[0.03]",
    dot: "bg-sky-600",
    text: "text-sky-700 dark:text-sky-400",
  },
  red: {
    badge: "bg-red-600 text-white font-bold",
    border: "border-l-red-500 bg-red-500/[0.04]",
    dot: "bg-red-600",
    text: "text-red-700 dark:text-red-400",
  },
  slate: {
    badge: "bg-slate-600 text-white font-bold",
    border: "border-l-slate-400 bg-slate-500/[0.03]",
    dot: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
  },
}

export const ALL_COMPETITIONS: CompetitionMeta[] = [
  {
    id: "bra.1",
    name: "Brasileirão Série A",
    shortName: "Brasileirão",
    country: "Brasil",
    continent: "América do Sul",
    flag: "🇧🇷",
    color: "#16a34a",
    totalTeams: 20,
    format: "league",
    zones: [
      { from: 1, to: 4, label: "Libertadores", color: "emerald" },
      { from: 5, to: 6, label: "Sul-Americana", color: "futebol" },
      { from: 7, to: 8, label: "Série D", color: "slate" },
      { from: 17, to: 20, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "bra.2",
    name: "Brasileirão Série B",
    shortName: "Série B",
    country: "Brasil",
    continent: "América do Sul",
    flag: "🇧🇷",
    color: "#16a34a",
    totalTeams: 20,
    format: "league",
    zones: [
      { from: 1, to: 4, label: "Sul-Americana", color: "emerald" },
      { from: 17, to: 20, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "uefa.champions",
    name: "Liga dos Campeões",
    shortName: "Liga dos Campeões",
    country: "Europa",
    continent: "Europa",
    flag: "🇪🇺",
    color: "#1e3a8a",
    totalTeams: 36,
    format: "tournament",
    zones: [
      { from: 1, to: 8, label: "R16 direta", color: "emerald" },
      { from: 9, to: 24, label: "Playoff", color: "amber" },
      { from: 25, to: 36, label: "Eliminado", color: "slate" },
    ],
  },
  {
    id: "eng.1",
    name: "Premier League",
    shortName: "Premier League",
    country: "Inglaterra",
    continent: "Europa",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    color: "#7c3aed",
    totalTeams: 20,
    format: "league",
    zones: [
      { from: 1, to: 4, label: "Champions League", color: "emerald" },
      { from: 5, to: 6, label: "Europa League", color: "futebol" },
      { from: 7, to: 8, label: "Conference League", color: "sky" },
      { from: 18, to: 20, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "eng.2",
    name: "Championship",
    shortName: "Championship",
    country: "Inglaterra",
    continent: "Europa",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    color: "#7c3aed",
    totalTeams: 24,
    format: "league",
    zones: [
      { from: 1, to: 2, label: "Champions League", color: "emerald" },
      { from: 3, to: 4, label: "Europa League", color: "futebol" },
      { from: 5, to: 6, label: "Conference League", color: "sky" },
      { from: 21, to: 24, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "esp.1",
    name: "La Liga",
    shortName: "La Liga",
    country: "Espanha",
    continent: "Europa",
    flag: "🇪🇸",
    color: "#ea580c",
    totalTeams: 20,
    format: "league",
    zones: [
      { from: 1, to: 4, label: "Champions League", color: "emerald" },
      { from: 5, to: 6, label: "Europa League", color: "futebol" },
      { from: 18, to: 20, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "conmebol.libertadores",
    name: "Copa Libertadores",
    shortName: "Libertadores",
    country: "América do Sul",
    continent: "América do Sul",
    flag: "🌎",
    color: "#ca8a04",
    totalTeams: 32,
    format: "tournament",
    zones: [
      { from: 1, to: 16, label: "R16", color: "emerald" },
      { from: 17, to: 24, label: "Playoff", color: "amber" },
      { from: 25, to: 32, label: "Eliminado", color: "slate" },
    ],
  },
  {
    id: "ita.1",
    name: "Serie A Italiana",
    shortName: "Serie A",
    country: "Itália",
    continent: "Europa",
    flag: "🇮🇹",
    color: "#0284c7",
    totalTeams: 20,
    format: "league",
    zones: [
      { from: 1, to: 4, label: "Champions League", color: "emerald" },
      { from: 5, to: 6, label: "Europa League", color: "futebol" },
      { from: 18, to: 20, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "ger.1",
    name: "Bundesliga",
    shortName: "Bundesliga",
    country: "Alemanha",
    continent: "Europa",
    flag: "🇩🇪",
    color: "#dc2626",
    totalTeams: 18,
    format: "league",
    zones: [
      { from: 1, to: 4, label: "Champions League", color: "emerald" },
      { from: 5, to: 6, label: "Europa League", color: "futebol" },
      { from: 16, to: 18, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "conmebol.sudamericana",
    name: "Copa Sul-Americana",
    shortName: "Sul-Americana",
    country: "América do Sul",
    continent: "América do Sul",
    flag: "🌎",
    color: "#d97706",
    totalTeams: 32,
    format: "tournament",
    zones: [
      { from: 1, to: 16, label: "R16", color: "emerald" },
      { from: 17, to: 24, label: "Playoff", color: "amber" },
      { from: 25, to: 32, label: "Eliminado", color: "slate" },
    ],
  },
  {
    id: "fra.1",
    name: "Ligue 1",
    shortName: "Ligue 1",
    country: "França",
    continent: "Europa",
    flag: "🇫🇷",
    color: "#0891b2",
    totalTeams: 18,
    format: "league",
    zones: [
      { from: 1, to: 3, label: "Champions League", color: "emerald" },
      { from: 4, to: 6, label: "Europa League", color: "futebol" },
      { from: 16, to: 18, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "uefa.europa",
    name: "Liga Europa",
    shortName: "Liga Europa",
    country: "Europa",
    continent: "Europa",
    flag: "🇪🇺",
    color: "#ea580c",
    totalTeams: 36,
    format: "tournament",
    zones: [
      { from: 1, to: 8, label: "R16 direta", color: "emerald" },
      { from: 9, to: 24, label: "Playoff", color: "amber" },
      { from: 25, to: 36, label: "Eliminado", color: "slate" },
    ],
  },
  {
    id: "uefa.europa.conf",
    name: "Liga Conferência",
    shortName: "Liga Conferência",
    country: "Europa",
    continent: "Europa",
    flag: "🇪🇺",
    color: "#0d9488",
    totalTeams: 36,
    format: "tournament",
    zones: [
      { from: 1, to: 8, label: "R16 direta", color: "emerald" },
      { from: 9, to: 24, label: "Playoff", color: "amber" },
      { from: 25, to: 36, label: "Eliminado", color: "slate" },
    ],
  },
  {
    id: "por.1",
    name: "Liga Portugal",
    shortName: "Liga Portugal",
    country: "Portugal",
    continent: "Europa",
    flag: "🇵🇹",
    color: "#059669",
    totalTeams: 18,
    format: "league",
    zones: [
      { from: 1, to: 2, label: "Champions League", color: "emerald" },
      { from: 3, to: 4, label: "Europa League", color: "futebol" },
      { from: 16, to: 18, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "ned.1",
    name: "Eredivisie",
    shortName: "Eredivisie",
    country: "Holanda",
    continent: "Europa",
    flag: "🇳🇱",
    color: "#f97316",
    totalTeams: 18,
    format: "league",
    zones: [
      { from: 1, to: 2, label: "Champions League", color: "emerald" },
      { from: 3, to: 3, label: "Europa League", color: "futebol" },
      { from: 4, to: 4, label: "Playoff", color: "amber" },
      { from: 16, to: 18, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "mex.1",
    name: "Liga MX",
    shortName: "Liga MX",
    country: "México",
    continent: "América do Norte",
    flag: "🇲🇽",
    color: "#16a34a",
    totalTeams: 18,
    format: "league",
    zones: [{ from: 1, to: 6, label: "Liguilla", color: "emerald" }],
  },
  {
    id: "arg.1",
    name: "Liga Argentina",
    shortName: "Liga Argentina",
    country: "Argentina",
    continent: "América do Sul",
    flag: "🇦🇷",
    color: "#0284c7",
    totalTeams: 30,
    format: "league",
    zones: [
      { from: 1, to: 2, label: "Libertadores", color: "emerald" },
      { from: 3, to: 6, label: "Sudamericana", color: "futebol" },
      { from: 28, to: 30, label: "Rebaixamento", color: "red" },
    ],
  },
  {
    id: "usa.1",
    name: "MLS",
    shortName: "MLS",
    country: "Estados Unidos",
    continent: "América do Norte",
    flag: "🇺🇸",
    color: "#2563eb",
    totalTeams: 30,
    format: "league",
    zones: [{ from: 1, to: 8, label: "Playoffs", color: "emerald" }],
  },
  {
    id: "ksa.1",
    name: "Liga Saudita",
    shortName: "Liga Saudita",
    country: "Arábia Saudita",
    continent: "Internacional",
    flag: "🇸🇦",
    color: "#0ea5e9",
    totalTeams: 18,
    format: "league",
  },
]

/** Faixa que contém a posição informada, se houver. */
export function getZoneForPosition(
  zones: CompetitionZone[] | undefined,
  position: number
): CompetitionZone | undefined {
  if (!zones) return undefined
  return zones.find((zone) => position >= zone.from && position <= zone.to)
}

export function getCompetitionMeta(idOrName?: string): CompetitionMeta {
  if (!idOrName) {
    return {
      id: "unknown",
      name: "Futebol",
      shortName: "Futebol",
      country: "Internacional",
      continent: "Internacional",
      flag: "🏆",
      color: "#0ea5e9",
    }
  }

  const normalized = idOrName.toLowerCase().trim()
  const found = ALL_COMPETITIONS.find(
    (c) =>
      c.id.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.shortName.toLowerCase() === normalized
  )

  if (found) return found

  // Partial matches
  if (normalized.includes("brasil") || normalized.includes("bra.1")) return ALL_COMPETITIONS[0]
  if (
    normalized.includes("champion") ||
    normalized.includes("campeões") ||
    normalized.includes("campeoes") ||
    normalized.includes("uefa.champions")
  ) {
    return ALL_COMPETITIONS.find((c) => c.id === "uefa.champions")!
  }
  if (normalized.includes("premier") || normalized.includes("eng.1") || normalized.includes("inglaterra")) return ALL_COMPETITIONS.find((c) => c.id === "eng.1")!
  if (normalized.includes("liga") && normalized.includes("espanh") || normalized.includes("esp.1") || normalized.includes("la liga")) return ALL_COMPETITIONS.find((c) => c.id === "esp.1")!
  if (normalized.includes("libertadores") || normalized.includes("conmebol.libertadores")) return ALL_COMPETITIONS.find((c) => c.id === "conmebol.libertadores")!
  if (normalized.includes("italia") || normalized.includes("ita.1") || normalized.includes("serie a")) return ALL_COMPETITIONS.find((c) => c.id === "ita.1")!
  if (normalized.includes("bundesliga") || normalized.includes("ger.1") || normalized.includes("alemanha")) return ALL_COMPETITIONS.find((c) => c.id === "ger.1")!
  if (normalized.includes("sudamericana") || normalized.includes("sul-americana")) return ALL_COMPETITIONS.find((c) => c.id === "conmebol.sudamericana")!
  if (normalized.includes("frança") || normalized.includes("fra.1") || normalized.includes("ligue 1")) return ALL_COMPETITIONS.find((c) => c.id === "fra.1")!
  if (
    normalized.includes("conference") ||
    normalized.includes("conferência") ||
    normalized.includes("conferencia") ||
    normalized.includes("uefa.europa.conf")
  ) {
    return ALL_COMPETITIONS.find((c) => c.id === "uefa.europa.conf")!
  }
  if (
    normalized.includes("europa league") ||
    normalized.includes("liga europa") ||
    normalized.includes("uefa.europa")
  ) {
    return ALL_COMPETITIONS.find((c) => c.id === "uefa.europa")!
  }
  if (
    normalized.includes("saudi") ||
    normalized.includes("saudita") ||
    normalized.includes("ksa.1")
  ) {
    return ALL_COMPETITIONS.find((c) => c.id === "ksa.1")!
  }
  if (normalized.includes("portugal") || normalized.includes("por.1")) return ALL_COMPETITIONS.find((c) => c.id === "por.1")!
  if (normalized.includes("mex") || normalized.includes("mex.1")) return ALL_COMPETITIONS.find((c) => c.id === "mex.1")!
  if (normalized.includes("arg") || normalized.includes("arg.1") || normalized.includes("argentin")) return ALL_COMPETITIONS.find((c) => c.id === "arg.1")!
  if (normalized.includes("usa") || normalized.includes("usa.1") || normalized.includes("mls")) return ALL_COMPETITIONS.find((c) => c.id === "usa.1")!

  return {
    id: idOrName,
    name: idOrName,
    shortName: idOrName,
    country: "Internacional",
    continent: "Internacional",
    flag: "🏆",
    color: "#0ea5e9",
  }
}
