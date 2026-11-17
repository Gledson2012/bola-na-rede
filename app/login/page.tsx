"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, User, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { fetchWithTimeout } from "@/lib/api"
import { cn } from "@/lib/utils"

type Mode = "login" | "register"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body: Record<string, string> = { email, password }
      if (mode === "register") body.name = name

      const res = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao autenticar.")
        setLoading(false)
        return
      }

      // Salva o token no localStorage e redireciona
      if (data.token) {
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("auth_user", JSON.stringify(data.user))
        setSuccess(mode === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso!")
        setTimeout(() => router.replace("/"), 800)
      }
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [email, name, password, mode, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] px-4 py-6">
      <PageHeader
        title={mode === "login" ? "Entrar" : "Criar conta"}
        subtitle={
          mode === "login"
            ? "Acesse para sincronizar seus favoritos em todos os dispositivos."
            : "Cadastre-se para salvar seus times e partidas."
        }
        eyebrow="Conta"
      />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-3"
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </label>
          {mode === "register" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </label>
            </div>
          )}
          <label className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </label>
        </div>

        {error && (
          <p className="text-[11px] text-destructive text-center">{error}</p>
        )}
        {success && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="press w-full rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4 animate-spin" />
              <span>Aguardando…</span>
            </span>
          ) : (
            mode === "login" ? "Entrar" : "Criar conta"
          )}
        </button>
      </form>

      <p className="mt-4 text-[10px] text-muted-foreground text-center">
        {mode === "login"
          ? "Não tem uma conta? "
          : "Já tem uma conta? "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-primary font-bold underline underline-offset-4 hover:text-primary/80"
        >
          {mode === "login" ? "Cadastre-se" : "Faça login"}
        </button>
      </p>
    </div>
  )
}