"use client"

import { useEffect, useState } from "react"
import { useFavoritesStore } from "@/lib/store"
import { verifyToken } from "@/lib/auth"

function loadStoredUser(): {
  user: { id: string; email: string; name: string } | null
  token: string | null
} {
  if (typeof window === "undefined") return { user: null, token: null }

  const token = localStorage.getItem("auth_token")
  const userJson = localStorage.getItem("auth_user")
  if (!token || !userJson) return { user: null, token: null }

  const payload = verifyToken(token)
  if (!payload) {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    return { user: null, token: null }
  }

  try {
    const user = JSON.parse(userJson) as { id: string; email: string; name: string }
    return { user, token }
  } catch {
    return { user: null, token: null }
  }
}

/**
 * Restaura a sessão de autenticação do localStorage ao montar o app.
 *
 * Se houver um token válido, carrega o usuário e dispara a sincronização de
 * favoritos com o servidor. Se o token estiver expirado, limpa o localStorage.
 */
export function AuthInitializer() {
  const { setUser } = useFavoritesStore()
  const [initialized, setInitialized] = useState(false)
  const [restored, setRestored] = useState(false)

  // Restaura a sessão uma vez no mount (setState via setTimeout para evitar
  // cascading renders detectados pelo ESLint react-hooks/set-state-in-effect)
  useEffect(() => {
    if (restored) return
    const timer = setTimeout(() => {
      const { user, token } = loadStoredUser()
      if (user && token) {
        setUser(user, token)
      }
      setRestored(true)
      setInitialized(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [restored, setUser])

  if (!initialized) return null
  return null
}