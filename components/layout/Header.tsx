"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, X, ChevronRight, Trophy } from "lucide-react"
import { useLiveMatches } from "@/lib/queries"
import { ALL_COMPETITIONS } from "@/lib/competitions"
import { SoccerBallIcon } from "@/components/icons/soccer-ball"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: liveMatches = [] } = useLiveMatches()
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
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 safe-area-top">
          <Link href="/jogos" className="group flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[0.8rem] bg-primary text-primary-foreground shadow-sm transition-transform group-active:scale-95">
              <SoccerBallIcon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-black leading-none tracking-tight text-foreground">
                Bola na Rede
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold leading-none text-muted-foreground">
                {liveCount > 0 ? (
                  <>
                    <span className="live-dot h-1.5 w-1.5" />
                    {liveCount} {liveCount === 1 ? "jogo ao vivo" : "jogos ao vivo"}
                  </>
                ) : (
                  "Placares do dia"
                )}
              </span>
            </span>
          </Link>

          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              onClick={() => setLeaguesOpen(true)}
              className="press inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 text-[11px] font-bold text-foreground transition-colors hover:border-primary/30"
              aria-label="Ver campeonatos"
            >
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span>Ligas</span>
            </button>

            <button
              onClick={handleSearchClick}
              className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {leaguesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4"
          onClick={() => setLeaguesOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="leagues-sheet-title"
        >
          <div
            ref={sheetRef}
            tabIndex={-1}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.6rem] border border-border bg-background shadow-2xl outline-none animate-in slide-in-from-bottom-4 duration-200 sm:rounded-[1.6rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div>
                <h2 id="leagues-sheet-title" className="text-sm font-black text-foreground">
                  Campeonatos
                </h2>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Escolha uma liga para ver a classificação
                </p>
              </div>
              <button
                onClick={() => setLeaguesOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-2">
              {ALL_COMPETITIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectLeague(c.id)}
                  className="press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                    {c.flag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-foreground">{c.name}</span>
                    <span className="block text-[10px] text-muted-foreground">{c.country}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
