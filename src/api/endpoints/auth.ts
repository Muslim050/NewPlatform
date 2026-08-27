import { request } from '../client'
import type { LoginRequest, LoginResponse, MeResponse } from '../types'

/** §5 спеки: `POST /auth/login` → `{ token, user }`. */
export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

/** §5 спеки: `POST /auth/logout`. */
export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' })
}

/** §5 спеки: `GET /auth/me` → `{ user }`. */
export function me(): Promise<MeResponse> {
  return request<MeResponse>('/auth/me')
}
