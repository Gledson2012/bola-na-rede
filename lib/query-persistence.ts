import type { Query } from "@tanstack/react-query"

/**
 * Chaves cujo último resultado vale restaurar quando o app abre sem rede.
 *
 * O cache persistido é somente leitura: a próxima consulta bem-sucedida
 * substitui o valor. Consultas de detalhe (partida/time) entram pelas mesmas
 * raízes `matches`/`teams`, então abrir um jogo já visto também funciona
 * offline.
 */
const PERSISTED_ROOTS = new Set([
  "matches",
  "news",
  "teams",
  "competitions",
  "analysis",
])

export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== "success") return false

  const [root] = query.queryKey
  return typeof root === "string" && PERSISTED_ROOTS.has(root)
}
