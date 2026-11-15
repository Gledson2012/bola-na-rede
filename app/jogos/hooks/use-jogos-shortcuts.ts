import { useEffect, type RefObject } from "react"
import type { FilterStatus } from "./use-jogos-filter"

interface UseJogosShortcutsParams {
  refetch: () => void
  searchInputRef: RefObject<HTMLInputElement | null>
  setActiveFilter: (filter: FilterStatus) => void
}

/**
 * Atalhos de teclado (desktop):
 * - R: atualiza os jogos
 * - F: foca o campo de busca
 * - 1 a 5: seleciona a aba de filtro correspondente
 */
export function useJogosShortcuts({
  refetch,
  searchInputRef,
  setActiveFilter,
}: UseJogosShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return
      }

      switch (e.key) {
        case "r":
        case "R":
          e.preventDefault()
          refetch()
          break
        case "f":
        case "F":
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case "1":
          setActiveFilter("todos")
          break
        case "2":
          setActiveFilter("live")
          break
        case "3":
          setActiveFilter("upcoming")
          break
        case "4":
          setActiveFilter("finished")
          break
        case "5":
          setActiveFilter("pinned")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [refetch, searchInputRef, setActiveFilter])
}
