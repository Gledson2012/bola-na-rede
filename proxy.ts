import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, clientKey } from "@/lib/rate-limit"
import { extractToken, verifyToken } from "@/lib/auth"

/**
 * Proxy (Next.js 16) para adicionar headers de segurança e otimizações.
 *
 * Headers de segurança aplicados:
 * - HSTS: força HTTPS
 * - X-Content-Type-Options: previne MIME sniffing
 * - X-Frame-Options: previne clickjacking (DENY, consistente com next.config.js)
 * - X-XSS-Protection: proteção contra XSS (legacy)
 * - Referrer-Policy: controla informações do referrer
 * - Permissions-Policy: desabilita features não usadas
 *
 * Otimizações:
 * - Rate limit por IP nas chamadas à API upstream (via Redis; fail-open sem Redis)
 * - Proteção de rotas que exigem autenticação (ex.: /api/auth/favorites)
 * - Early hints para recursos críticos
 * - Preconnect para APIs externas
 */

/** Rotas que exigem autenticação via JWT (header Authorization: Bearer <token>). */
const AUTH_REQUIRED_ROUTES = ["/api/auth/favorites"]

/** Rotas de auth públicas que nunca exigem token. */
const AUTH_PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
]

/** Verifica se o caminho exige autenticação. */
function requiresAuth(path: string): boolean {
  return AUTH_REQUIRED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
}

/** Verifica se o caminho é uma rota pública de auth. */
function isAuthPublicRoute(path: string): boolean {
  return AUTH_PUBLIC_ROUTES.includes(path)
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Proteção de rotas que exigem autenticação
  if (requiresAuth(path) && !isAuthPublicRoute(path)) {
    const token = extractToken(request.headers.get("authorization"))
    if (!token) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 })
    }
  }

  // Rate limit apenas para chamadas à API upstream (/api/proxy/*)
  // Limite: 100 requisições por minuto por IP. Sem Redis, falha aberta (não bloqueia).
  if (path.startsWith("/api/proxy/")) {
    const rateLimitResult = await checkRateLimit(
      `proxy:${clientKey(request.headers)}`,
      100,
      60
    )

    if (rateLimitResult.limited) {
      return new NextResponse(
        JSON.stringify({ error: "Muitas solicitações. Tente novamente em instantes." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        }
      )
    }
  }

  const response = NextResponse.next()

  // Headers de segurança
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  )
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  )

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://futebol-api-nine.vercel.app https://api.openrouter.ai https://*.upstash.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
  response.headers.set("Content-Security-Policy", csp)

  // Cache control para diferentes tipos de rotas
  if (path.startsWith("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    )
  } else if (path.startsWith("/api/")) {
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate")
  } else if (path.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=31536000, stale-while-revalidate"
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
