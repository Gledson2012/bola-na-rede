"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react"
import { cn, percent } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"
import { ImpactStyle } from "@capacitor/haptics"
import { fetchWithTimeout } from "@/lib/api"
import type { BacktestResponse } from "@/lib/prediction"

function score(value: number | null): string {
  return value === null ? "—" : value.toFixed(3).replace(".", ",")
}

const ASSESSMENT: Record<
  BacktestResponse["assessment"],
  { text: string; className: string }
> = {
  insufficient: {
    text: "Amostra insuficiente para comparar o modelo.",
    className: "text-muted-foreground",
  },
  better: {
    text: "O modelo foi melhor que a melhor referência nesta amostra.",
    className: "text-success",
  },
  worse: {
    text: "O modelo foi pior que a melhor referência nesta amostra.",
    className: "text-destructive",
  },
  similar: {
    text: "O resultado ficou próximo da melhor referência nesta amostra.",
    className: "text-warning",
  },
}

export function BacktestPanel() {
  const [backtest, setBacktest] = useState<BacktestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  // Cancela a requisição pendente ao desmontar (ou antes de uma nova execução):
  // sem isso o `setState` do `finally` rodava depois do unmount.
  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  const runBacktest = async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const response = await fetchWithTimeout(
        "/api/analise/backtest",
        { cache: "no-store", signal: controller.signal },
        60_000
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : `Falha ao executar o backtest: ${response.status}`
        )
      }
      setBacktest((await response.json()) as BacktestResponse)
    } catch (runError) {
      // AbortError = componente desmontou ou usuário clicou de novo: ignora.
      if (runError instanceof Error && runError.name === "AbortError") return
      setError(
        runError instanceof Error
          ? runError.message
          : "Não foi possível avaliar o modelo."
      )
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const assessment = backtest ? ASSESSMENT[backtest.assessment] : null

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
              🧪
            </span>
            <h2 className="text-sm font-black text-foreground">Avaliação do Modelo (Backtest)</h2>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Backtest retrospectivo dos últimos 14 dias contra três referências (frequência de resultados, Poisson com média da liga e palpite uniforme).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runBacktest()}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {loading ? "Avaliando…" : backtest ? "Avaliar de novo" : "Executar Backtest"}
        </button>
      </div>

      {error && (
        <p
          className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/5 p-2 text-xs text-destructive"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {backtest && assessment && (
        <div className="mt-3 border-t border-border pt-3">
          <p className={cn("text-xs font-semibold", assessment.className)}>
            {assessment.text}
          </p>
          {backtest.bestBaselineLabel && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Melhor referência: {backtest.bestBaselineLabel}
            </p>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Metric
              label="Jogos avaliados"
              value={`${backtest.evaluatedMatches}/${backtest.finishedMatches}`}
              hint={`${percent(backtest.coverage)} de cobertura`}
            />
            <Metric label="Brier do modelo" value={score(backtest.modelBrierScore)} emphasis />
            <Metric
              label="Melhor referência"
              value={score(backtest.bestBaselineScore)}
              hint={backtest.bestBaselineLabel}
            />
            <Metric
              label="Palpite uniforme"
              value={score(backtest.uniformBrierScore)}
              hint="só chutando 1/3"
            />
          </div>

          <details className="mt-2 rounded-lg bg-muted/60 p-2">
            <summary className="cursor-pointer text-[11px] font-semibold">
              Todas as referências
            </summary>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
              <li className="flex justify-between gap-2">
                <span>Frequência de resultados na liga</span>
                <span className="tabular-nums">
                  {score(backtest.baselineBrierScore)}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Poisson só com a média de gols</span>
                <span className="tabular-nums">
                  {score(backtest.poissonBaselineBrierScore)}
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Palpite uniforme</span>
                <span className="tabular-nums">
                  {score(backtest.uniformBrierScore)}
                </span>
              </li>
            </ul>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Brier mede erro probabilístico: menor é melhor. Um valor acima de{" "}
              {score(backtest.uniformBrierScore)} significa que a referência não
              supera um palpite uniforme.
            </p>
          </details>

          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Resultado retrospectivo, sem garantia de desempenho futuro; a avaliação
            exige ao menos 30 jogos.
          </p>
          {backtest.unavailableDays > 0 && (
            <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400" role="status">
              A API não forneceu dados para {backtest.unavailableDays} dia(s); a
              avaliação considera apenas os dias disponíveis.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
}) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <strong
        className={cn(
          "mt-0.5 block tabular-nums",
          emphasis ? "text-base font-black" : "text-sm font-bold"
        )}
      >
        {value}
      </strong>
      {hint && (
        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  )
}
