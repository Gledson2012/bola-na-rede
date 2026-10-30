import Link from "next/link"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-base font-black text-foreground">Página não encontrada</h2>
      <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        href="/jogos"
        className="press mt-4 rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground"
      >
        Voltar para Jogos
      </Link>
    </div>
  )
}
