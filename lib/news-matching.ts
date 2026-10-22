import type { Match, News, NewsWithMatches, RelatedMatch } from "@/types"

/**
 * Vinculação entre notícias e partidas.
 *
 * A API de notícias é geral (não tem parâmetro de time ou de jogo), então a
 * relação é descoberta por texto: o nome do time aparece no título ou no
 * resumo da matéria. A comparação ignora acentos e maiúsculas e respeita
 * limites de palavra, para não casar "Bahia" dentro de outra palavra.
 */

/** Remove acentos, pontuação e prefixos de clubes, deixando só as palavras. */
export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(clube de|clube|clube athletic|ec|sc|fc|cf|ac|sa|sl|ss|as|cd|calcio)\s+/g, "")
    .replace(/\s+(futebol|football|calcio)$/g, "")
    .trim()
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Nomes muito curtos geram falsos positivos (ex.: "Cor" em "coração"). */
const MIN_NAME_LENGTH = 4

export function teamAppearsInText(teamName: string, text: string): boolean {
  const normalizedName = normalizeTeamName(teamName)
  if (normalizedName.length < MIN_NAME_LENGTH) return false

  const pattern = new RegExp(
    `(^|\\s)${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`
  )
  return pattern.test(text)
}

export function toRelatedMatch(match: Match): RelatedMatch {
  return {
    id: match.id,
    label: `${match.homeTeam.shortName} x ${match.awayTeam.shortName}`,
    competition: match.competition,
    status: match.status,
    kickoff: match.kickoff,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName,
      logo: match.homeTeam.logo,
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName,
      logo: match.awayTeam.logo,
    },
  }
}

/**
 * Devolve as notícias com as partidas correspondentes e, separadamente, a
 * lista de partidas que têm ao menos uma notícia.
 */
export function linkNewsToMatches(
  news: News[],
  matches: Match[]
): { news: NewsWithMatches[]; matches: RelatedMatch[] } {
  const linked: NewsWithMatches[] = news.map((item) => {
    const text = normalizeText(
      [item.title, item.excerpt, item.content ?? ""].join(" ")
    )

    const related = matches
      .filter((match) => {
        return (
          teamAppearsInText(match.homeTeam.name, text) ||
          teamAppearsInText(match.awayTeam.name, text)
        )
      })
      .map(toRelatedMatch)

    return { ...item, relatedMatches: related }
  })

  const withNews = new Set<string>()
  for (const item of linked) {
    for (const match of item.relatedMatches) withNews.add(match.id)
  }

  return {
    news: linked,
    matches: matches.filter((match) => withNews.has(match.id)).map(toRelatedMatch),
  }
}

/** Notícias que mencionam algum dos times da partida. */
export function newsForMatch(
  news: NewsWithMatches[],
  match: RelatedMatch
): NewsWithMatches[] {
  const teamIds = new Set([match.homeTeam.id, match.awayTeam.id])
  return news.filter((item) =>
    item.relatedMatches.some(
      (related) =>
        related.id === match.id ||
        teamIds.has(related.homeTeam.id) ||
        teamIds.has(related.awayTeam.id)
    )
  )
}
