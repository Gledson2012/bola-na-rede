"use client"
import { useEffect, useRef } from "react"
import { useLiveMatches } from "@/lib/queries"
import { useToast } from "@/lib/use-toast"
import { Toast } from "@/components/ui/toast"

export function GoalMonitor() {
  const { data: matches = [] } = useLiveMatches()
  const { message, show } = useToast(5000)
  const prevScores = useRef<Record<string, { home: number | null, away: number | null }>>({})

  useEffect(() => {
    matches.forEach(match => {
      const prev = prevScores.current[match.id]
      if (prev && (prev.home !== match.homeScore || prev.away !== match.awayScore)) {
        show(`⚽ GOL! ${match.homeTeam.shortName} ${match.homeScore} - ${match.awayScore} ${match.awayTeam.shortName}`)
      }
      prevScores.current[match.id] = { home: match.homeScore, away: match.awayScore }
    })
  }, [matches, show])

  return message ? <Toast>{message}</Toast> : null
}
