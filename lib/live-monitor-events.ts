/**
 * Snapshot de entrega do monitor ao vivo.
 *
 * O monitor precisa saber, por evento, quais assinaturas já receberam a
 * notificação. Antes o snapshot guardava só "evento confirmado" e o reenvio era
 * tudo-ou-nada: se um único aparelho falhasse, todos os outros recebiam o mesmo
 * gol de novo (até três vezes). Aqui a confirmação é por assinatura.
 *
 * "Confirmado" significa que o evento não deve mais ser reenviado — inclusive
 * para quem assinar depois, que não deve receber gols antigos.
 */

export interface StoredEventDelivery {
  /** IDs (hash) das assinaturas que já receberam o evento. */
  delivered: string[]
  /** Tentativas feitas enquanto ainda há assinaturas pendentes. */
  attempts: number
  /** Não reenviar, mesmo que surjam novas assinaturas. */
  confirmed: boolean
}

export interface MonitorSnapshot {
  events: Record<string, StoredEventDelivery>
  updatedAt: string
}

export interface MonitorEventLike {
  id: string
}

export interface DeliveryGroup {
  /** Assinaturas que ainda não receberam nenhum dos eventos do grupo. */
  recipients: string[]
  eventIds: string[]
}

export interface DeliveryPlan {
  groups: DeliveryGroup[]
  /** Eventos sem destinatários ou com tentativas esgotadas: só confirmar. */
  settledEventIds: string[]
}

export interface DeliveryOutcome {
  sentIds: string[]
  removedIds: string[]
  failedIds: string[]
}

/** Quantas vezes um evento pode ser reenviado antes de ser descartado. */
export const MAX_DELIVERY_ATTEMPTS = 3

export function emptySnapshot(): MonitorSnapshot {
  return { events: {}, updatedAt: new Date().toISOString() }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))
  )
}

function normalizeEvent(value: unknown): StoredEventDelivery {
  const record = isRecord(value) ? value : {}
  const attempts = Number(record.attempts)

  return {
    delivered: stringIds(record.delivered),
    attempts: Number.isFinite(attempts) && attempts > 0 ? Math.floor(attempts) : 0,
    confirmed: record.confirmed === true,
  }
}

/**
 * Lê o snapshot salvo, migrando o formato antigo (`eventIds` + `attempts`).
 * Qualquer valor inválido vira snapshot vazio em vez de derrubar o monitor.
 */
export function parseSnapshot(raw: string | null): MonitorSnapshot {
  if (!raw) return emptySnapshot()

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return emptySnapshot()
  }
  if (!isRecord(parsed)) return emptySnapshot()

  const updatedAt =
    typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()

  // Formato atual.
  if (isRecord(parsed.events)) {
    const events: Record<string, StoredEventDelivery> = {}
    for (const [id, value] of Object.entries(parsed.events)) {
      if (id) events[id] = normalizeEvent(value)
    }
    return { events, updatedAt }
  }

  // Formato antigo: eventos confirmados + tentativas por evento.
  const events: Record<string, StoredEventDelivery> = {}
  for (const id of stringIds(parsed.eventIds)) {
    events[id] = { delivered: [], attempts: 0, confirmed: true }
  }
  if (isRecord(parsed.attempts)) {
    for (const [id, value] of Object.entries(parsed.attempts)) {
      if (!id || events[id]) continue
      const attempts = Number(value)
      events[id] = {
        delivered: [],
        attempts: Number.isFinite(attempts) && attempts > 0 ? Math.floor(attempts) : 0,
        confirmed: false,
      }
    }
  }

  return { events, updatedAt }
}

export function serializeSnapshot(snapshot: MonitorSnapshot): string {
  return JSON.stringify(snapshot)
}

/**
 * Agrupa os eventos pendentes pelas assinaturas que ainda precisam recebê-los.
 *
 * Na maioria das execuções todos os eventos têm o mesmo conjunto de
 * destinatários e viram um único push. Quando uma entrega anterior falhou pela
 * metade, os grupos se separam e cada assinatura recebe só o que falta — sem
 * duplicar o que já chegou.
 */
export function planDeliveries(
  events: readonly MonitorEventLike[],
  snapshot: MonitorSnapshot,
  subscriptionIds: readonly string[],
  maxAttempts = MAX_DELIVERY_ATTEMPTS
): DeliveryPlan {
  const groups = new Map<string, DeliveryGroup>()
  const settledEventIds: string[] = []

  for (const event of events) {
    const stored = snapshot.events[event.id]
    if (stored?.confirmed) continue

    if ((stored?.attempts ?? 0) >= maxAttempts) {
      // Desiste: sem isso o evento ficaria eternamente no snapshot.
      settledEventIds.push(event.id)
      continue
    }

    const delivered = new Set(stored?.delivered ?? [])
    const recipients = subscriptionIds
      .filter((id) => !delivered.has(id))
      .sort()

    if (recipients.length === 0) {
      // Ninguém para notificar (já receberam ou não há assinantes).
      settledEventIds.push(event.id)
      continue
    }

    const key = recipients.join("|")
    const existing = groups.get(key)
    if (existing) existing.eventIds.push(event.id)
    else groups.set(key, { recipients, eventIds: [event.id] })
  }

  return { groups: Array.from(groups.values()), settledEventIds }
}

/**
 * Registra o resultado de um envio no snapshot.
 *
 * Assinaturas removidas (404/410) contam como entregues: não adianta tentar de
 * novo. Só incrementa tentativas quando sobrou alguma falha temporária.
 */
export function recordDelivery(
  snapshot: MonitorSnapshot,
  eventIds: readonly string[],
  outcome: DeliveryOutcome,
  now = new Date()
): MonitorSnapshot {
  const deliveredNow = [...outcome.sentIds, ...outcome.removedIds]
  const events = { ...snapshot.events }

  for (const id of eventIds) {
    const previous = events[id] ?? { delivered: [], attempts: 0, confirmed: false }
    events[id] = {
      delivered: Array.from(new Set([...previous.delivered, ...deliveredNow])),
      attempts:
        outcome.failedIds.length > 0 ? previous.attempts + 1 : previous.attempts,
      confirmed: outcome.failedIds.length === 0,
    }
  }

  return { events, updatedAt: now.toISOString() }
}
