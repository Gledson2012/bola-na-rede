// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorFallback } from "@/components/ErrorBoundary"

describe("ErrorFallback", () => {
  it("renderiza mensagem e botão de retry", () => {
    const onRetry = vi.fn()
    render(<ErrorFallback message="falhou" onRetry={onRetry} />)
    expect(screen.getByText("falhou")).toBeInTheDocument()
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Tentar novamente"))
    expect(onRetry).toHaveBeenCalled()
  })

  it("usa mensagem padrão quando não fornecida", () => {
    render(<ErrorFallback />)
    expect(screen.getByText("Não foi possível carregar")).toBeInTheDocument()
  })
})