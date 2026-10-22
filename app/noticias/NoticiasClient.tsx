"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { NewsCard } from "@/components/futebol/NewsCard"
import { NewsReader } from "@/components/futebol/NewsReader"
import { Highlight } from "@/components/futebol/Highlight"
import { NewsCardSkeleton } from "@/components/Skeleton"
import { useNews } from "@/lib/queries"
import { Newspaper, Search, RefreshCw, X, Globe } from "lucide-react"
import { cn, formatRelativeTime, copyToClipboard } from "@/lib/utils"
import { useToast } from "@/lib/use-toast"
import type { News } from "@/types"

export default function NoticiasClient({
  initialNews,
}: {
  initialNews: News[]
}) {
  const { data: news = [], isLoading, error, refetch, isRefetching } =
    useNews(initialNews)

  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [readingNews, setReadingNews] = useState<News | null>(null)
  const { message: toastMessage, show: showToast } = useToast()

  // O `localStorage` só existe no navegador: a leitura acontece no efeito para
  // não quebrar a renderização do servidor (SSR/prerender do Next).
  const [savedNews, setSavedNews] = useState<News[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_news")
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) setSavedNews(parsed as News[])
    } catch {
      // Storage indisponível (modo privado) ou conteúdo corrompido.
      setSavedNews([])
    }
  }, [])

  const saveNews = (news: News) => {
    setSavedNews((prev) => {
      const exists = prev.some((item) => item.id === news.id)
      if (exists) return prev
      const updated = [...prev, news]
      try {
        localStorage.setItem("saved_news", JSON.stringify(updated))
      } catch {
        // Ignora falha de escrita: a notícia continua salva na sessão.
      }
      return updated
    })
    showToast("Notícia salva para ler depois! 📌")
  }

  const removeSavedNews = (newsId: string) => {
    setSavedNews((prev) => {
      const updated = prev.filter((item) => item.id !== newsId)
      try {
        localStorage.setItem("saved_news", JSON.stringify(updated))
      } catch {
        // Ignora falha de escrita.
      }
      return updated
    })
  }

  const isNewsSaved = (newsId: string) => {
    return savedNews.some((item) => item.id === newsId)
  }

  // Fontes disponíveis, com a contagem de matérias de cada uma.
  const providers = useMemo(() => {
    const counts = new Map<string, number>()
    news.forEach((item) => {
      const name = item.provider || "Notícias"
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [news])

  // Categorias disponíveis, com a contagem de matérias de cada uma.
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    news.forEach((item) => {
      const name = item.category || "Geral"
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [news])

  /**
   * Filtragem + ordenação cronológica. A API entrega as matérias sem ordem
   * garantida, então a mais recente sempre fica no topo.
   */

  const filteredNews = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR")
    const categoryFilter = selectedCategory || undefined

    const result = news.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false
      if (selectedProvider && item.provider !== selectedProvider) return false
      if (!query) return true
      const combined = [
        item.title,
        item.excerpt,
        item.content ?? "",
        item.provider ?? "",
        item.category,
      ].join(" ").toLocaleLowerCase("pt-BR")
      return combined.includes(query)
    })

    return [...result].sort((a, b) => {
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return timeB - timeA
    })
  }, [news, search, selectedProvider, selectedCategory])

  const featuredStory = filteredNews[0] ?? null
  const remainingStories = filteredNews.slice(1)

  const latestUpdate = useMemo(() => {
    const timestamps = news
      .map((item) => item.publishedAt)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value))
    if (timestamps.length === 0) return null
    return new Date(Math.max(...timestamps)).toISOString()
  }, [news])

  const handleShareArticle = useCallback(
    async (item: News) => {
      const url = item.url || window.location.href
      if (navigator.share) {
        try {
          await navigator.share({
            title: item.title,
            text: item.excerpt,
            url,
          })
        } catch (error) {
          // AbortError = usuário fechou o menu nativo: não é falha.
          if (error instanceof Error && error.name !== "AbortError") {
            showToast("Não foi possível compartilhar.")
          }
        }
        return
      }

      const copied = await copyToClipboard(url)
      showToast(copied ? "Link da notícia copiado! 📋" : "Não foi possível copiar o link.")
    },
    [showToast]
  )

  const clearFilters = () => {
    setSearch("")
    setSelectedProvider(null)
    setSelectedCategory(null)
  }

  if (error && news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-bold text-foreground">
          Não foi possível carregar as notícias
        </h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Verifique sua conexão e tente novamente.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-futebol-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-futebol-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar notícias" onRetry={() => { reset(); refetch() }} />)}>
        <div className="flex h-full flex-col space-y-4 py-3">
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-10 animate-pulse rounded-xl bg-muted" />
          <div className="h-56 animate-pulse rounded-2xl bg-muted" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <NewsCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary fallback={(reset) => (<ErrorFallback message="Erro ao carregar notícias" onRetry={() => { reset(); refetch() }} />)}>
      <div className="flex h-full flex-col space-y-4 pb-12">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-futebol-800 bg-gradient-to-br from-slate-900 via-futebol-950 to-slate-900 p-4 text-white shadow-lg">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-futebol-600/30 font-bold text-futebol-400">
                  <Newspaper className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                  Notícias do Futebol
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-white/70">
                Cobertura jornalística, bastidores, transferências e resultados
              </p>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/25",
                isRefetching && "opacity-75"
              )}
              title="Atualizar notícias"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
              <span>{isRefetching ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/15 pt-3 text-xs text-white/80">
            <span>
              Total: <strong className="text-white">{news.length} matérias</strong>
            </span>
            <span className="text-white/40">•</span>
            <span>
              Fontes:{" "}
              <strong className="text-white">{providers.length}</strong>
            </span>
            {categories.length > 0 && (
              <>
                <span className="text-white/40">•</span>
                <span>
                  Categorias:{" "}
                  <strong className="text-white">{categories.length}</strong>
                </span>
              </>
            )}
            {latestUpdate && (
              <>
                <span className="text-white/40">•</span>
                <span>
                  Última em{" "}
                  <strong className="text-white" suppressHydrationWarning>
                    {formatRelativeTime(latestUpdate)}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="sticky top-14 z-30 space-y-2.5 border-b border-border bg-background/95 py-2 backdrop-blur-md">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por jogador, clube, técnico ou assunto..."
              className="w-full rounded-2xl border border-border bg-muted/60 py-2.5 pl-9 pr-9 text-xs transition-all hover:bg-muted/90 focus:bg-background focus:border-futebol-500 focus:outline-none focus:ring-2 focus:ring-futebol-500/20 sm:text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 rounded-full p-1 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-hide">
            <button
              onClick={() => setSelectedProvider(null)}
              aria-pressed={selectedProvider === null}
              className={cn(
                "whitespace-nowrap rounded-xl border px-3 py-1.5 transition-all",
                selectedProvider === null
                  ? "border-futebol-600 bg-futebol-600 text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Todas as Fontes
              <span className="ml-1 text-[10px] opacity-80">({news.length})</span>
            </button>

            {providers.map(([name, count]) => {
              const isSelected = selectedProvider === name
              return (
                <button
                  key={name}
                  onClick={() => setSelectedProvider(isSelected ? null : name)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center gap-1 whitespace-nowrap rounded-xl border px-3 py-1.5 transition-all",
                    isSelected
                      ? "border-futebol-600 bg-futebol-600 text-white shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Globe className="h-3 w-3" />
                  <span>{name}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              )
            })}
            {categories.map(([name, count]) => {
              const isSelected = selectedCategory === name
              return (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(isSelected ? null : name)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center gap-1 whitespace-nowrap rounded-xl border px-3 py-1.5 transition-all",
                    isSelected
                      ? "border-futebol-600 bg-futebol-600 text-white shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Newspaper className="h-3 w-3" />
                  <span>{name}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Feed */}
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-4 py-16 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Newspaper className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Nenhuma notícia encontrada
            </h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {search
                ? `Nenhum resultado para “${search}”.`
                : "Não há notícias disponíveis para o filtro selecionado."}
            </p>
            {(search || selectedProvider || selectedCategory) && (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-futebol-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-futebol-700"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {featuredStory && (
              <NewsCard
                news={featuredStory}
                titleNode={<Highlight text={featuredStory.title} query={search} />}
                excerptNode={<Highlight text={featuredStory.excerpt || ""} query={search} />}
                featured
                onOpenReader={(item) => setReadingNews(item)}
                isSaved={isNewsSaved(featuredStory.id)}
                onSaveToggle={() => {
                  if (isNewsSaved(featuredStory.id)) {
                    removeSavedNews(featuredStory.id)
                  } else {
                    saveNews(featuredStory)
                  }
                }}
              />
            )}

            {remainingStories.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {remainingStories.map((item) => (
                  <NewsCard
                    key={item.id}
                    news={item}
                    titleNode={<Highlight text={item.title} query={search} />}
                    excerptNode={<Highlight text={item.excerpt || ""} query={search} />}
                    onOpenReader={(news) => setReadingNews(news)}
                    isSaved={isNewsSaved(item.id)}
                    onSaveToggle={() => {
                      if (isNewsSaved(item.id)) {
                        removeSavedNews(item.id)
                      } else {
                        saveNews(item)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {readingNews && (
          <NewsReader
            news={readingNews}
            onClose={() => setReadingNews(null)}
            onShare={(item) => void handleShareArticle(item)}
          />
        )}

        {/* Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background shadow-2xl fade-in zoom-in-95 duration-150"
          >
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
