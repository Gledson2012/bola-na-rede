import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchWithTimeout } from "@/lib/api"
import { extractToken } from "@/lib/auth"

/**
 * Teto por lista.
 *
 * `localStorage` tem ~5 MB e o estado é reescrito a cada alteração. Sem limite,
 * anos de favoritos/lembretes acumulados degradam a escrita e podem estourar a
 * cota (falha silenciosa do `persist`).
 */
const MAX_ITEMS = 500

/** Normaliza o que veio do storage: só strings, sem duplicatas, respeitando o teto. */
function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const unique = Array.from(
    new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))
  )
  return unique.slice(-MAX_ITEMS)
}

/** Adiciona/remove mantendo o teto (descarta os mais antigos). */
function toggled(ids: string[] = [], id: string): string[] {
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
  return next.slice(-MAX_ITEMS)
}

interface FavoritesState {
  favorites: string[]
  pinnedMatches: string[]
  reminders: string[]
  pinnedLeagues: string[]
  user: { id: string; email: string; name: string } | null
  token: string | null
  toggleFavorite: (teamId: string) => void
  isFavorite: (teamId: string) => boolean
  togglePinnedMatch: (matchId: string) => void
  isPinnedMatch: (matchId: string) => boolean
  toggleReminder: (matchId: string) => void
  hasReminder: (matchId: string) => boolean
  togglePinnedLeague: (leagueName: string) => void
  isPinnedLeague: (leagueName: string) => boolean
  setUser: (user: { id: string; email: string; name: string } | null, token: string | null) => void
  logout: () => void
  syncFavorites: () => Promise<void>
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      pinnedMatches: [],
      reminders: [],
      pinnedLeagues: [],
      user: null,
      token: null,
      toggleFavorite: (teamId: string) => {
        set({ favorites: toggled(get().favorites, teamId) })
        void syncIfAuthenticated(get())
      },
      isFavorite: (teamId: string) => (get().favorites || []).includes(teamId),
      togglePinnedMatch: (matchId: string) => {
        set({ pinnedMatches: toggled(get().pinnedMatches, matchId) })
        void syncIfAuthenticated(get())
      },
      isPinnedMatch: (matchId: string) => (get().pinnedMatches || []).includes(matchId),
      toggleReminder: (matchId: string) => {
        set({ reminders: toggled(get().reminders, matchId) })
        void syncIfAuthenticated(get())
      },
      hasReminder: (matchId: string) => (get().reminders || []).includes(matchId),
      togglePinnedLeague: (leagueName: string) => {
        set({ pinnedLeagues: toggled(get().pinnedLeagues, leagueName) })
        void syncIfAuthenticated(get())
      },
      isPinnedLeague: (leagueName: string) => (get().pinnedLeagues || []).includes(leagueName),
      setUser: (user, token) => {
        set({ user, token })
        if (user && token) {
          void syncIfAuthenticated(get())
        }
      },
      logout: () => {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        set({ user: null, token: null, favorites: [], pinnedMatches: [], reminders: [], pinnedLeagues: [] })
      },
      syncFavorites: async () => {
        const state = get()
        if (!state.token || !state.user) return

        try {
          // Envia favoritos locais para o servidor
          const res = await fetchWithTimeout("/api/auth/favorites", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.token}`,
            },
            body: JSON.stringify({
              favorites: state.favorites,
              pinnedMatches: state.pinnedMatches,
              reminders: state.reminders,
              pinnedLeagues: state.pinnedLeagues,
            }),
          })

          if (res.ok) {
            // Busca a versão do servidor (mesclando com local)
            const data = await res.json()
            set({
              favorites: normalizeIds([...state.favorites, ...(data.favorites ?? [])]),
              pinnedMatches: normalizeIds([...state.pinnedMatches, ...(data.pinnedMatches ?? [])]),
              reminders: normalizeIds([...state.reminders, ...(data.reminders ?? [])]),
              pinnedLeagues: normalizeIds([...state.pinnedLeagues, ...(data.pinnedLeagues ?? [])]),
            })
          }
        } catch {
          // Falha silenciosa: mantém os dados locais
        }
      },
    }),
    {
      name: 'futebol-favorites',
      // Avoid server/client hydration mismatches: rehydrate after mount
      skipHydration: true,
      version: 1,
      /**
       * Sem `version`, um formato antigo (ou corrompido) no `localStorage`
       * entrava direto no estado. Aqui qualquer versão é limpa e normalizada.
       */
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<FavoritesState>
        return {
          favorites: normalizeIds(state.favorites),
          pinnedMatches: normalizeIds(state.pinnedMatches),
          reminders: normalizeIds(state.reminders),
          pinnedLeagues: normalizeIds(state.pinnedLeagues),
          user: null,
          token: null,
        } as FavoritesState
      },
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<FavoritesState>
        return {
          ...current,
          favorites: normalizeIds(state.favorites),
          pinnedMatches: normalizeIds(state.pinnedMatches),
          reminders: normalizeIds(state.reminders),
          pinnedLeagues: normalizeIds(state.pinnedLeagues),
          user: null,
          token: null,
        }
      },
    }
  )
)

/** Sincroniza favoritos com o servidor se houver um usuário autenticado. */
async function syncIfAuthenticated(state: FavoritesState) {
  if (state.token && state.user) {
    await state.syncFavorites()
  }
}

/**
 * Seletores reativos.
 *
 * `isFavorite`/`isPinnedMatch` do store leem `get()` no momento da chamada:
 * a função é estável, mas o valor lido só muda se o componente for
 * re-renderizado por outro motivo. Quem memoiza com elas como dependência
 * (ex.: `useMemo(..., [matches, isPinnedMatch])`) nunca recalcula.
 *
 * Estes seletores retornam um booleano derivado do estado, então o Zustand
 * só re-renderiza o componente quando o valor realmente muda.
 */
export function useIsFavorite(teamId: string): boolean {
  return useFavoritesStore((state) => (state.favorites || []).includes(teamId))
}

export function useIsPinnedMatch(matchId: string): boolean {
  return useFavoritesStore((state) => (state.pinnedMatches || []).includes(matchId))
}

export function useHasReminder(matchId: string): boolean {
  return useFavoritesStore((state) => (state.reminders || []).includes(matchId))
}

export function useIsPinnedLeague(leagueName: string): boolean {
  return useFavoritesStore((state) => (state.pinnedLeagues || []).includes(leagueName))
}

export function useAuth() {
  return useFavoritesStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: !!state.user,
    setUser: state.setUser,
    logout: state.logout,
  }))
}

export type ThemeMode = "system" | "light" | "dark"

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme: ThemeMode) => set({ theme }),
    }),
    {
      name: "futebol-theme",
      skipHydration: true,
    }
  )
)