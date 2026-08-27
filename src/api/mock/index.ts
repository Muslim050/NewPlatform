import { getAuthToken } from '../token'
import * as auth from './auth'

/** Имитация сетевой задержки, чтобы состояния загрузки были видны в UI. */
const LATENCY_MS = 350

type Handler = (body: unknown) => unknown

/**
 * Мок-роуты. Ключ — `${method} ${path}`, как в спеке. Каждый реализованный
 * эндпоинт удаляется отсюда, когда его отдаёт настоящий бэкенд.
 */
const ROUTES: Record<string, Handler> = {
  'POST /auth/login': (body) =>
    auth.login(body as Parameters<typeof auth.login>[0]),
  'POST /auth/logout': () => undefined,
  'GET /auth/me': () => auth.me(getAuthToken()),
}

export function hasMockRoute(method: string, path: string): boolean {
  return `${method} ${path}` in ROUTES
}

export async function mockRequest<T>(
  method: string,
  path: string,
  body: unknown,
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
  return ROUTES[`${method} ${path}`](body) as T
}
