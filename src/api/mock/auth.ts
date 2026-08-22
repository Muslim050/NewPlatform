import { ApiError } from '../errors'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  Role,
  User,
} from '../types'
import { getState } from '@/lib/store.js'

/**
 * Демо-учётки — те же, что были захардкожены в Login. Пока бэкенда нет,
 * это единственное место, где живут пароли; с появлением `/auth/login`
 * весь файл удаляется.
 */
const DEMO_ACCOUNTS: Record<string, { password: string; role: Role }> = {
  admin: { password: 'admin', role: 'admin' },
  viewer: { password: 'viewer', role: 'viewer' },
  adv: { password: 'adv', role: 'advertiser' },
}

/** Токен кодирует роль, чтобы `GET /auth/me` пережил перезагрузку страницы. */
const TOKEN_PREFIX = 'mock-token.'

function firstAdvertiser(): { id: string; contact: string; email: string } {
  const advertisers = getState().advertisers ?? []
  const advertiser = advertisers[0]
  if (!advertiser) {
    throw new ApiError(500, {
      code: 'no_advertisers',
      message: 'В демо-базе нет ни одного рекламодателя',
    })
  }
  return advertiser
}

function userFor(role: Role): User {
  if (role === 'advertiser') {
    const advertiser = firstAdvertiser()
    return {
      id: `user-${advertiser.id}`,
      role,
      advertiserId: advertiser.id,
      name: advertiser.contact,
      email: advertiser.email,
    }
  }
  return {
    id: `user-${role}`,
    role,
    advertiserId: null,
    name: role,
    email: `${role}@setantasports.com`,
  }
}

export function login({ login, password }: LoginRequest): LoginResponse {
  const account = DEMO_ACCOUNTS[login.trim().toLowerCase()]

  if (!account || account.password !== password) {
    throw new ApiError(401, {
      code: 'invalid_credentials',
      message: 'Неверный логин или пароль',
    })
  }

  return {
    token: `${TOKEN_PREFIX}${account.role}`,
    user: userFor(account.role),
  }
}

export function me(token: string | null): MeResponse {
  const role = token?.startsWith(TOKEN_PREFIX)
    ? (token.slice(TOKEN_PREFIX.length) as Role)
    : null

  if (!role || !['admin', 'viewer', 'advertiser'].includes(role)) {
    throw new ApiError(401, {
      code: 'unauthorized',
      message: 'Сессия недействительна',
    })
  }

  return { user: userFor(role) }
}
