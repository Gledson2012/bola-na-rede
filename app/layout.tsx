import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Providers } from "@/components/providers/Providers"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { OfflineBanner } from "@/components/OfflineBanner"

const SITE_URL =
  process.env.APP_PUBLIC_URL?.replace(/\/$/, "") ||
  "https://futebol-app-eight.vercel.app"

const SITE_TITLE = "Bola na Rede • Placares e Ligas do Mundo"
const SITE_DESCRIPTION =
  "Acompanhe todos os campeonatos, placares ao vivo, tabela e notícias de futebol."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Bola na Rede",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bola na Rede",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Bola na Rede",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Bola na Rede",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/icon-512.png"],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  colorScheme: "light dark",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="font-sans h-full bg-[#030712] text-slate-100 flex justify-center selection:bg-futebol-500/30 selection:text-futebol-400">
        <Providers>
          <ServiceWorkerRegistration />
          {/* Mobile-first modern phone frame container */}
          <div className="w-full max-w-lg min-h-[100dvh] flex flex-col bg-background text-foreground relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-border/40">
            <a
              href="#conteudo"
              className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-futebol-600 focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
            >
              Pular para o conteúdo
            </a>
            <Header />
            <OfflineBanner />
            <main
              id="conteudo"
              tabIndex={-1}
              className="flex-1 px-3 pb-24 pt-2 safe-area-bottom outline-none"
            >
              {children}
            </main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
