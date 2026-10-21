/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://futebol-api-nine.vercel.app/:path*",
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
