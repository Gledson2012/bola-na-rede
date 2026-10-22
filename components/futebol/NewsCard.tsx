"use client"

import { useState, type KeyboardEvent, type ReactNode } from "react"
import Image from "next/image"
import type { News } from "@/types"
import { Clock, Eye, Heart } from "lucide-react"
import { RelativeTime } from "@/components/futebol/RelativeTime"

interface NewsCardProps {
  news: News
  onOpenReader?: (news: News) => void
  featured?: boolean
  isSaved?: boolean
  onSaveToggle?: () => void
  /** Título já com o termo de busca realçado (ReactNode, nunca HTML em string). */
  titleNode?: ReactNode
  /** Resumo já com o termo de busca realçado. */
  excerptNode?: ReactNode
}

const fallbackSportsImages = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
  "https://images.unsplash.com/photo-1489944445391-11dd35574ca6?w=800&q=80",
]

export function NewsCard({
  news,
  onOpenReader,
  featured = false,
  isSaved,
  onSaveToggle,
  titleNode,
  excerptNode,
}: NewsCardProps) {
  const [imgError, setImgError] = useState(false)

  const defaultImg =
    fallbackSportsImages[(news.title?.length ?? 0) % fallbackSportsImages.length]
  const imageSrc = !imgError && news.image ? news.image : defaultImg

  const title = titleNode ?? news.title
  const excerpt = excerptNode ?? news.excerpt

  const open = () => {
    if (onOpenReader) {
      onOpenReader(news)
    } else if (news.url) {
      window.open(news.url, "_blank", "noopener,noreferrer")
    }
  }

  const handleClick = () => {
    open()
  }

  // O card é um alvo de toque: precisa ser acionável por teclado também.
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    open()
  }

  const handleSaveToggle = (event: React.MouseEvent) => {
    event.stopPropagation()
    onSaveToggle?.()
  }

  const hasCategory = news.category && news.category !== "Geral"

  // Featured Large Banner Mode
  if (featured) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`Ler: ${news.title}`}
        className="group relative block cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-all duration-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-futebol-500"
      >
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted sm:aspect-[2/1]">
          <Image
            src={imageSrc}
            alt={news.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Badges on image */}
          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-futebol-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
              Destaque
            </span>
            {news.provider && (
              <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                {news.provider}
              </span>
            )}
            {hasCategory && (
              <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                {news.category}
              </span>
            )}
          </div>

          {isSaved !== undefined && onSaveToggle && (
            <button
              type="button"
              onClick={handleSaveToggle}
              aria-label={isSaved ? "Remover dos salvos" : "Salvar para depois"}
              className="absolute right-4 top-4 z-20 rounded-full bg-futebol-600 p-2 text-white backdrop-blur-md transition-colors hover:bg-futebol-700"
            >
              <Heart className={isSaved ? "h-3 w-3 fill-white" : "h-3 w-3"} />
            </button>
          )}

          {/* Title and Excerpt overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5 text-white">
            <h2 className="line-clamp-2 text-base font-black leading-tight drop-shadow-md transition-colors group-hover:text-futebol-300 sm:text-xl">
              {title}
            </h2>
            <p className="line-clamp-2 text-xs font-normal leading-relaxed text-white/80 drop-shadow-sm sm:text-sm">
              {excerpt}
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-white/70">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <RelativeTime iso={news.publishedAt} fallback={news.date} />
              </span>
              <span>•</span>
              <span>{news.readTime} de leitura</span>
              <span className="ml-auto inline-flex items-center gap-1 font-bold text-futebol-300 transition-transform group-hover:translate-x-1">
                <span>Ler matéria</span>
                <Eye className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard Card Mode
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Ler: ${news.title}`}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-futebol-400/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-futebol-500"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={news.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Fonte */}
        <div className="absolute left-2.5 top-2.5 z-10">
          <span className="rounded-lg border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            {news.provider || "Esporte"}
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
          <Clock className="h-3 w-3 text-futebol-400" />
          <span>{news.readTime}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-2 p-3.5">
        <div>
          {hasCategory && (
            <span className="mb-1 inline-block rounded-md bg-futebol-600/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-futebol-700 dark:text-futebol-400">
              {news.category}
            </span>
          )}
          <h3 className="line-clamp-2 text-xs font-bold leading-snug text-foreground transition-colors group-hover:text-futebol-600 sm:text-sm">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <RelativeTime iso={news.publishedAt} fallback={news.date} />
          </span>
          <div className="flex items-center gap-1 font-bold text-futebol-600 transition-transform group-hover:translate-x-0.5">
            <span>Abrir</span>
            <Eye className="h-3 w-3" />
          </div>
        </div>
        {isSaved !== undefined && (
          <button
            type="button"
            onClick={handleSaveToggle}
            className="w-full rounded-xl border border-border px-4 py-3 text-xs font-semibold transition-colors hover:bg-muted sm:w-auto"
          >
            {isSaved ? "Remover dos salvos" : "Salvar para depois"}
          </button>
        )}
      </div>
    </div>
  )
}
