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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
      <nav
        aria-label="Navegação principal"
        className="max-w-lg mx-auto p-1"
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
                  "flex flex-col items-center justify-center flex-1 py-3 px-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("w-5 h-5 mb-1", isActive ? "fill-primary/20" : "")} />
                <span className="leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}