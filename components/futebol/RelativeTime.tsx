"use client"

import { useEffect, useState } from "react"
import { formatRelativeTime } from "@/lib/utils"

interface RelativeTimeProps {
  /** Data de publicação em ISO 8601. */
  iso?: string
  /** Texto exibido antes da hidratação (evita divergência servidor/cliente). */
  fallback: string
}

/**
 * Tempo relativo ("há 5 min") atualizado a cada minuto.
 *
 * O valor inicial é o texto absoluto para que a marcação do servidor e a do
 * cliente coincidam na hidratação; o tempo relativo entra depois, em efeito.
 */
export function RelativeTime({ iso, fallback }: RelativeTimeProps) {
  const [label, setLabel] = useState(fallback)

  useEffect(() => {
    if (!iso) return

    const update = () => {
      const relative = formatRelativeTime(iso)
      if (relative) setLabel(relative)
    }

    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [iso])

  return <span suppressHydrationWarning>{label}</span>
}
