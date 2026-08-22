import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '@/api/endpoints/auth'
import type { LoginRequest } from '@/api/types'
import { useAuthStore } from '@/stores/authStore'

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

/**
 * Вход. Сессию кладём в authStore — он и есть источник правды о пользователе;
 * Query отвечает только за сам запрос и его состояния.
 */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const client = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: ({ token, user }) => {
      setSession({ token, user })
      client.setQueryData(authKeys.me(), { user })
    },
  })
}

/** Выход. Локальную сессию чистим в любом случае — даже если запрос упал. */
export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const client = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession()
      client.clear()
    },
  })
}

/** Проверка живости сессии: `GET /auth/me`. Запускается только с токеном. */
export function useMe() {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    enabled: !!token,
  })
}
