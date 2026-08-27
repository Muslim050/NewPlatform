/**
 * Доменные типы API. Соответствуют docs/backend-spec.md — при появлении
 * бэкенда правим здесь, а не по компонентам.
 */

/** Роли из §1 спеки. */
export type Role = 'admin' | 'viewer' | 'advertiser'

/** `user` из ответа `POST /auth/login` и `GET /auth/me`. */
export interface User {
  id: string
  role: Role
  name: string
  email: string
  /** Обязателен для роли advertiser, у остальных ролей — null. */
  advertiserId: string | null
}

export interface LoginRequest {
  login: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface MeResponse {
  user: User
}
