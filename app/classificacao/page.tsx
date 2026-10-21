"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { LeagueTableSkeleton } from "@/components/Skeleton"
import { LeagueTable } from "@/components/futebol/LeagueTable"
import { useCompetitions, useCompetitionTable } from "@/lib/queries"
import { ALL_COMPETITIONS, getCompetitionMeta } from "@/lib/competitions"
import { Trophy, RefreshCw, Search, X, Globe, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type RegionFilter = "all" | "Brasil" | "Europa" | "América do Sul" | "América do Norte"

function ClassificacaoContent() {
  const searchParams = useSearchParams()
  const initialLeagueParam = searchParams.get("league")

  const { data: competitions = [], isLoading: compsLoading, refetch: refetchComps } = useCompetitions()

  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(
    initialLeagueParam || "bra.1"
  )
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("all")
  const [tableSearch, setTableSearch] = useState("")

  const activeCompId = selectedCompetitionId || "bra.1"
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

  const handleRefresh = () => {
    refetchTable()
    refetchComps()
  }

  return (
    <div className="flex flex-col h-full space-y-4 pb-12">
      {/* League Hero Banner */}
      <div
        className="rounded-3xl bg-gradient-to-br from-slate-900 via-futebol-950 to-slate-900 text-white p-5 shadow-xl border border-futebol-800 relative overflow-hidden"
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl pointer-events-none rounded-full"
          style={{ backgroundColor: compMeta.color || "#0ea5e9" }}
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-3xl flex-shrink-0 drop-shadow">{compMeta.flag}</span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
                  {compMeta.name}
                </h1>
                <p className="text-xs text-white/70 mt-1">
                  {compMeta.country} • {compMeta.continent}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition-all active:scale-95 text-white",
              isRefetching && "opacity-75"
            )}
            title="Atualizar tabela agora"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
            <span>{isRefetching ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15 text-xs text-white/80">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span>Tabela Oficial • <strong>{standings.length} clubes na disputa</strong></span>
        </div>
      </div>

      {/* Region Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
        <button
          onClick={() => setSelectedRegion("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
            selectedRegion === "all"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          Todas as Ligas ({regionCounts.all})
        </button>
        <button
          onClick={() => setSelectedRegion("Brasil")}
          className={cn(
            "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
            selectedRegion === "Brasil"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span>🇧🇷</span>
          <span>Brasil ({regionCounts.brasil})</span>
        </button>
        <button
          onClick={() => setSelectedRegion("Europa")}
          className={cn(
            "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
            selectedRegion === "Europa"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span>🇪🇺</span>
          <span>Europa ({regionCounts.europa})</span>
        </button>
        <button
          onClick={() => setSelectedRegion("América do Sul")}
          className={cn(
            "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
            selectedRegion === "América do Sul"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span>🌎</span>
          <span>América do Sul ({regionCounts.americaSul})</span>
        </button>
        <button
          onClick={() => setSelectedRegion("América do Norte")}
          className={cn(
            "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
            selectedRegion === "América do Norte"
              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span>🇲🇽/🇺🇸</span>
          <span>América do Norte ({regionCounts.americaNorte})</span>
        </button>
      </div>

      {/* Competitions Carousel */}
      <div className="space-y-2 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-2 border-b border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
          {filteredCompetitions.map((c) => {
            const isSelected = c.id === activeCompId
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCompetitionId(c.id)
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
              placeholder={`Filtrar clube em ${compMeta.shortName}...`}
              className="w-full bg-muted/60 hover:bg-muted/90 focus:bg-background border border-border focus:border-futebol-500 rounded-xl pl-8 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-futebol-500 focus:outline-none transition-all"
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
      {error ? (
        <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-center text-xs text-destructive space-y-2">
          <p>Erro ao carregar classificação de {compMeta.name}.</p>
          <button
            onClick={() => refetchTable()}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-semibold"
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
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-border bg-card/50">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-base font-bold text-foreground">Tabela não disponível</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            A classificação desta competição ainda não foi iniciada ou o torneio segue em formato eliminatório direto.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ClassificacaoPage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar classificação" onRetry={() => window.location.reload()} />}>
      <Suspense fallback={<LeagueTableSkeleton />}>
        <ClassificacaoContent />
      </Suspense>
    </ErrorBoundary>
  )
}
