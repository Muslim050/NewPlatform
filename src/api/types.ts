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

/** Курсорная пагинация: `nextCursor === null` — страница последняя. */
export interface Paginated<T> {
  items: T[]
  nextCursor: string | null
  total: number
}

export type AdvertiserStatus = 'active' | 'paused'
export type ContractPackage = 'partner' | 'general' | 'presenter'
export type ContractStatus = 'draft' | 'active' | 'closed'
export type PaymentStatus = 'awaiting' | 'paid'

/**
 * Договор бренда. Суммы приходят строками-decimal — так сервер избегает
 * потерь точности; в рублёвых расчётах приводим их через Number().
 */
export interface Contract {
  id: number
  number: string
  campaignName: string
  legalName: string
  package: ContractPackage | ''
  leagues: string[]
  start: string | null
  end: string | null
  paymentDate: string | null
  status: ContractStatus
  budget: string
  spent: string
  paymentStatus: PaymentStatus
  paymentStatusAt: string | null
  version: number
}

/** Поля договора, которые можно отправить на сервер. */
export type ContractInput = Partial<
  Pick<
    Contract,
    | 'number'
    | 'campaignName'
    | 'legalName'
    | 'package'
    | 'leagues'
    | 'start'
    | 'end'
    | 'paymentDate'
    | 'status'
  >
>

export interface Advertiser {
  id: number
  name: string
  contact: string
  email: string
  category: string
  status: AdvertiserStatus
  legalName: string
  balance: string
  color: string
  logo: string | null
  requisites: string
  /** Только для чтения: договоры правятся своими эндпоинтами. */
  contracts: Contract[]
  createdAt: string
  version: number
}

/** Поля бренда, которые можно отправить на сервер. */
export type AdvertiserInput = Partial<
  Pick<
    Advertiser,
    | 'name'
    | 'contact'
    | 'email'
    | 'category'
    | 'status'
    | 'legalName'
    | 'balance'
    | 'color'
    | 'logo'
    | 'requisites'
  >
>
