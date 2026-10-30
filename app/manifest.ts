import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bola na Rede • Placares e Ligas do Mundo",
    short_name: "Bola na Rede",
    description:
      "Acompanhe campeonatos, placares ao vivo, classificações e notícias de futebol.",
    start_url: "/jogos",
    display: "standalone",
    background_color: "#f4f8f6",
    theme_color: "#0d7a53",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
