import { useState, useMemo, useCallback } from "react"
import type { Match } from "@/types"
import { getCompetitionMeta } from "@/lib/competitions"

export type FilterStatus = "todos" | "live" | "upcoming" | "finished" | "pinned"
export type SortOption = "time" | "competition" | "status"

export interface CompetitionGroup {
  name: string
  flag: string
  region: string
  matches: Match[]
}

interface UseJogosFilterParams {
  matches: Match[]
  favorites: string[]
  pinnedMatches: string[]
  pinnedLeagues: string[]
}

/**
 * Normaliza data/hora da partida para ordenação estável "HH:MM".
 */
export function matchTimeKey(match: Match): string {
  if (match.kickoff) return match.kickoff
  const parsed = new Date(match.date)
  if (Number.isNaN(parsed.getTime())) return "99:99"
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(
    parsed.getMinutes()
  ).padStart(2, "0")}`
}

export function useJogosFilter({
  matches,
  favorites,
  pinnedMatches,
  pinnedLeagues,
}: UseJogosFilterParams) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("todos")
  const [activeCompetition, setActiveCompetition] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("time")
  const [search, setSearch] = useState("")
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({})

  const isTeamFavorite = useCallback(
    (teamId: string) => favorites.includes(teamId),
    [favorites]
  )
  const isMatchPinned = useCallback(
    (matchId: string) => pinnedMatches.includes(matchId),
    [pinnedMatches]
  )

  const isMatchHighlighted = useCallback(
    (m: Match) =>
      isMatchPinned(m.id) ||
      isTeamFavorite(m.homeTeam.id) ||
      isTeamFavorite(m.awayTeam.id),
    [isMatchPinned, isTeamFavorite]
  )

  const toggleLeagueCollapse = useCallback((leagueName: string) => {
    setCollapsedLeagues((prev) => ({
      ...prev,
      [leagueName]: !prev[leagueName],
    }))
  }, [])

  const availableCompetitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; country?: string; count: number }>()

    matches.forEach((m) => {
      const compKey = m.competition || "Outros"
      const existing = map.get(compKey)
      if (existing) {
        existing.count++
      } else {
        map.set(compKey, {
          id: m.competitionId || compKey,
          name: compKey,
          country: m.competitionCountry,
          count: 1,
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [matches])

  const stats = useMemo(() => {
    const live = matches.filter((m) => m.status === "live").length
    const upcoming = matches.filter((m) => m.status === "upcoming").length
    const finished = matches.filter((m) => m.status === "finished").length
    const pinned = matches.filter(isMatchHighlighted).length

    return { total: matches.length, live, upcoming, finished, pinned }
  }, [matches, isMatchHighlighted])

  const processedMatches = useMemo(() => {
    let result = matches

    if (search.trim()) {
      const query = search.trim().toLowerCase()
      result = result.filter((m) => {
        const text = [
          m.homeTeam.name,
          m.homeTeam.shortName,
          m.awayTeam.name,
          m.awayTeam.shortName,
          m.competition,
          m.competitionCountry,
          m.venue,
          m.kickoff,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return text.includes(query)
      })
    }

    if (activeFilter === "live") {
      result = result.filter((m) => m.status === "live")
    } else if (activeFilter === "upcoming") {
      result = result.filter((m) => m.status === "upcoming")
    } else if (activeFilter === "finished") {
      result = result.filter((m) => m.status === "finished")
    } else if (activeFilter === "pinned") {
      result = result.filter(isMatchHighlighted)
    }

    if (activeCompetition) {
      result = result.filter((m) => m.competition === activeCompetition)
    }

    result = [...result].sort((a, b) => {
      if (activeFilter !== "pinned") {
        const aPinned = isMatchHighlighted(a)
        const bPinned = isMatchHighlighted(b)
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
      }

      switch (sortBy) {
        case "time":
          return matchTimeKey(a).localeCompare(matchTimeKey(b))
        case "competition":
          return (
            (a.competition || "").localeCompare(b.competition || "", "pt-BR") ||
            matchTimeKey(a).localeCompare(matchTimeKey(b))
          )
        case "status": {
          const order: Record<string, number> = { live: 0, upcoming: 1, finished: 2 }
          return (
            (order[a.status] ?? 3) - (order[b.status] ?? 3) ||
            matchTimeKey(a).localeCompare(matchTimeKey(b))
          )
        }
        default:
          return 0
      }
    })

    return result
  }, [
    matches,
    search,
    activeFilter,
    activeCompetition,
    sortBy,
    isMatchHighlighted,
  ])

  const { pinnedSectionMatches, groupedByCompetition } = useMemo(() => {
    let pinnedList: Match[] = []
    let restList = processedMatches

    if (activeFilter === "todos" && !search && !activeCompetition) {
      pinnedList = processedMatches.filter(isMatchHighlighted)
      restList = processedMatches.filter((m) => !isMatchHighlighted(m))
    }

    const groups: Record<string, Match[]> = {}
    restList.forEach((match) => {
      const comp = match.competition || "Outros Campeonatos"
      if (!groups[comp]) groups[comp] = []
      groups[comp].push(match)
    })

    const sortedGroups: CompetitionGroup[] = Object.entries(groups)
      .map(([compName, compMatches]) => {
        const meta = getCompetitionMeta(compName)
        return {
          name: compName,
          flag: meta.flag,
          region: meta.country || compMatches[0]?.competitionCountry || "Futebol",
          matches: compMatches,
        }
      })
      .sort((a, b) => {
        const aPinned = pinnedLeagues.includes(a.name)
        const bPinned = pinnedLeagues.includes(b.name)
        if (aPinned && !bPinned) return -1
        if (!aPinned && bPinned) return 1
        return 0
      })

    return {
      pinnedSectionMatches: pinnedList,
      groupedByCompetition: sortedGroups,
    }
  }, [
    processedMatches,
    activeFilter,
    search,
    activeCompetition,
    isMatchHighlighted,
    pinnedLeagues,
  ])

  const hasActiveFilters =
    activeFilter !== "todos" || activeCompetition !== null || search.trim() !== ""

  const handleResetFilters = useCallback(() => {
    setActiveFilter("todos")
    setActiveCompetition(null)
    setSearch("")
  }, [])

  return {
    activeFilter,
    setActiveFilter,
    activeCompetition,
    setActiveCompetition,
    sortBy,
    setSortBy,
    search,
    setSearch,
    collapsedLeagues,
    toggleLeagueCollapse,
    availableCompetitions,
    stats,
    processedMatches,
    pinnedSectionMatches,
    groupedByCompetition,
    hasActiveFilters,
    handleResetFilters,
  }
}
