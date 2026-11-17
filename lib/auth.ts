/**
 * Autenticação baseada em JWT para o Bola na Rede.
 *
 * Gera e valida tokens de acesso usando a biblioteca nativa `jsonwebtoken`
 * (via `node:crypto` para evitar dependência extra). O token contém o id do
 * usuário e expira em 7 dias. As sessões ativas são rastreadas no Redis para
 * permitir revogação (logout) e sincronização de favoritos entre dispositivos.
 */

import { sign, verify, type JwtPayload } from "jsonwebtoken"
import { randomBytes, timingSafeEqual, pbkdf2Sync } from "node:crypto"
import { hasRedisConfiguration, redisCommand } from "@/lib/live-monitor-storage"

export const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"
export const JWT_EXPIRES_IN = "7d"

export interface TokenPayload {
  userId: string
  email: string
}

/** Gera um hash PBKDF2 da senha com salt aleatório. Retorna "salt:hash". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha256").toString("hex")
  return `${salt}:${hash}`
}

/** Compara uma senha pura com um hash "salt:hash". */
export function comparePassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const computed = pbkdf2Sync(password, salt, 100_000, 64, "sha256").toString("hex")
  return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"))
}

/** Dados do usuário salvos no Redis (inclui senha hasheada). */
export interface StoredUser {
  email: string
  name: string
  passwordHash: string
}

/** Gera um JWT assinado para o usuário. */
export function signToken(payload: TokenPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/** Valida um JWT e devolve o payload, ou null se inválido/expirado. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload & TokenPayload
    return { userId: decoded.userId, email: decoded.email }
  } catch {
    return null
  }
}

/** Chave Redis para os dados do usuário. */
export function userKey(userId: string): string {
  return `auth:user:${userId}`
}

/** Chave Redis para o índice de e-mail -> userId. */
export function emailKey(email: string): string {
  return `auth:email:${email.toLowerCase()}`
}

/** Chave Redis para o token de sessão ativo. */
export function sessionKey(token: string): string {
  return `auth:session:${token}`
}

/** Salva os dados do usuário no Redis com TTL de 7 dias. */
export async function saveUser(userId: string, data: StoredUser): Promise<void> {
  if (!hasRedisConfiguration()) return
  await redisCommand(["SET", userKey(userId), JSON.stringify(data), "EX", 7 * 24 * 60 * 60])
  await redisCommand(["SET", emailKey(data.email), userId, "EX", 7 * 24 * 60 * 60])
}

/** Busca os dados do usuário pelo ID no Redis. */
export async function getUser(userId: string): Promise<StoredUser | null> {
  if (!hasRedisConfiguration()) return null
  const raw = await redisCommand<string | null>(["GET", userKey(userId)])
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

/** Busca o userId pelo e-mail. */
export async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!hasRedisConfiguration()) return null
  return redisCommand<string | null>(["GET", emailKey(email)])
}

/** Registra uma sessão ativa no Redis (para logout e detecção de dispositivo). */
export async function registerSession(token: string, userId: string): Promise<void> {
  if (!hasRedisConfiguration()) return
  await redisCommand(["SET", sessionKey(token), userId, "EX", 7 * 24 * 60 * 60])
}

/** Remove uma sessão ativa (logout). */
export async function removeSession(token: string): Promise<void> {
  if (!hasRedisConfiguration()) return
  await redisCommand(["DEL", sessionKey(token)])
}

/** Extrai o token do header Authorization: Bearer <token>. */
export function extractToken(authorization?: string | null): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}