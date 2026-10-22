"use client"

import GlobalError from "@/components/ErrorBoundary"

/**
 * Captura erros lançados no layout raiz (fora do `app/error.tsx`), que
 * desmontariam a aplicação inteira sem nenhuma tela de recuperação.
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <GlobalError error={error} reset={reset} />
}
