"use client"

import { useState, type KeyboardEvent, type ReactNode } from "react"
import Image from "next/image"
import type { News } from "@/types"
import { Clock, Eye, Heart } from "lucide-react"
import { RelativeTime } from "@/components/futebol/RelativeTime"
import { SoccerBallIcon } from "@/components/icons/soccer-ball"
import { cn } from "@/lib/utils"

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
  const imageSrc = !imgError && news.image ? news.image : null

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
        className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted sm:aspect-[2/1]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-primary/15 to-muted">
              <SoccerBallIcon className="absolute right-5 top-1/2 h-24 w-24 -translate-y-1/2 text-primary/25" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Badges on image */}
          <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-md">
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
              className="absolute right-4 top-4 z-20 rounded-full bg-primary p-2 text-primary-foreground backdrop-blur-md transition-colors hover:bg-primary/90"
            >
              <Heart className={isSaved ? "h-3 w-3 fill-white" : "h-3 w-3"} />
            </button>
          )}

          {/* Title and Excerpt overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5 text-white">
            <h2 className="line-clamp-2 text-base font-black leading-tight drop-shadow-md transition-colors group-hover:text-emerald-300 sm:text-xl">
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
              <span className="ml-auto inline-flex items-center gap-1 font-bold text-emerald-300 transition-transform group-hover:translate-x-1">
                <span>Ler matéria</span>
                <Eye className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard Card Mode — linha horizontal, feita para leitura rápida no celular.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Ler: ${news.title}`}
      className="group relative flex cursor-pointer gap-3 rounded-2xl border border-border/80 bg-card p-2.5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="relative h-[88px] w-[112px] flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-muted">
            <SoccerBallIcon className="h-8 w-8 text-primary/30" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex min-w-0 items-center gap-1.5 text-[8.5px] font-black uppercase tracking-[0.08em]">
          {hasCategory && <span className="flex-shrink-0 text-primary">{news.category}</span>}
          {news.provider && (
            <>
              {hasCategory && <span className="text-muted-foreground/40">·</span>}
              <span className="truncate text-muted-foreground">{news.provider}</span>
            </>
          )}
        </div>

        <h3 className="mt-1 line-2 text-[12.5px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 text-[9.5px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <RelativeTime iso={news.publishedAt} fallback={news.date} />
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {news.readTime}
          </span>
        </div>
      </div>

      {isSaved !== undefined && onSaveToggle && (
        <button
          type="button"
          onClick={handleSaveToggle}
          aria-label={isSaved ? "Remover dos salvos" : "Salvar para depois"}
          className={cn(
            "flex h-7 w-7 flex-shrink-0 items-center justify-center self-center rounded-full transition-colors",
            isSaved
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
        </button>
      )}
    </div>
  )
}
