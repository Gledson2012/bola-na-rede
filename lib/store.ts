import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        const { favorites = [] } = get()
        const next = favorites.includes(teamId)
          ? favorites.filter((id) => id !== teamId)
          : [...favorites, teamId]
        set({ favorites: next })
      },
      isFavorite: (teamId: string) => (get().favorites || []).includes(teamId),
      togglePinnedMatch: (matchId: string) => {
        const { pinnedMatches = [] } = get()
        const next = pinnedMatches.includes(matchId)
          ? pinnedMatches.filter((id) => id !== matchId)
          : [...pinnedMatches, matchId]
        set({ pinnedMatches: next })
      },
      isPinnedMatch: (matchId: string) => (get().pinnedMatches || []).includes(matchId),
      toggleReminder: (matchId: string) => {
        const { reminders = [] } = get()
        const next = reminders.includes(matchId)
          ? reminders.filter((id) => id !== matchId)
          : [...reminders, matchId]
        set({ reminders: next })
      },
      hasReminder: (matchId: string) => (get().reminders || []).includes(matchId),
    }),
    {
      name: 'futebol-favorites',
      // Avoid server/client hydration mismatches: rehydrate after mount
      skipHydration: true,
    }
  )
)