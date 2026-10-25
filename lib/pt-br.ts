/**
 * Tradução dos textos que a API entrega em inglês.
 *
 * Nomes próprios (times, jogadores, estádios, marcas) não são traduzidos — só
 * competições, países, categorias de notícia e os lances da partida.
 */

import { classifyEvent } from "@/lib/events"

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const COMPETITION_NAMES: Record<string, string> = {
  "champions league": "Liga dos Campeões",
  "uefa champions league": "Liga dos Campeões",
  "europa league": "Liga Europa",
  "uefa europa league": "Liga Europa",
  "conference league": "Liga Conferência",
  "uefa conference league": "Liga Conferência",
  "uefa europa conference league": "Liga Conferência",
  "saudi pro league": "Liga Saudita",
  "saudi league": "Liga Saudita",
  "english premier league": "Premier League",
  "epl": "Premier League",
  "spanish la liga": "La Liga",
  "laliga": "La Liga",
  "italian serie a": "Série A Italiana",
  "german bundesliga": "Bundesliga",
  "french ligue 1": "Ligue 1",
  "portuguese primeira liga": "Primeira Liga",
  "liga portugal": "Liga Portugal",
  "dutch eredivisie": "Eredivisie",
  "uefa nations league": "Liga das Nações da UEFA",
  "fifa world cup": "Copa do Mundo",
  "world cup": "Copa do Mundo",
  "club world cup": "Mundial de Clubes",
  "uefa euro": "Eurocopa",
  "european championship": "Eurocopa",
  "fa cup": "Copa da Inglaterra",
  "efl cup": "Copa da Liga Inglesa",
  "carabao cup": "Copa da Liga Inglesa",
  "league cup": "Copa da Liga Inglesa",
  "copa del rey": "Copa do Rei",
  "copa sudamericana": "Copa Sul-Americana",
  "recopa sudamericana": "Recopa Sul-Americana",
  "afc champions league": "Liga dos Campeões da Ásia",
  "caf champions league": "Liga dos Campeões da África",
  "concacaf champions league": "Liga dos Campeões da Concacaf",
  "uefa super cup": "Supercopa da UEFA",
  "international friendly": "Amistoso internacional",
  "friendlies": "Amistosos",
}

const COUNTRY_NAMES: Record<string, string> = {
  brazil: "Brasil",
  england: "Inglaterra",
  spain: "Espanha",
  germany: "Alemanha",
  france: "França",
  italy: "Itália",
  portugal: "Portugal",
  netherlands: "Países Baixos",
  belgium: "Bélgica",
  scotland: "Escócia",
  turkey: "Turquia",
  greece: "Grécia",
  russia: "Rússia",
  ukraine: "Ucrânia",
  argentina: "Argentina",
  mexico: "México",
  usa: "Estados Unidos",
  "united states": "Estados Unidos",
  canada: "Canadá",
  colombia: "Colômbia",
  uruguay: "Uruguai",
  chile: "Chile",
  paraguay: "Paraguai",
  ecuador: "Equador",
  peru: "Peru",
  bolivia: "Bolívia",
  venezuela: "Venezuela",
  "saudi arabia": "Arábia Saudita",
  qatar: "Catar",
  "united arab emirates": "Emirados Árabes Unidos",
  japan: "Japão",
  "south korea": "Coreia do Sul",
  china: "China",
  australia: "Austrália",
  morocco: "Marrocos",
  egypt: "Egito",
  europe: "Europa",
  world: "Mundo",
  international: "Internacional",
}

const EVENT_TYPES: Record<string, string> = {
  goal: "Gol",
  "own goal": "Gol contra",
  "penalty scored": "Gol de pênalti",
  "penalty scored goal": "Gol de pênalti",
  "penalty missed": "Pênalti perdido",
  "penalty saved": "Pênalti defendido",
  penalty: "Pênalti",
  "yellow card": "Cartão amarelo",
  "red card": "Cartão vermelho",
  "second yellow card": "Segundo amarelo (expulsão)",
  "yellow red card": "Segundo amarelo (expulsão)",
  substitution: "Substituição",
  var: "VAR",
  "var decision": "Decisão do VAR",
  "kick off": "Início do jogo",
  "half time": "Intervalo",
  "full time": "Fim de jogo",
  offside: "Impedimento",
  corner: "Escanteio",
  foul: "Falta",
  "shot on target": "Finalização certa",
  "shot off target": "Finalização errada",
  assist: "Assistência",
  injury: "Lesão",
  delay: "Atraso",
}

const NEWS_CATEGORIES: Record<string, string> = {
  general: "Geral",
  football: "Futebol",
  soccer: "Futebol",
  sports: "Esportes",
  transfers: "Transferências",
  transfer: "Transferências",
  world: "Mundo",
  "world football": "Futebol mundial",
  "world cup": "Copa do Mundo",
  "premier league": "Premier League",
  "la liga": "La Liga",
  "serie a": "Série A",
  "champions league": "Liga dos Campeões",
}

export function localizeCompetition(name?: string | null): string {
  if (!name) return ""
  return COMPETITION_NAMES[normalize(name)] ?? name.trim()
}

export function localizeCountry(name?: string | null): string {
  if (!name) return ""
  return COUNTRY_NAMES[normalize(name)] ?? name.trim()
}

export function localizeNewsCategory(category?: string | null): string {
  if (!category) return "Futebol"
  return NEWS_CATEGORIES[normalize(category)] ?? category.trim()
}

/** Rótulo em português para o tipo de lance. */
export function localizeEventType(type?: string | null): string {
  if (!type) return ""

  const key = normalize(type)
  if (EVENT_TYPES[key]) return EVENT_TYPES[key]

  // A fonte às vezes acrescenta detalhe no próprio tipo ("Goal - Header").
  const prefix = Object.keys(EVENT_TYPES)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => key.startsWith(`${candidate} `))

  return prefix ? EVENT_TYPES[prefix] : type.trim()
}

export type MatchEventKind = "goal" | "ownGoal" | "red" | "yellow" | "sub" | "other"

/** Classificação visual do lance (cor/ícone), aceitando o texto em EN ou PT. */
export function eventKind(type?: string | null): MatchEventKind {
  const value = normalize(type ?? "")
  const kind = classifyEvent(type)

  // A classificação de domínio decide gols, pênaltis e expulsões; aqui só
  // traduzimos para os estilos visuais que a interface conhece.
  if (kind === "own_goal") return "ownGoal"
  if (kind === "red_card") return "red"
  if (kind === "goal" || kind === "penalty_goal" || kind === "penalty_awarded") {
    return "goal"
  }
  // Pênalti perdido/defendido não é gol.
  if (kind === "penalty_missed" || kind === "penalty_saved") return "other"

  if (value.includes("segundo amarelo") || value.includes("second yellow")) {
    return "red"
  }
  if (
    value.includes("yellow") ||
    value.includes("amarelo") ||
    value.includes("cartao")
  ) {
    return "yellow"
  }
  if (
    value.includes("substitution") ||
    value.includes("substitui") ||
    value === "sub"
  ) {
    return "sub"
  }
  return "other"
}

/**
 * Devolve o detalhe do lance em português, ou `null` quando ele só repete o
 * tipo/jogador que a interface já mostra (ex.: "Fulano (Time) Goal at 17'").
 */
export function localizeEventDetail(
  detail?: string | null,
  type?: string | null
): string | null {
  const raw = detail?.trim()
  if (!raw) return null

  const generated = raw.match(/^(.*?)\s*\((.*?)\)\s*(.+?)\s+at\s+(\d+)'?$/i)
  if (generated) {
    const describedType = generated[3]
    if (type && normalize(describedType) === normalize(type)) return null
    return `${localizeEventType(describedType)} aos ${generated[4]}'`
  }

  return raw
    .replace(/\bassist(?:ed by)?\b\s*:?/gi, "Assistência:")
    .replace(/\bown goal\b/gi, "Gol contra")
    .replace(/\byellow card\b/gi, "Cartão amarelo")
    .replace(/\bred card\b/gi, "Cartão vermelho")
    .replace(/\bsubstitution\b/gi, "Substituição")
    .replace(/\bpenalty\b/gi, "Pênalti")
    .replace(/\s{2,}/g, " ")
    .trim()
}
