import { NextRequest, NextResponse } from "next/server"
import { extractToken, verifyToken } from "@/lib/auth"
import { hasRedisConfiguration, redisCommand } from "@/lib/live-monitor-storage"

export const dynamic = "force-dynamic"

const FAVORITES_TTL_SECONDS = 7 * 24 * 60 * 60

/** Chave Redis para os favoritos de um usuário. */
function favoritesKey(userId: string): string {
  return `auth:favorites:${userId}`
}

/** Obtém o token do header Authorization. */
function getToken(request: NextRequest): string | null {
  return extractToken(request.headers.get("authorization"))
}

/** Valida o token e devolve o userId, ou um erro 401. */
async function authorize(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 })
  }
  return { userId: payload.userId }
}

export async function GET(request: NextRequest) {
  const auth = await authorize(request)
  if (auth instanceof NextResponse) return auth

  if (!hasRedisConfiguration()) {
    return NextResponse.json({ error: "Sincronização não disponível." }, { status: 503 })
  }

  try {
    const raw = await redisCommand<string | null>(["GET", favoritesKey(auth.userId)])
    if (!raw) {
      return NextResponse.json({ favorites: [], pinnedMatches: [], reminders: [], pinnedLeagues: [] })
    }
    const data = JSON.parse(raw) as {
      favorites?: string[]
      pinnedMatches?: string[]
      reminders?: string[]
      pinnedLeagues?: string[]
    }
    return NextResponse.json({
      favorites: data.favorites ?? [],
      pinnedMatches: data.pinnedMatches ?? [],
      reminders: data.reminders ?? [],
      pinnedLeagues: data.pinnedLeagues ?? [],
    })
  } catch {
    return NextResponse.json({ error: "Não foi carregar os favoritos." }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (auth instanceof NextResponse) return auth

  if (!hasRedisConfiguration()) {
    return NextResponse.json({ error: "Sincronização não disponível." }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 })
  }

  const { favorites, pinnedMatches, reminders, pinnedLeagues } = body as {
    favorites?: string[]
    pinnedMatches?: string[]
    reminders?: string[]
    pinnedLeagues?: string[]
  }

  const payload = JSON.stringify({
    favorites: Array.isArray(favorites) ? favorites : [],
    pinnedMatches: Array.isArray(pinnedMatches) ? pinnedMatches : [],
    reminders: Array.isArray(reminders) ? reminders : [],
    pinnedLeagues: Array.isArray(pinnedLeagues) ? pinnedLeagues : [],
  })

  try {
    await redisCommand([
      "SET",
      favoritesKey(auth.userId),
      payload,
      "EX",
      FAVORITES_TTL_SECONDS,
    ])
    return NextResponse.json({ saved: true })
  } catch {
    return NextResponse.json({ error: "Não foi possível salvar os favoritos." }, { status: 502 })
  }
}