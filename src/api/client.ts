import { ApiError, NetworkError, type ApiErrorBody } from './errors'
import { mockRequest, hasMockRoute } from './mock'
import { getAuthToken } from './token'

/**
 * Базовый префикс из §5 спеки. Пока бэкенда нет, `VITE_API_URL` не задан —
 * тогда запросы уходят в мок-транспорт (src/api/mock). Как только появится
 * сервер, достаточно задать переменную окружения: код эндпоинтов не меняется.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const API_PREFIX = '/api/v1'

export const isMockMode = !BASE_URL

/** Вызывается на 401/403: сессия протухла — приложение должно разлогиниться. */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody = {
    code: 'unknown',
    message: `Ошибка ${response.status}`,
  }
  try {
    const payload = await response.json()
    if (payload?.error) body = payload.error
  } catch {
    // Сервер ответил не-JSON — оставляем заготовку выше.
  }
  return new ApiError(response.status, body)
}

/**
 * Единственная точка выхода в сеть. Все эндпоинты идут через неё:
 * здесь живут префикс, токен, разбор ошибок и реакция на 401.
 */
export async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  if (isMockMode) {
    if (!hasMockRoute(method, path)) {
      throw new ApiError(404, {
        code: 'mock_route_missing',
        message: `Мок для ${method} ${path} не реализован`,
      })
    }
    return mockRequest<T>(method, path, body)
  }

  const token = getAuthToken()
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    throw new NetworkError(cause)
  }

  if (!response.ok) {
    const error = await parseError(response)
    if (error.isAuthError) onUnauthorized?.()
    throw error
  }

  // 204 и пустое тело — валидный ответ без данных.
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
