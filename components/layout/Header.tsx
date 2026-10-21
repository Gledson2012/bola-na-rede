"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, Trophy, X, ChevronRight, Globe, Radio } from "lucide-react"
import { useLiveMatches, useCompetitions } from "@/lib/queries"
import { ALL_COMPETITIONS } from "@/lib/competitions"
import { cn } from "@/lib/utils"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: liveMatches = [] } = useLiveMatches()
  const { data: competitions = [] } = useCompetitions()
  const [leaguesOpen, setLeaguesOpen] = useState(false)

  const liveCount = liveMatches.length

  // Close the leagues sheet with Escape and lock page scroll while open
  useEffect(() => {
    if (!leaguesOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLeaguesOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [leaguesOpen])

  const handleSearchClick = () => {
    if (pathname === "/jogos") {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement | null
      searchInput?.focus()
    } else {
      router.push("/jogos")
    }
  }

  const handleSelectLeague = (leagueId: string) => {
    setLeaguesOpen(false)
    router.push(`/classificacao?league=${leagueId}`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-xl border-b border-border/80">
        <div className="flex items-center justify-between px-3.5 py-2.5 safe-area-top">
          {/* Logo & App title */}
          <Link href="/jogos" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-futebol-700 via-futebol-600 to-futebol-500 flex items-center justify-center shadow-md shadow-futebol-600/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">⚽</span>
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-foreground block leading-none">
                Futebol<span className="text-futebol-600">App</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-tight">
                {liveCount > 0 ? `${liveCount} ao vivo` : "Central de Ligas"}
              </span>
            </div>
          </Link>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Quick Leagues Drawer Trigger */}
            <button
              onClick={() => setLeaguesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-xs font-bold text-foreground border border-border/80 transition-all active:scale-95"
              title="Ver todos os campeonatos e ligas"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span className="hidden sm:inline">Todas as Ligas</span>
              <span className="sm:hidden">Ligas</span>
            </button>

            {/* Live Indicator */}
            {liveCount > 0 && (
              <Link
                href="/jogos"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black animate-pulse"
                title="Ver partidas ao vivo"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>{liveCount}</span>
              </Link>
            )}

            {/* Search shortcut */}
            <button
              onClick={handleSearchClick}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              aria-label="Buscar partidas"
              title="Buscar (tecla F)"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Quick All Leagues Modal Sheet */}
      {leaguesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setLeaguesOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background border border-border p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/15 text-yellow-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Todos os Campeonatos & Ligas</h3>
                  <p className="text-[11px] text-muted-foreground">14 ligas mundiais disponíveis com tabela e classificação</p>
                </div>
              </div>

              <button
                onClick={() => setLeaguesOpen(false)}
                className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* All 14 Leagues List */}
            <div className="space-y-1.5 divide-y divide-border/50">
              {ALL_COMPETITIONS.map((c) => {
                const liveComp = competitions.find((lc) => lc.id === c.id)
                const hasMatches = (liveComp?.totalMatches ?? 0) > 0

                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectLeague(c.id)}
                    className="w-full py-2.5 px-3 flex items-center justify-between rounded-xl hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{c.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground group-hover:text-futebol-600 transition-colors">
                            {c.name}
                          </span>
                          {hasMatches && (
                            <span className="px-1.5 py-0.2 rounded-md bg-futebol-50 dark:bg-futebol-950/60 text-futebol-600 text-[10px] font-bold">
                              {liveComp?.totalMatches} jogos hoje
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {c.country} • {c.continent}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-futebol-600 font-semibold">
                      <span>Ver Tabela</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
