"use client"

import { useState, useMemo, useEffect } from "react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { NewsCard } from "@/components/futebol/NewsCard"
import { NewsCardSkeleton } from "@/components/Skeleton"
import { useNews } from "@/lib/queries"
import {
  Newspaper, Search, RefreshCw, X, ExternalLink, Share2,
  Clock, Globe, CheckCircle2, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { News } from "@/types"

export default function NoticiasPage() {
  const { data: news = [], isLoading, error, refetch, isRefetching } = useNews()

  const [search, setSearch] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [readingNews, setReadingNews] = useState<News | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Close the reader with Escape and lock page scroll while it is open
  useEffect(() => {
    if (!readingNews) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReadingNews(null)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [readingNews])

  // Extract unique providers dynamically
  const providers = useMemo(() => {
    const set = new Set<string>()
    news.forEach((n) => {
      if (n.provider) set.add(n.provider)
    })
    return Array.from(set)
  }, [news])

  // Filter news
  const filteredNews = useMemo(() => {
    let result = news

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.excerpt.toLowerCase().includes(q) ||
        (n.provider && n.provider.toLowerCase().includes(q))
      )
    }

    if (selectedProvider) {
      result = result.filter((n) => n.provider === selectedProvider)
    }

    return result
  }, [news, search, selectedProvider])

  const featuredStory = useMemo(() => {
    if (filteredNews.length === 0) return null
    return filteredNews[0]
  }, [filteredNews])

  const remainingStories = useMemo(() => {
    if (filteredNews.length <= 1) return []
    return filteredNews.slice(1)
  }, [filteredNews])

  const handleShareArticle = async (n: News) => {
    const url = n.url || window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: n.title,
          text: n.excerpt,
          url,
        })
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast("Link da notícia copiado! 📋")
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Newspaper className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">Não foi possível carregar as notícias</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors shadow-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar notícias" onRetry={() => refetch()} />}>
        <div className="flex flex-col h-full space-y-4 py-3">
          <div className="h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="h-10 rounded-xl bg-muted animate-pulse" />
          <div className="h-56 rounded-2xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NewsCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback message="Erro ao carregar notícias" onRetry={() => refetch()} />}>
      <div className="flex flex-col h-full space-y-4 pb-12">
        {/* News Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-futebol-950 to-slate-900 text-white p-4 shadow-lg border border-futebol-800 relative overflow-hidden">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-futebol-600/30 text-futebol-400 flex items-center justify-center font-bold">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Notícias do Futebol</h1>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Cobertura jornalística, bastidores, transferências e resultados
              </p>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 transition-all text-white",
                isRefetching && "opacity-75"
              )}
              title="Atualizar notícias"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
              <span>{isRefetching ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/15 text-xs text-white/80">
            <span>Total: <strong className="text-white">{news.length} matérias</strong></span>
            <span className="text-white/40">•</span>
            <span>Fontes: <strong className="text-white">ge.globo, Terra e Gazeta</strong></span>
          </div>
        </div>

        {/* Filter Bar: Search & Source Providers */}
        <div className="space-y-2.5 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-2 border-b border-border">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por jogador, clube, técnico ou assunto..."
              className="w-full bg-muted/60 hover:bg-muted/90 focus:bg-background border border-border focus:border-futebol-500 rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-futebol-500/20 focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Source Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
            <button
              onClick={() => setSelectedProvider(null)}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border",
                !selectedProvider
                  ? "bg-futebol-600 text-white border-futebol-600 shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <span>Todas as Fontes</span>
              <span className="ml-1 text-[10px] opacity-80">({news.length})</span>
            </button>

            {providers.map((p) => {
              const count = news.filter((n) => n.provider === p).length
              const isSelected = selectedProvider === p
              return (
                <button
                  key={p}
                  onClick={() => setSelectedProvider(isSelected ? null : p)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1",
                    isSelected
                      ? "bg-futebol-600 text-white border-futebol-600 shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Globe className="w-3 h-3" />
                  <span>{p}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Stories Feed */}
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
              <Newspaper className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhuma notícia encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              {search
                ? `Nenhum resultado para "${search}".`
                : "Não há notícias disponíveis para o filtro selecionado."}
            </p>
            {(search || selectedProvider) && (
              <button
                onClick={() => {
                  setSearch("")
                  setSelectedProvider(null)
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors shadow-sm"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. Featured Top Story */}
            {featuredStory && !search && (
              <NewsCard
                news={featuredStory}
                featured
                onOpenReader={(item) => setReadingNews(item)}
              />
            )}

            {/* 2. Grid of other stories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(search ? filteredNews : remainingStories).map((item) => (
                <NewsCard
                  key={item.id}
                  news={item}
                  onOpenReader={(n) => setReadingNews(n)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Interactive News Reader Modal */}
        {readingNews && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setReadingNews(null)}
          >
            <div
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-border shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Close and Share */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-futebol-600/10 text-futebol-600 text-xs font-bold uppercase tracking-wider">
                  {readingNews.provider || "Notícia"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleShareArticle(readingNews)}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Compartilhar"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setReadingNews(null)}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-black text-foreground leading-snug">
                  {readingNews.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{readingNews.date}</span>
                  <span>•</span>
                  <span>{readingNews.readTime} de leitura</span>
                </div>
              </div>

              {/* Excerpt / Summary */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {readingNews.excerpt}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                {readingNews.url && (
                  <a
                    href={readingNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-futebol-600 text-white font-bold text-xs hover:bg-futebol-700 transition-colors shadow-md"
                  >
                    <span>Ler matéria completa no {readingNews.provider || "portal"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setReadingNews(null)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating toast */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
