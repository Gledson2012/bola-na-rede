"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { MatchCard } from "@/components/futebol/MatchCard"
import type { Match } from "@/types"

interface VirtualMatchListProps {
  matches: Match[]
  showCompetition?: boolean
  estimatedItemHeight?: number
  overscan?: number
}

/**
 * Lista virtualizada de partidas para melhorar performance em listas longas.
 *
 * Renderiza apenas os itens visíveis no viewport + overscan, reduzindo drasticamente
 * o trabalho de layout e paint. Para listas de 100+ itens, a diferença é perceptível.
 */
export function VirtualMatchList({
  matches,
  showCompetition = false,
  estimatedItemHeight = 80,
  overscan = 3,
}: VirtualMatchListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Observa mudanças no tamanho do container
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    observer.observe(container)
    setContainerHeight(container.clientHeight)

    return () => observer.disconnect()
  }, [])

  // Atualiza scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const { visibleItems, totalHeight } = useMemo(() => {
    const totalCount = matches.length
    const totalH = totalCount * estimatedItemHeight

    if (containerHeight === 0) {
      return { visibleItems: [], totalHeight: totalH }
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan)
    const endIndex = Math.min(
      totalCount - 1,
      Math.ceil((scrollTop + containerHeight) / estimatedItemHeight) + overscan
    )

    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      const match = matches[i]
      if (match) {
        items.push({
          match,
          index: i,
          offsetTop: i * estimatedItemHeight,
        })
      }
    }

    return { visibleItems: items, totalHeight: totalH }
  }, [matches, scrollTop, containerHeight, estimatedItemHeight, overscan])

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      style={{ height: "100%", maxHeight: "70vh" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map(({ match, offsetTop }) => (
          <div
            key={match.id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetTop}px)`,
            }}
          >
            <div className="px-0 pb-2">
              <MatchCard match={match} showCompetition={showCompetition} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
