"use client"

import { useState } from "react"
import Image from "next/image"
import type { News } from "@/types"
import { ExternalLink, Clock, Newspaper, Share2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface NewsCardProps {
  news: News
  onOpenReader?: (news: News) => void
  featured?: boolean
}

const fallbackSportsImages = [
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
  "https://images.unsplash.com/photo-1489944445391-11dd35574ca6?w=800&q=80",
]

export function NewsCard({ news, onOpenReader, featured = false }: NewsCardProps) {
  const [imgError, setImgError] = useState(false)

  const defaultImg = fallbackSportsImages[Math.abs(news.title.length) % fallbackSportsImages.length]
  const imageSrc = !imgError && news.image ? news.image : defaultImg

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onOpenReader) {
      onOpenReader(news)
    } else if (news.url) {
      window.open(news.url, "_blank", "noopener,noreferrer")
    }
  }

  // Featured Large Banner Mode
  if (featured) {
    return (
      <div
        onClick={handleClick}
        className="group relative block overflow-hidden rounded-3xl border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        <div className="relative aspect-[21/9] sm:aspect-[2/1] w-full overflow-hidden bg-muted">
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
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-futebol-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
              Destaque
            </span>
            {news.provider && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                {news.provider}
              </span>
            )}
          </div>

          {/* Title and Excerpt overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5 text-white">
            <h2 className="text-base sm:text-xl font-black leading-tight drop-shadow-md group-hover:text-futebol-300 transition-colors line-clamp-2">
              {news.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 drop-shadow-sm font-normal">
              {news.excerpt}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-white/70 pt-1 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {news.date}
              </span>
              <span>•</span>
              <span>{news.readTime}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-futebol-300 font-bold group-hover:translate-x-1 transition-transform">
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
      onClick={handleClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-futebol-400/60 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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

        {/* Source Provider badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
            {news.provider || "Esporte"}
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-medium text-white">
          <Clock className="w-3 h-3 text-futebol-400" />
          <span>{news.readTime}</span>
        </div>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-2 group-hover:text-futebol-600 transition-colors">
            {news.title}
          </h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {news.excerpt}
          </p>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{news.date}</span>
          <div className="flex items-center gap-1 text-futebol-600 font-bold group-hover:translate-x-0.5 transition-transform">
            <span>Abrir</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  )
}
