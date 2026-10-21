import Link from "next/link"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Página não encontrada</h2>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        O endereço acessado não existe ou foi movido.
      </p>
      <Link
        href="/jogos"
        className="mt-4 px-4 py-2 rounded-xl bg-futebol-600 text-white text-xs font-bold hover:bg-futebol-700 transition-colors"
      >
        ← Voltar para Jogos
      </Link>
    </div>
  )
}
