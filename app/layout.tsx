import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Providers } from "@/components/providers/Providers"
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration"
import { OfflineBanner } from "@/components/OfflineBanner"
import { GoalMonitor } from "@/components/futebol/GoalMonitor"

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
    { media: "(prefers-color-scheme: light)", color: "#f4f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#08100d" },
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
      <body className="font-sans h-full bg-background text-foreground flex justify-center selection:bg-primary/20 selection:text-primary">
        <Providers>
          <ServiceWorkerRegistration />
          <div className="relative flex min-h-[100dvh] w-full max-w-lg flex-col overflow-x-clip">
            <a
              href="#conteudo"
              className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-primary-foreground"
            >
              Pular para o conteúdo
            </a>
            <Header />
            <OfflineBanner />
            <main
              id="conteudo"
              tabIndex={-1}
              className="safe-area-bottom flex-1 px-4 pt-1 outline-none"
            >
              {children}
            </main>
            <GoalMonitor />
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
