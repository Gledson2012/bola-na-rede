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
  },
  {
    id: "uefa.champions",
    name: "Champions League",
    shortName: "Champions",
    country: "Europa",
    continent: "Europa",
    flag: "🇪🇺",
    color: "#1e3a8a",
    totalTeams: 36,
    format: "tournament",
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
  },
  {
    id: "uefa.europa",
    name: "Europa League",
    shortName: "Europa League",
    country: "Europa",
    continent: "Europa",
    flag: "🇪🇺",
    color: "#ea580c",
    totalTeams: 36,
    format: "tournament",
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
  },
]

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
  if (normalized.includes("champion") || normalized.includes("uefa.champions")) return ALL_COMPETITIONS[1]
  if (normalized.includes("premier") || normalized.includes("eng.1") || normalized.includes("inglaterra")) return ALL_COMPETITIONS[2]
  if (normalized.includes("liga") && normalized.includes("espanh") || normalized.includes("esp.1") || normalized.includes("la liga")) return ALL_COMPETITIONS[3]
  if (normalized.includes("libertadores") || normalized.includes("conmebol.libertadores")) return ALL_COMPETITIONS[4]
  if (normalized.includes("italia") || normalized.includes("ita.1") || normalized.includes("serie a")) return ALL_COMPETITIONS[5]
  if (normalized.includes("bundesliga") || normalized.includes("ger.1") || normalized.includes("alemanha")) return ALL_COMPETITIONS[6]
  if (normalized.includes("sudamericana") || normalized.includes("sul-americana")) return ALL_COMPETITIONS[7]
  if (normalized.includes("frança") || normalized.includes("fra.1") || normalized.includes("ligue 1")) return ALL_COMPETITIONS[8]
  if (normalized.includes("europa league") || normalized.includes("uefa.europa")) return ALL_COMPETITIONS[9]
  if (normalized.includes("portugal") || normalized.includes("por.1")) return ALL_COMPETITIONS[10]
  if (normalized.includes("mex") || normalized.includes("mex.1")) return ALL_COMPETITIONS[11]
  if (normalized.includes("arg") || normalized.includes("arg.1") || normalized.includes("argentin")) return ALL_COMPETITIONS[12]
  if (normalized.includes("usa") || normalized.includes("usa.1") || normalized.includes("mls")) return ALL_COMPETITIONS[13]

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
