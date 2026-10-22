"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import type { News } from "@/types"
import { ExternalLink, Clock, Share2, X, Newspaper } from "lucide-react"
import { formatRelativeTime, formatShortDateTime } from "@/lib/utils"

interface NewsReaderProps {
  news: News
  onClose: () => void
  onShare: (news: News) => void
}

export function NewsReader({ news, onClose, onShare }: NewsReaderProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Fecha com Escape, prende o foco dentro do diálogo e trava a rolagem do
  // fundo. Sem o focus trap, Tab levava o foco para a página atrás do modal.
  useEffect(() => {
    const panel = panelRef.current
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const focusableElements = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.getClientRects().length > 0)

    focusableElements()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab") return

      const nodes = focusableElements()
      if (nodes.length === 0) {
        event.preventDefault()
        panel?.focus()
        return
      }

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement
      const inside = !!panel && !!active && panel.contains(active)

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose])

  // Resumos truncados na origem terminam com reticências: nesse caso o
  // texto integral (quando existe) é melhor para o leitor.
  const truncated = news.excerpt.trim().endsWith("...")
  const body =
    news.content && news.content.trim().length > 0
      ? news.content
      : truncated
        ? `${news.excerpt.trimEnd()} O texto completo está disponível no portal de origem.`
        : news.excerpt

  const relative = news.publishedAt ? formatRelativeTime(news.publishedAt) : ""

  return (
    <div
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/70 p-3 backdrop-blur-sm fade-in duration-200 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={news.title}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-border bg-background p-4 shadow-2xl outline-none sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Imagem */}
        {news.image && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted">
            <Image
              src={news.image}
              alt={news.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
              {news.provider && (
                <span className="rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                  {news.provider}
                </span>
              )}
              {news.category && news.category !== "Geral" && (
                <span className="rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                  {news.category}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-futebol-600/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-futebol-700 dark:text-futebol-400">
            <Newspaper className="h-3 w-3" />
            {news.provider || "Notícia"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onShare(news)}
              className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Compartilhar"
              aria-label="Compartilhar notícia"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Título e metadados */}
        <div className="space-y-2">
          <h2 className="text-lg font-black leading-snug text-foreground sm:text-xl">
            {news.title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {news.publishedAt ? (
              <>
                <span>{formatShortDateTime(news.publishedAt)}</span>
                {relative && (
                  <>
                    <span>•</span>
                    <span>{relative}</span>
                  </>
                )}
              </>
            ) : (
              <span>{news.date}</span>
            )}
            <span>•</span>
            <span>{news.readTime} de leitura</span>
          </div>
        </div>

        {/* Texto */}
        <div className="whitespace-pre-line rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/90">
          {body}
        </div>

        {/* Ações */}
        <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row">
          {news.url && (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-futebol-600 px-4 py-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-futebol-700 sm:flex-1"
            >
              <span>Ler matéria completa no {news.provider || "portal"}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border px-4 py-3 text-xs font-semibold transition-colors hover:bg-muted sm:w-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
