/**
 * Datas de calendário no fuso do aplicativo.
 *
 * A API expõe datas por dia (`/matches?date=YYYY-MM-DD`) e o app monta janelas
 * de histórico e de backtest a partir de "hoje". Usar `Date#toISOString()`
 * (UTC) fazia o dia virar às 21h de Brasília: no fim da noite a janela pulava
 * um dia, a rodada em andamento ficava de fora e o backtest deslocava.
 *
 * `shiftDate` continua sendo aritmética pura de calendário (`YYYY-MM-DD`), sem
 * fuso: somar dias a uma data já normalizada não depende de horário local.
 */

/** Fuso usado para decidir a que dia pertence uma partida. */
export const APP_TIME_ZONE = "America/Sao_Paulo"

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

/** Data de calendário (`YYYY-MM-DD`) de `now` no fuso do app. */
export function todayInTimeZone(now: Date = new Date()): string {
  const parts = dateFormatter.formatToParts(now)
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? ""

  return `${value("year")}-${value("month")}-${value("day")}`
}

/** Soma `days` a uma data `YYYY-MM-DD`, atravessando meses e anos. */
export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}
