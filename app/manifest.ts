import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FutebolApp • Placares e Ligas do Mundo",
    short_name: "FutebolApp",
    description:
      "Acompanhe campeonatos, placares ao vivo, classificações e notícias de futebol.",
    start_url: "/jogos",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0284c7",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  }
}
