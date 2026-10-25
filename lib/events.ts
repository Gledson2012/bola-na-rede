/**
 * Classificação única dos lances da partida.
 *
 * Antes cada consumidor lia `event.type` do seu jeito: o modelo ao vivo e os
 * alertas da análise em `prediction.ts`, e o monitor de push em
 * `app/api/live-monitor`. As leituras divergiam — e `"scored".includes("red")`
 * fazia um pênalti convertido ser contado como cartão vermelho (o push chegava
 * a anunciar "Cartão vermelho" em um gol). Aqui está a única fonte de verdade.
 */

export type MatchEventKind =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_missed"
  | "penalty_saved"
  | "penalty_awarded"
  | "red_card"
  | "other"

/** Normaliza para comparar sem acento, caixa ou pontuação. */
function normalizeEventType(type?: string | null): string {
  return (type ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/**
 * Compara por palavra inteira.
 *
 * `includes("red")` casaria com "scored" e `includes("goal")` com
 * "goalkeeper"; comparar tokens evita esses falsos positivos.
 */
function hasWord(value: string, word: string): boolean {
  return value.split(" ").includes(word)
}

function isPenalty(value: string): boolean {
  return value.split(" ").some((token) => token.startsWith("penalt"))
}

/**
 * Classifica o tipo do lance. Aceita os textos em inglês da API e variações
 * já em português, com ou sem acento.
 */
export function classifyEvent(type?: string | null): MatchEventKind {
  const value = normalizeEventType(type)
  if (!value) return "other"

  if (hasWord(value, "red") || hasWord(value, "vermelho")) return "red_card"
  if (value.includes("own goal") || value.includes("gol contra")) return "own_goal"

  if (isPenalty(value)) {
    if (hasWord(value, "missed") || hasWord(value, "perdido") || hasWord(value, "perdida")) {
      return "penalty_missed"
    }
    if (hasWord(value, "saved") || hasWord(value, "defendido") || hasWord(value, "defendida")) {
      return "penalty_saved"
    }
    // "Penalty - Scored" na API; "Gol de pênalti" se a fonte já vier em pt-BR.
    if (
      hasWord(value, "scored") ||
      hasWord(value, "convertido") ||
      hasWord(value, "converted") ||
      hasWord(value, "gol")
    ) {
      return "penalty_goal"
    }
    // Pênalti apenas marcado: NÃO é gol. É o que evita o falso positivo no push.
    return "penalty_awarded"
  }

  if (hasWord(value, "goal") || hasWord(value, "gol")) return "goal"
  return "other"
}

/** Gols de fato (inclui contra e de pênalti; exclui pênalti só marcado/perdido). */
export function isGoalEvent(kind: MatchEventKind): boolean {
  return kind === "goal" || kind === "own_goal" || kind === "penalty_goal"
}

/** Lances de pênalti em qualquer desfecho. */
export function isPenaltyEvent(kind: MatchEventKind): boolean {
  return (
    kind === "penalty_goal" ||
    kind === "penalty_missed" ||
    kind === "penalty_saved" ||
    kind === "penalty_awarded"
  )
}

/** Lances que valem notificação push: gols, pênaltis e expulsões. */
export function isMonitorableEvent(kind: MatchEventKind): boolean {
  return kind !== "other"
}

/** Rótulo curto do lance, sem jogador/time/minuto. */
export function eventLabel(kind: MatchEventKind): string {
  switch (kind) {
    case "goal":
      return "Gol"
    case "own_goal":
      return "Gol contra"
    case "penalty_goal":
      return "Gol de pênalti"
    case "penalty_missed":
      return "Pênalti perdido"
    case "penalty_saved":
      return "Pênalti defendido"
    case "penalty_awarded":
      return "Pênalti marcado"
    case "red_card":
      return "Cartão vermelho"
    default:
      return ""
  }
}

export interface EventDescriptionInput {
  player?: string | null
  team?: string | null
  minute?: number | null
}

/** Frase completa do lance: "Gol de pênalti de Fulano (Time) aos 30'". */
export function describeEvent(
  kind: MatchEventKind,
  { player, team, minute }: EventDescriptionInput = {}
): string {
  const label = eventLabel(kind)
  if (!label) return ""

  const athlete = player?.trim()
  const club = team?.trim()
  // Preposições diferentes por tipo, para a frase não ficar estranha.
  const preposition =
    kind === "penalty_missed" || kind === "penalty_saved"
      ? " por "
      : kind === "red_card" || kind === "penalty_awarded"
        ? " para "
        : " de "

  const who = athlete ? `${preposition}${athlete}` : ""
  const where = club ? ` (${club})` : ""
  const when = minute != null ? ` aos ${minute}'` : ""

  return `${label}${who}${where}${when}`
}
