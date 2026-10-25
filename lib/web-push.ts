import webpush, { type PushSubscription } from "web-push"
import {
  hasRedisConfiguration,
  listSubscriptionIds,
  redisCommand,
  redisMGet,
  subscriptionKey,
} from "@/lib/live-monitor-storage"

export interface StoredSubscription {
  endpoint: string
  expirationTime: number | null
  keys: { p256dh: string; auth: string }
}

export interface PushPayload {
  title: string
  body: string
  url: string
  tag?: string
  data?: Record<string, string>
}

export interface PushDeliveryResult {
  sent: number
  removed: number
  failed: number
  /** IDs das assinaturas que receberam a notificação. */
  sentIds: string[]
  /** IDs removidas por estarem expiradas (404/410). */
  removedIds: string[]
  /** IDs que falharam temporariamente e podem ser tentadas de novo. */
  failedIds: string[]
}

/** Quantidade de envios simultâneos ao provedor de push. */
const SEND_CONCURRENCY = 20
/** Quantidade de chaves lidas por MGET. */
const MGET_BATCH = 100
/**
 * Validade do registro de assinatura.
 *
 * O navegador renova a inscrição ao abrir o app; sem TTL, inscrições
 * abandonadas (ou criadas em massa) ficariam no Redis para sempre.
 */
export const SUBSCRIPTION_TTL_SECONDS = 90 * 24 * 60 * 60

export function hasPushConfiguration(): boolean {
  return Boolean(
    hasRedisConfiguration() &&
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )
}

export function getPublicVapidKey(): string | null {
  return hasPushConfiguration() ? process.env.VAPID_PUBLIC_KEY ?? null : null
}

export async function saveSubscription(
  subscription: StoredSubscription
): Promise<void> {
  const id = subscriptionKey(subscription.endpoint)
  await redisCommand([
    "SET",
    `live-monitor:subscription:${id}`,
    JSON.stringify(subscription),
    "EX",
    SUBSCRIPTION_TTL_SECONDS,
  ])
  await redisCommand(["SADD", "live-monitor:subscriptions", id])
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const id = subscriptionKey(endpoint)
  await redisCommand(["DEL", `live-monitor:subscription:${id}`])
  await redisCommand(["SREM", "live-monitor:subscriptions", id])
}

/**
 * Carrega as assinaturas uma única vez por execução do monitor.
 *
 * Antes, cada partida com evento novo relia todas as assinaturas do Redis, o
 * que multiplicava as requisições pelo número de partidas. Agora o monitor
 * carrega uma vez e reutiliza.
 */
export async function loadSubscriptions(): Promise<
  Map<string, StoredSubscription>
> {
  const ids = await listSubscriptionIds()
  const subscriptions = new Map<string, StoredSubscription>()

  for (let start = 0; start < ids.length; start += MGET_BATCH) {
    const batch = ids.slice(start, start + MGET_BATCH)
    const values = await redisMGet<string>(batch.map((id) => `live-monitor:subscription:${id}`))

    batch.forEach((id, index) => {
      const value = values[index]
      if (!value) {
        // Assinatura sem registro: limpa o índice órfão.
        void redisCommand(["SREM", "live-monitor:subscriptions", id])
        return
      }
      try {
        subscriptions.set(id, JSON.parse(value) as StoredSubscription)
      } catch {
        void redisCommand(["SREM", "live-monitor:subscriptions", id])
      }
    })
  }

  return subscriptions
}

/**
 * Envia a notificação para todas as assinaturas carregadas.
 *
 * Assinaturas expiradas (404/410) são removidas; falhas temporárias contam
 * como falha e não apagam a assinatura.
 */
export async function sendPushToSubscribers(
  payload: PushPayload,
  subscriptions: Map<string, StoredSubscription>
): Promise<PushDeliveryResult> {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!hasRedisConfiguration() || !publicKey || !privateKey || !subject) {
    throw new Error(
      "Configure Redis, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT"
    )
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)

  const entries = Array.from(subscriptions.entries())
  const sentIds: string[] = []
  const removedIds: string[] = []
  const failedIds: string[] = []

  for (let start = 0; start < entries.length; start += SEND_CONCURRENCY) {
    const batch = entries.slice(start, start + SEND_CONCURRENCY)

    const outcomes = await Promise.all(
      batch.map(async ([id, subscription]) => {
        try {
          await webpush.sendNotification(
            subscription as PushSubscription,
            JSON.stringify(payload),
            { TTL: 300, urgency: "high" }
          )
          return { id, status: "sent" as const }
        } catch (error) {
          const statusCode =
            typeof error === "object" && error !== null && "statusCode" in error
              ? Number(error.statusCode)
              : 0
          if (statusCode === 404 || statusCode === 410) {
            try {
              await removeSubscription(subscription.endpoint)
            } catch (removalError) {
              console.error(`[push] falha ao remover assinatura ${id}:`, removalError)
            }
            return { id, status: "removed" as const }
          }
          console.error(`[push] falha ao enviar notificação ${id}:`, error)
          return { id, status: "failed" as const }
        }
      })
    )

    for (const { id, status } of outcomes) {
      if (status === "sent") sentIds.push(id)
      else if (status === "removed") removedIds.push(id)
      else failedIds.push(id)
    }
  }

  return {
    sent: sentIds.length,
    removed: removedIds.length,
    failed: failedIds.length,
    sentIds,
    removedIds,
    failedIds,
  }
}
