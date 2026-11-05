/**
 * Normalização do envelope de resposta da API de futebol.
 *
 * Parte dos endpoints passou a responder `{ code, message, data, count }`
 * enquanto outros continuam devolvendo o valor puro (array ou objeto). O app
 * precisa aceitar os dois formatos: sem isso, `.map`/spread recebiam o
 * envelope e quebravam em runtime.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Devolve `data` quando o payload tem o formato de envelope conhecido; caso
 * contrário, devolve o próprio payload. A checagem exige `code` numérico e a
 * chave `data` para não desembrulhar por engano um objeto de domínio.
 */
export function unwrapApiPayload<T>(payload: unknown): T {
  if (!isRecord(payload) || !("data" in payload)) return payload as T
  if (typeof payload.code !== "number") return payload as T

  return payload.data as T
}
