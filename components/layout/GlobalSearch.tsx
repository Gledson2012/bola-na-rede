"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { useTeams } from "@/lib/queries"
import { cn } from "@/lib/utils"

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: teams = [] } = useTeams()

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return teams.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 8)
  }, [teams, query])

  const go = (id: string) => {
    setOpen(false)
    setQuery("")
    router.push(`/times/${id}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Buscar time"
      >
        <Search className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar time..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Buscar time"
              />
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                aria-label="Fechar busca"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query.trim() === "" ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Digite o nome de um time para buscar.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhum time encontrado.
                </p>
              ) : (
                <ul className="space-y-1">
                  {results.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => go(t.id)}
                        className={cn(
                          "press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent"
                        )}
                      >
                        <span className="text-sm font-semibold text-foreground">{t.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}