/**
 * Доменные типы API. Соответствуют схеме
 * https://setanta.pythonanywhere.com/api/v1/schema — при изменениях
 * на бэкенде правим здесь, а не по компонентам.
 */

/** Роли из RoleEnum. */
export type Role = 'admin' | 'viewer' | 'advertiser'

/** Схема User. Идентификаторы на бэкенде числовые. */
export interface User {
  id: number
  role: Role
  name: string
  email: string
  /** Заполнен только у роли advertiser. */
  advertiserId: number | null
}

export interface LoginRequest {
  /** Регистр не важен — сервер приводит сам. */
  login: string
  password: string
}

/** Пара JWT: access живёт 15 минут, refresh меняется при каждом обновлении. */
export interface TokenPair {
  access: string
  refresh: string
}

export interface LoginResponse extends TokenPair {
  user: User
}

export type RefreshResponse = TokenPair

export interface MeResponse {
  user: User
}
