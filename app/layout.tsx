import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Header } from "@/components/layout/Header"
import { BottomNav } from "@/components/layout/BottomNav"
import { Providers } from "@/components/providers/Providers"

export const metadata: Metadata = {
  title: "Bola na Rede • Placares e Ligas do Mundo",
  description: "Acompanhe todos os campeonatos, placares ao vivo, tabela e notícias de futebol.",
  applicationName: "Bola na Rede",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bola na Rede",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="font-sans h-full bg-slate-950 text-foreground flex justify-center">
        <Providers>
          {/* Mobile-first modern phone frame container */}
          <div className="w-full max-w-lg min-h-[100dvh] flex flex-col bg-background relative shadow-2xl overflow-x-hidden border-x border-border/40">
            <Header />
            <main className="flex-1 px-3 pb-24 pt-2 safe-area-bottom">{children}</main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
