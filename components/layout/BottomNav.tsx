"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Trophy, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLiveMatches } from "@/lib/queries"

function SoccerBallIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 8 8 11 9.5 15.5 14.5 15.5 16 11" fill="currentColor" opacity="0.25" />
      <polygon points="12 8 8 11 9.5 15.5 14.5 15.5 16 11" />
      <path d="M12 2v6" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l4.24 4.24" />
      <path d="M14.83 14.83l4.24 4.24" />
      <path d="M2 12h6" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l4.24-4.24" />
      <path d="M14.83 9.17l4.24-4.24" />
    </svg>
  )
}

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  showLiveBadge?: boolean
}

const navItems: NavItem[] = [
  { href: "/jogos", label: "Jogos", icon: SoccerBallIcon, showLiveBadge: true },
  { href: "/analise", label: "Análise", icon: BarChart3 },
  { href: "/times", label: "Times", icon: Users },
  { href: "/classificacao", label: "Tabela", icon: Trophy },
  { href: "/noticias", label: "Notícias", icon: Newspaper },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: liveMatches = [] } = useLiveMatches()
  const liveCount = liveMatches.length

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 max-w-lg mx-auto px-3 pointer-events-none">
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto rounded-3xl bg-background/85 dark:bg-card/90 backdrop-blur-2xl border border-border/80 shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-1.5 transition-all"
      >
        <div className="flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const isJogos = item.href === "/jogos"
            const isActive = isJogos
              ? pathname === "/jogos" || pathname === "/" || pathname.startsWith("/jogos")
              : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-2xl text-[11px] font-semibold transition-all duration-200 active:scale-90",
                  isActive
                    ? "bg-futebol-600 text-white shadow-lg shadow-futebol-600/35 ring-1 ring-futebol-400/30 font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative flex flex-col items-center">
                  <Icon className={cn("w-4 h-4 mb-0.5 transition-transform", isActive ? "text-white scale-110" : "text-muted-foreground")} />

                  {/* Live pulsating dot if live matches exist */}
                  {item.showLiveBadge && liveCount > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white" />
                    </span>
                  )}

                  <span className="leading-none tracking-tight">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}