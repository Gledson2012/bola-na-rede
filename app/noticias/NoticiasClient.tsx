"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Newspaper,
  Search,
  RefreshCw,
  X,
} from "lucide-react"
import { ErrorBoundary, ErrorFallback } from "@/components/ErrorBoundary"
import { NewsCard } from "@/components/futebol/NewsCard"
import { NewsReader } from "@/components/futebol/NewsReader"
import { Highlight } from "@/components/futebol/Highlight"
import { NewsCardSkeleton } from "@/components/Skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { FilterChip } from "@/components/ui/filter-chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Toast } from "@/components/ui/toast"
import { useNews } from "@/lib/queries"
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

  // O `localStorage` só existe no navegador: leitura no efeito para não quebrar
  // a renderização no servidor.
  const [savedNews, setSavedNews] = useState<News[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_news")
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) setSavedNews(parsed as News[])
    } catch {
      setSavedNews([])
    }
  }, [])

  const saveNews = (newsItem: News) => {
    setSavedNews((prev) => {
      const exists = prev.some((item) => item.id === newsItem.id)
      if (exists) return prev
      const updated = [...prev, newsItem]
      try {
        localStorage.setItem("saved_news", JSON.stringify(updated))
      } catch {
        // Ignora falha de escrita: a notícia continua salva na sessão.
      }
      return updated
    })
    showToast("Notícia salva para ler depois 🔖")
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

  const isNewsSaved = (newsId: string) => savedNews.some((item) => item.id === newsId)

  const providers = useMemo(() => {
    const counts = new Map<string, number>()
    news.forEach((item) => {
      const name = item.provider || "Notícias"
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [news])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    news.forEach((item) => {
      const name = item.category || "Geral"
      counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [news])

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
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
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
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name !== "AbortError") {
            showToast("Não foi possível compartilhar.")
          }
        }
        return
      }

      const copied = await copyToClipboard(url)
      showToast(copied ? "Link da notícia copiado 📋" : "Não foi possível copiar o link.")
    },
    [showToast]
  )

  const clearFilters = () => {
    setSearch("")
    setSelectedProvider(null)
    setSelectedCategory(null)
  }

  const hasFilters = Boolean(search || selectedProvider || selectedCategory)

  if (error && news.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        tone="error"
        title="Não foi possível carregar as notícias"
        description="Verifique sua conexão e tente novamente."
        action={
          <button
            onClick={() => refetch()}
            className="press rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
          >
            Tentar novamente
          </button>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <ErrorBoundary
        fallback={(reset) => (
          <ErrorFallback
            message="Erro ao carregar notícias"
            onRetry={() => {
              reset()
              refetch()
            }}
          />
        )}
      >
        <div className="space-y-4 py-3">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-2xl bg-muted" />
          <div className="h-52 animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <NewsCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary
      fallback={(reset) => (
        <ErrorFallback
          message="Erro ao carregar notícias"
          onRetry={() => {
            reset()
            refetch()
          }}
        />
      )}
    >
      <div className="flex flex-col gap-4 pb-6">
        <PageHeader
          eyebrow="Giro esportivo"
          title="Notícias"
          subtitle={
            latestUpdate
              ? `${news.length} matérias · última ${formatRelativeTime(latestUpdate)}`
              : `${news.length} matérias de ${providers.length} fontes`
          }
          action={
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="press flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              title="Atualizar notícias"
              aria-label="Atualizar notícias"
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            </button>
          }
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar jogador, clube ou assunto"
            aria-label="Buscar notícias"
            className="h-10 w-full rounded-2xl border border-border/80 bg-card pl-10 pr-10 text-[12px] font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <FilterChip
              active={!selectedCategory}
              onClick={() => setSelectedCategory(null)}
            >
              Tudo
            </FilterChip>
            {categories.map(([name, count]) => (
              <FilterChip
                key={name}
                active={selectedCategory === name}
                onClick={() =>
                  setSelectedCategory(selectedCategory === name ? null : name)
                }
                count={count}
              >
                {name}
              </FilterChip>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground">
            {filteredNews.length}{" "}
            {filteredNews.length === 1 ? "matéria" : "matérias"}
          </span>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Limpar
              </button>
            )}
            <label htmlFor="news-source" className="sr-only">
              Filtrar por fonte
            </label>
            <select
              id="news-source"
              value={selectedProvider ?? ""}
              onChange={(event) => setSelectedProvider(event.target.value || null)}
              className="h-7 max-w-[9.5rem] rounded-full border border-border/80 bg-card px-2 text-[10px] font-bold text-foreground outline-none"
            >
              <option value="">Todas as fontes</option>
              {providers.map(([name]) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="Nenhuma notícia encontrada"
            description={
              search
                ? `Nenhum resultado para “${search}”.`
                : "Não há notícias para os filtros selecionados."
            }
            action={
              hasFilters ? (
                <button
                  onClick={clearFilters}
                  className="press rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
                >
                  Limpar filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
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
              <div className="space-y-2">
                {remainingStories.map((item) => (
                  <NewsCard
                    key={item.id}
                    news={item}
                    titleNode={<Highlight text={item.title} query={search} />}
                    excerptNode={<Highlight text={item.excerpt || ""} query={search} />}
                    onOpenReader={(newsItem) => setReadingNews(newsItem)}
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

        {toastMessage && <Toast>{toastMessage}</Toast>}
      </div>
    </ErrorBoundary>
  )
}
