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
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${upstreamApi}/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s2-ge.glbimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "static.gazetaesportiva.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.torcedores.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagsapi.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "crus.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
}

module.exports = nextConfig
