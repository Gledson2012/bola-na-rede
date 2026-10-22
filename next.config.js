/** @type {import('next').NextConfig} */

// Mesma variável de ambiente usada pelas rotas de servidor (app/api/*), para
// que exista uma única fonte de verdade sobre o upstream.
// Observação: o rewrite é resolvido no build — trocar a variável exige
// republicar a aplicação.
const upstreamApi =
  process.env.FUTEBOL_API_URL?.replace(/\/$/, "") ||
  "https://futebol-api-nine.vercel.app"

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // Subconjunto conservador de CSP: bloqueia enquadramento e plugins
          // sem arriscar os scripts inline que o Next injeta.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${upstreamApi}/:path*`,
      },
    ]
  },
  // Todas as imagens do app usam `unoptimized` (logos e capas vêm de hosts
  // variados, fora de uma allowlist estável). Desligar o otimizador global
  // reflete isso e fecha a superfície do endpoint /_next/image, que é o vetor
  // do advisory de DoS por `remotePatterns`.
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
