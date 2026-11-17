import { NextRequest, NextResponse } from "next/server"
import { extractToken, verifyToken, getUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get("authorization"))
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 })
  }

  const user = await getUser(payload.userId)
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 401 })
  }

  return NextResponse.json({
    user: { id: payload.userId, email: user.email, name: user.name },
  })
}