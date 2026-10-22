import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  toggleFavorite: (teamId: string) => void
  isFavorite: (teamId: string) => boolean
  togglePinnedMatch: (matchId: string) => void
  isPinnedMatch: (matchId: string) => boolean
  toggleReminder: (matchId: string) => void
  hasReminder: (matchId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      pinnedMatches: [],
      reminders: [],
      toggleFavorite: (teamId: string) => {
        set({ favorites: toggled(get().favorites, teamId) })
      },
      isFavorite: (teamId: string) => (get().favorites || []).includes(teamId),
      togglePinnedMatch: (matchId: string) => {
        set({ pinnedMatches: toggled(get().pinnedMatches, matchId) })
      },
      isPinnedMatch: (matchId: string) => (get().pinnedMatches || []).includes(matchId),
      toggleReminder: (matchId: string) => {
        set({ reminders: toggled(get().reminders, matchId) })
      },
      hasReminder: (matchId: string) => (get().reminders || []).includes(matchId),
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
        } as FavoritesState
      },
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<FavoritesState>
        return {
          ...current,
          favorites: normalizeIds(state.favorites),
          pinnedMatches: normalizeIds(state.pinnedMatches),
          reminders: normalizeIds(state.reminders),
        }
      },
    }
  )
)

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
