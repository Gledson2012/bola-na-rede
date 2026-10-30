"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, Trophy, X, ChevronRight } from "lucide-react"
import { useLiveMatches, useCompetitions } from "@/lib/queries"
import { ALL_COMPETITIONS } from "@/lib/competitions"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: liveMatches = [] } = useLiveMatches()
  const { data: competitions = [] } = useCompetitions()
  const [leaguesOpen, setLeaguesOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const liveCount = liveMatches.length

  // Fecha com Escape, prende o foco no painel e trava a rolagem do fundo
  // enquanto a folha de ligas está aberta.
  useEffect(() => {
    if (!leaguesOpen) return

    const sheet = sheetRef.current
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusableElements = () =>
      Array.from(
        sheet?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.getClientRects().length > 0)

    focusableElements()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setLeaguesOpen(false)
        return
      }
      if (e.key !== "Tab") return

      const nodes = focusableElements()
      if (nodes.length === 0) {
        e.preventDefault()
        sheet?.focus()
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      const inside = !!sheet && !!active && sheet.contains(active)

      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
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
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-2xl border-b border-border/60">
        <div className="flex items-center justify-between px-3.5 py-2.5 safe-area-top">
          {/* Logo & App title */}
          <Link href="/jogos" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black">
              ⚽
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground block leading-none">
                Bola na Rede
              </span>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {liveCount > 0 ? `${liveCount} ao vivo` : "Placares"}
              </span>
            </div>
          </Link>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Quick Leagues Drawer Trigger */}
            <button
              onClick={() => setLeaguesOpen(true)}
              className="px-3 py-1.5 rounded-md hover:bg-accent text-xs font-medium text-foreground transition-colors"
              title="Ver ligas"
            >
              Ligas
            </button>

            {/* Search shortcut */}
            <button
              onClick={handleSearchClick}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Buscar"
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="leagues-sheet-title"
        >
          <div
            ref={sheetRef}
            tabIndex={-1}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-background border border-border p-4 space-y-4 shadow-sm outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 id="leagues-sheet-title" className="text-sm font-bold text-foreground">Campeonatos</h3>
              <button
                onClick={() => setLeaguesOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* All 14 Leagues List */}
            <div className="space-y-1">
              {ALL_COMPETITIONS.map((c) => {
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectLeague(c.id)}
                    className="w-full py-2 px-2 flex items-center justify-between rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span className="text-xs font-medium text-foreground">
                        {c.name}
                      </span>
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
