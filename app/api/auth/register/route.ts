import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import {
  signToken,
  saveUser,
  registerSession,
  getUserIdByEmail,
  hashPassword,
} from "@/lib/auth"
import { checkRateLimit, clientKey } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

interface RegisterInput {
  email?: unknown
  name?: unknown
  password?: unknown
}

/** Limite: 5 cadastros por minuto por IP. */
const RATE_LIMIT = { limit: 5, windowSeconds: 60 }

export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(
    `auth-register:${clientKey(request.headers)}`,
    RATE_LIMIT.limit,
    RATE_LIMIT.windowSeconds
  )
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter || 60) } }
    )
  }

  let input: RegisterInput
  try {
    input = (await request.json()) as RegisterInput
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 })
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : ""
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const password = typeof input.password === "string" ? input.password : ""

  if (!email || !name || !password) {
    return NextResponse.json({ error: "E-mail, nome e senha são obrigatórios." }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 })
  }

  const existingUserId = await getUserIdByEmail(email)
  if (existingUserId) {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 })
  }

  const userId = randomUUID()

  try {
    await saveUser(userId, { email, name, passwordHash: hashPassword(password) })
    const token = signToken({ userId, email })
    await registerSession(token, userId)

    return NextResponse.json(
      {
        user: { id: userId, email, name },
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[auth/register] falha ao criar usuário:", error)
    return NextResponse.json({ error: "Não foi possível criar o usuário." }, { status: 502 })
  }
}