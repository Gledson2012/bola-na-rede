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
import { PageHeader } from "@/components/ui/page-header"
import { FilterChip } from "@/components/ui/filter-chip"
import { EmptyState } from "@/components/ui/empty-state"

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
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        eyebrow="Classificação"
        title={
          <span className="flex items-center gap-2">
            <span className="text-2xl leading-none">{compMeta.flag}</span>
            <span className="truncate">{compMeta.name}</span>
          </span>
        }
        subtitle={`${compMeta.country} · ${compMeta.continent}`}
        action={
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="press flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            title="Atualizar classificação"
            aria-label="Atualizar classificação"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </button>
        }
      />

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {REGION_TABS.map((tab) => (
          <FilterChip
            key={tab.value}
            active={selectedRegion === tab.value}
            onClick={() => setSelectedRegion(tab.value)}
            count={regionCountByFilter[tab.value]}
          >
            <span>{tab.flag}</span>
            <span>{tab.label}</span>
          </FilterChip>
        ))}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {filteredCompetitions.map((c) => (
          <FilterChip
            key={c.id}
            active={c.id === activeCompId}
            onClick={() => {
              selectCompetition(c.id)
              setTableSearch("")
            }}
          >
            <span>{c.flag}</span>
            <span>{c.shortName}</span>
          </FilterChip>
        ))}
      </div>

      {standings.length > 0 && <TableStats standings={standings} />}

      {standings.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Filtrar clube na tabela"
            aria-label="Filtrar clube na tabela"
            className="h-10 w-full rounded-2xl border border-border/80 bg-card pl-10 pr-10 text-[12px] font-medium outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
          />
          {tableSearch && (
            <button
              onClick={() => setTableSearch("")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Limpar filtro"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {error && standings.length === 0 ? (
        <EmptyState
          icon={Trophy}
          tone="error"
          title={`Erro ao carregar ${compMeta.name}`}
          description="Não foi possível buscar a classificação agora."
          action={
            <button
              onClick={() => refetchTable()}
              className="press rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
            >
              Tentar novamente
            </button>
          }
        />
      ) : tableLoading ? (
        <LeagueTableSkeleton />
      ) : standings.length > 0 ? (
        <LeagueTable
          standings={standings}
          competitionId={activeCompId}
          filterText={tableSearch}
        />
      ) : (
        <EmptyState
          icon={Trophy}
          title="Tabela não disponível"
          description="A classificação desta competição não está disponível no momento."
        />
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
