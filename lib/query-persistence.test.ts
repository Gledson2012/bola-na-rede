import { describe, expect, it } from "vitest"
import type { Query } from "@tanstack/react-query"
import { shouldPersistQuery } from "@/lib/query-persistence"

function query(queryKey: unknown[], status = "success"): Query {
  return { queryKey, state: { status } } as unknown as Query
}

describe("shouldPersistQuery", () => {
  it("persiste as raízes de dados usadas pelas telas", () => {
    expect(shouldPersistQuery(query(["matches", "global"]))).toBe(true)
    expect(shouldPersistQuery(query(["news"]))).toBe(true)
    expect(shouldPersistQuery(query(["teams", "all"]))).toBe(true)
    expect(shouldPersistQuery(query(["competitions", "table", "bra.1"]))).toBe(
      true
    )
    expect(shouldPersistQuery(query(["analysis"]))).toBe(true)
  })

  it("ignora consultas que falharam ou ainda carregam", () => {
    expect(shouldPersistQuery(query(["matches"], "error"))).toBe(false)
    expect(shouldPersistQuery(query(["matches"], "loading"))).toBe(false)
    expect(shouldPersistQuery(query(["matches"], "pending"))).toBe(false)
  })

  it("ignora chaves fora da allowlist", () => {
    expect(shouldPersistQuery(query(["backtest"]))).toBe(false)
    expect(shouldPersistQuery(query(["push"]))).toBe(false)
  })

  it("exige o primeiro item da chave como string", () => {
    expect(shouldPersistQuery(query([42]))).toBe(false)
    expect(shouldPersistQuery(query([]))).toBe(false)
  })
})
