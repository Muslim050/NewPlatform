/**
 * Формат ошибки из §5 спеки:
 * `{ "error": { "code", "message", "fields": {} } }`
 */
export interface ApiErrorBody {
  code: string
  message: string
  /** Ошибки по полям формы: `{ login: 'Неверный логин' }`. */
  fields?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.fields = body.fields ?? {}
  }

  /** 401/403 — сессия недействительна, пользователя надо разлогинить. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403
  }
}

/** Сеть недоступна / запрос не дошёл. Отличаем от ответа сервера с ошибкой. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Не удалось связаться с сервером')
    this.name = 'NetworkError'
    this.cause = cause
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
