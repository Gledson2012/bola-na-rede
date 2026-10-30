"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Trophy, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLiveMatches } from "@/lib/queries"
import { SoccerBallIcon } from "@/components/icons/soccer-ball"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  live?: boolean
}

const navItems: NavItem[] = [
  { href: "/jogos", label: "Jogos", icon: SoccerBallIcon, live: true },
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <nav
        aria-label="Navegação principal"
        className="pointer-events-auto mx-auto w-full max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-1 rounded-[1.35rem] border border-border/80 bg-background/90 p-1.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {navItems.map((item) => {
            const isJogos = item.href === "/jogos"
            const isActive = isJogos
              ? pathname === "/jogos" || pathname === "/" || pathname.startsWith("/jogos/")
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "press relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[9px] font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" />
                  {item.live && liveCount > 0 && (
                    <span className="absolute -right-1.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-live px-0.5 text-[7px] font-black leading-none text-white ring-2 ring-background">
                      {liveCount > 9 ? "9+" : liveCount}
                    </span>
                  )}
                </span>
                <span className="leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
