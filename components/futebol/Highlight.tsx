"use client"

/**
 * Realce de termo de busca.
 *
 * A implementação anterior montava o HTML como string (`"<span ...>$1</span>"`)
 * e devolvia isso como `title`/`excerpt`. O React escapa strings, então o
 * usuário via as tags literais na tela. Aqui o texto é fatiado em JSX e cada
 * ocorrência é renderizada como `<mark>`, que é o elemento semântico correto
 * para um termo encontrado.
 */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function Highlight({
  text,
  query,
  className = "font-semibold text-primary",
}: {
  text: string
  query: string
  className?: string
}) {
  const term = query.trim()
  if (!term) return <>{text}</>

  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, "gi"))

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className={className}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  )
}
