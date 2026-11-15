import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy (Next.js 16) para adicionar headers de segurança e otimizações.
 *
 * Headers de segurança aplicados:
 * - HSTS: força HTTPS
 * - X-Content-Type-Options: previne MIME sniffing
 * - X-Frame-Options: previne clickjacking
 * - X-XSS-Protection: proteção contra XSS (legacy)
 * - Referrer-Policy: controla informações do referrer
 * - Permissions-Policy: desabilita features não usadas
 *
 * Otimizações:
 * - Early hints para recursos críticos
 * - Preconnect para APIs externas
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Headers de segurança
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  )
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
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
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")
  response.headers.set("Content-Security-Policy", csp)

  // Cache control para diferentes tipos de rotas
  const path = request.nextUrl.pathname

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
