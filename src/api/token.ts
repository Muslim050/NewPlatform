/**
 * Держатель токена. Отдельный модуль, чтобы им могли пользоваться и
 * транспорт, и мок, не импортируя друг друга. Значение сюда кладёт
 * authStore при каждом изменении сессии.
 */
let authToken: string | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}
