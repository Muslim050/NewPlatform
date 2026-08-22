import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAuthToken } from '@/api/token'
import type { Role, User } from '@/api/types'

const STORAGE_KEY = 'setanta.auth.v2'

interface AuthState {
  token: string | null
  user: User | null
  setSession: (session: { token: string; user: User }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ token, user }) => {
        setAuthToken(token)
        set({ token, user })
      },
      clearSession: () => {
        setAuthToken(null)
        set({ token: null, user: null })
      },
    }),
    {
      name: STORAGE_KEY,
      // Токен восстанавливаем в транспорт сразу после гидрации из
      // localStorage — иначе первый же запрос уйдёт без Authorization.
      onRehydrateStorage: () => (state) => {
        setAuthToken(state?.token ?? null)
      },
    },
  ),
)

/** Права, выведенные из роли. Держим здесь, чтобы не дублировать по экранам. */
export function permissionsFor(role: Role | undefined) {
  return {
    // viewer видит те же экраны, что и админ, но ничего не меняет.
    isAdmin: role === 'admin' || role === 'viewer',
    isAdvertiser: role === 'advertiser',
    isViewer: role === 'viewer',
    canEdit: !!role && role !== 'viewer',
  }
}
