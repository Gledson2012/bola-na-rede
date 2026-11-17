import { NextRequest, NextResponse } from "next/server"
import { signToken, registerSession } from "@/lib/auth"
import { checkRateLimit, clientKey } from "@/lib/rate-limit"
import { getUserIdByEmail, getUser, comparePassword } from "@/lib/auth"

export const dynamic = "force-dynamic"

interface LoginInput {
  email?: unknown
  password?: unknown
}

/** Limite: 10 tentativas de login por minuto por IP. */
const RATE_LIMIT = { limit: 10, windowSeconds: 60 }

export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(
    `auth-login:${clientKey(request.headers)}`,
    RATE_LIMIT.limit,
    RATE_LIMIT.windowSeconds
  )
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter || 60) } }
    )
  }

  let input: LoginInput
  try {
    input = (await request.json()) as LoginInput
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 })
  }

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : ""
  const password = typeof input.password === "string" ? input.password : ""

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 })
  }

  const userId = await getUserIdByEmail(email)
  if (!userId) {
    // Não revelar se o e-mail existe
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 })
  }

  const user = await getUser(userId)
  if (!user || !comparePassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 })
  }

  const token = signToken({ userId, email: user.email })
  await registerSession(token, userId)

  return NextResponse.json({
    user: { id: userId, email: user.email, name: user.name },
    token,
  })
}