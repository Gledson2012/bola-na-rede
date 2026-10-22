"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface TeamLogoProps {
  src?: string
  name: string
  size?: number
  className?: string
  /** Cor do clube, usada no fallback com a inicial. */
  color?: string
}

/**
 * Escudo do time com fallback para a inicial quando a imagem não existe.
 * Compartilhado entre os cards para não repetir a mesma lógica.
 */
export function TeamLogo({ src, name, size = 36, className, color }: TeamLogoProps) {
  const [hasError, setHasError] = useState(false)
  const initial = name.trim().charAt(0).toUpperCase() || "⚽"

  if (!src || hasError) {
    return (
      <span
        style={{
          width: size,
          height: size,
          backgroundColor: color ? `${color}22` : undefined,
          color: color ?? undefined,
        }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground",
          className
        )}
        role="img"
        aria-label={`Escudo de ${name} indisponível`}
      >
        {initial}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={`Escudo de ${name}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        "shrink-0 rounded-full border border-border bg-white object-contain p-0.5",
        className
      )}
      onError={() => setHasError(true)}
      unoptimized
    />
  )
}
