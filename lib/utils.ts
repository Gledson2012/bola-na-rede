import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** "há 5 min", "há 2 h", "há 3 dias" — para conteúdo recente. */
export function formatRelativeTime(iso: string, now = new Date()): string {
  const published = new Date(iso)
  if (Number.isNaN(published.getTime())) return ""

  const seconds = Math.round((now.getTime() - published.getTime()) / 1000)
  if (seconds < 60) return "agora"
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `há ${minutes} min`
  }
  if (seconds < 86_400) {
    const hours = Math.floor(seconds / 3600)
    return `há ${hours} h`
  }
  const days = Math.floor(seconds / 86_400)
  if (days < 30) return `há ${days} ${days === 1 ? "dia" : "dias"}`
  const months = Math.floor(days / 30)
  return `há ${months} ${months === 1 ? "mês" : "meses"}`
}

/** Data curta com hora: "22 de out. · 08:30" (inclui o ano quando não é o atual). */
export function formatShortDateTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const day = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear()
      ? { year: "numeric" as const }
      : {}),
  })
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${day} · ${time}`
}

/** Formata uma probabilidade (0–1) como porcentagem: "62,4%". */
export function percent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return `${(value * 100).toFixed(1).replace(".", ",")}%`
}

/** Formata uma odd (ex: 1.50) para o padrão brasileiro (ex: "1,50"). */
export function formatOdd(value: number): string {
  return value.toFixed(2).replace(".", ",")
}

/**
 * Copia texto para a área de transferência.
 *
 * `navigator.clipboard` pode não existir (contexto não seguro) ou rejeitar
 * (permissão negada, WebView). Retorna `false` em vez de lançar, para a UI
 * poder avisar o usuário em vez de dizer "copiado" sem ter copiado nada.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
