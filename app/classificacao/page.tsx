"use client"

import { useState, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { LeagueTableSkeleton } from "@/components/Skeleton"
import { LeagueTable } from "@/components/futebol/LeagueTable"
import { TableStats } from "@/components/futebol/TableStats"
import { useCompetitions, useCompetitionTable } from "@/lib/queries"
import { ALL_COMPETITIONS, getCompetitionMeta } from "@/lib/competitions"
import { Trophy, RefreshCw, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

type RegionFilter = "all" | "Brasil" | "Europa" | "América do Sul" | "América do Norte"

const REGION_TABS: Array<{
  value: RegionFilter
  label: string
  flag: string
}> = [
  { value: "all", label: "Todas", flag: "🌐" },
  { value: "Brasil", label: "Brasil", flag: "🇧🇷" },
  { value: "Europa", label: "Europa", flag: "🇪🇺" },
  { value: "América do Sul", label: "América do Sul", flag: "🌎" },
  { value: "América do Norte", label: "América do Norte", flag: "🇲🇽" },
]

function ClassificacaoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueParam = searchParams.get("league")

  const { refetch: refetchComps } = useCompetitions()

  // Só aceita ligas conhecidas: "?league=lixo" geraria uma requisição inválida
  // à API e um título de fallback sem sentido.
  const isKnownLeague = (value: string | null): value is string =>
    !!value && ALL_COMPETITIONS.some((competition) => competition.id === value)

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(
    isKnownLeague(leagueParam) ? leagueParam : "bra.1"
  )
  const [lastLeagueParam, setLastLeagueParam] = useState<string | null>(
    leagueParam
  )
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("all")
  const [tableSearch, setTableSearch] = useState("")

  // Sincroniza com a URL sem efeito: quando o Header navega para
  // /classificacao?league=X, o parâmetro muda e o estado acompanha no mesmo
  // render. Cliques locais continuam respondendo na hora.
  if (leagueParam !== lastLeagueParam) {
    setLastLeagueParam(leagueParam)
    if (isKnownLeague(leagueParam)) {
      setSelectedCompetitionId(leagueParam)
    }
  }

  const selectCompetition = (competitionId: string) => {
    setSelectedCompetitionId(competitionId)
    router.replace(`/classificacao?league=${encodeURIComponent(competitionId)}`, {
      scroll: false,
    })
  }

  const activeCompId = selectedCompetitionId
  const compMeta = useMemo(() => getCompetitionMeta(activeCompId), [activeCompId])

  const {
    data: standings = [],
    isLoading: tableLoading,
    error,
    refetch: refetchTable,
    isRefetching,
  } = useCompetitionTable(activeCompId)

  // Filter competitions by region tab
  const filteredCompetitions = useMemo(() => {
    if (selectedRegion === "all") return ALL_COMPETITIONS
    if (selectedRegion === "Brasil") return ALL_COMPETITIONS.filter((c) => c.country === "Brasil")
    return ALL_COMPETITIONS.filter((c) => c.continent === selectedRegion)
  }, [selectedRegion])

  const regionCounts = useMemo(
    () => ({
      all: ALL_COMPETITIONS.length,
      brasil: ALL_COMPETITIONS.filter((c) => c.country === "Brasil").length,
      europa: ALL_COMPETITIONS.filter((c) => c.continent === "Europa").length,
      americaSul: ALL_COMPETITIONS.filter((c) => c.continent === "América do Sul").length,
      americaNorte: ALL_COMPETITIONS.filter((c) => c.continent === "América do Norte").length,
    }),
    []
  )

  const regionCountByFilter = useMemo(() => {
    const counts: Record<RegionFilter, number> = {
      all: regionCounts.all,
      Brasil: regionCounts.brasil,
      Europa: regionCounts.europa,
      "América do Sul": regionCounts.americaSul,
      "América do Norte": regionCounts.americaNorte,
    }
    return counts
  }, [regionCounts])

  const handleRefresh = () => {
    refetchTable()
    refetchComps()
  }

  return (
    <div className="flex flex-col h-full space-y-4 pb-12">
      {/* League Hero Banner */}
      <div className="rounded-lg bg-card text-card-foreground p-5 border border-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{compMeta.flag}</span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
              {compMeta.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {compMeta.country} • {compMeta.continent}
            </p>
          </div>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-medium">
        {REGION_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedRegion(tab.value)}
            aria-pressed={selectedRegion === tab.value}
            className={cn(
              "px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              selectedRegion === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80 text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resumo da competição */}
      {standings.length > 0 && <TableStats standings={standings} />}

      {/* Competitions Carousel */}
      <div className="space-y-2 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-2 border-b border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
          {filteredCompetitions.map((c) => {
            const isSelected = c.id === activeCompId
            return (
              <button
                key={c.id}
                onClick={() => {
                  selectCompetition(c.id)
                  setTableSearch("")
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all whitespace-nowrap border active:scale-95",
                  isSelected
                    ? "bg-futebol-600 text-white border-futebol-600 shadow-md font-bold"
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
                aria-pressed={isSelected}
              >
                <span className="text-base">{c.flag}</span>
                <span>{c.shortName}</span>
              </button>
            )
          })}
        </div>

        {/* Quick Club Search inside table */}
        {standings.length > 0 && (
          <div className="relative flex items-center pt-1">
            <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filtrar clube..."
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch("")}
                className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Standings Table Feed */}
      {error && standings.length === 0 ? (
        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5 text-center text-xs text-destructive space-y-2">
          <p>Erro ao carregar classificação de {compMeta.name}.</p>
          <button
            onClick={() => refetchTable()}
            className="px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      ) : tableLoading ? (
        <LeagueTableSkeleton />
      ) : standings.length > 0 ? (
        <LeagueTable
          standings={standings}
          competitionId={activeCompId}
          filterText={tableSearch}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-md border border-border bg-card">
          <Trophy className="w-8 h-8 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-bold text-foreground">Tabela não disponível</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            A classificação desta competição não está disponível no momento.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ClassificacaoPage() {
  const router = useRouter()
  return (
    <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar classificação" onRetry={() => { reset(); router.refresh() }} />)}>
      <Suspense fallback={<LeagueTableSkeleton />}>
        <ClassificacaoContent />
      </Suspense>
    </ErrorBoundary>
  )
}
