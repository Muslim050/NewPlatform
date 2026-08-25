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
export type ContractStatus = 'active' | 'completed' | 'terminated'
/** Пустая строка — статус за период ещё не ставили. */
export type PaymentStatus = 'awaiting' | 'paid' | ''

/** Файл внутри сущности: скан договора, ролик. Только на чтение. */
export interface AttachedFile {
  name: string
  url: string
  addedAt: string
}

/** Поступление по договору. Суммы и порядок ведёт сервер. */
export interface Payment {
  id: number
  amount: string
  paidAt: string
  seq: number
  comment?: string
  createdBy: string
}

/** Запись в истории смен статуса оплаты. */
export interface ContractStatusEntry {
  id: number
  /** Месяц договора в формате `YYYY-MM`. */
  period: string
  status: PaymentStatus
  changedAt: string
  by: string
}

/**
 * Договор бренда. Суммы приходят строками-decimal — так сервер избегает
 * потерь точности; в рублёвых расчётах приводим их через Number().
 *
 * Деньги (`budget`, `spent`, `payments`) и статус оплаты сервер отдаёт
 * только на чтение: они правятся отдельными эндпоинтами — `/contracts/:id/
 * amounts`, `/payments`, `/payment-status`. Здесь ведутся условия договора.
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
  /** Статус оплаты по месяцам договора: ключ вида `2026-08`. */
  paymentStatusByPeriod: Record<
    string,
    { status: PaymentStatus; changedAt: string }
  >
  payments: Payment[]
  paymentLog: ContractStatusEntry[]
  /** Скан договора. Загрузка файлов идёт через `POST /files`. */
  file: AttachedFile | null
  /** Рекламный ролик договора — его заполняет рекламодатель. */
  creative: AttachedFile | null
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
> & {
  /** Скан договора: id из загрузчика файлов. `null` — убрать файл. */
  fileId?: number | null
  /** Рекламный ролик договора: id из загрузчика файлов. */
  creativeId?: number | null
}

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

/**
 * Пользователь платформы глазами админа. Пароль только на запись: наружу
 * сервер его не отдаёт ни в каком виде.
 */
export interface ManagedUser {
  id: number
  login: string
  name: string
  email: string
  role: Role
  /** Заполнен у роли advertiser: чей бренд видит пользователь. */
  advertiserId: number | null
  isActive: boolean
  createdAt: string
  version: number
}

/** Поля пользователя, которые можно отправить на сервер. */
export type ManagedUserInput = Partial<
  Pick<
    ManagedUser,
    'login' | 'name' | 'email' | 'role' | 'advertiserId' | 'isActive'
  >
> & {
  /** Пустой пароль не отправляем — прежний останется как есть. */
  password?: string
}

/** Воронка заявки: порядок статусов — как в этом списке. */
export type CampaignStatus =
  | 'sent'
  | 'received'
  | 'reviewing'
  | 'active'
  | 'completed'
  | 'awaiting_payment'
  | 'paid'
  | 'archived'

export type CampaignObjective =
  'awareness' | 'traffic' | 'conversions' | 'reach'

/**
 * Кампания. Условия договора (пакет, лиги, юр. лицо, срок, дата оплаты)
 * сервер проставляет сам по `contractNumber` — отправлять их не нужно,
 * на запись они закрыты. Денег у кампании больше нет: они на договоре.
 */
export interface Campaign {
  id: number
  /** Берётся из сессии автора заявки, на запись закрыт. */
  advertiserId: number | null
  name: string
  status: CampaignStatus
  objective: CampaignObjective | ''
  startDate: string
  endDate: string
  channelIds: number[]
  impressions: number
  clicks: number
  conversions: number
  creativeUrl: string
  creativeName: string
  creativeAddedAt: string | null
  contractNumber: string
  /** Снимок условий договора на момент создания. Только чтение. */
  package: string
  leagues: string[]
  legalName: string
  contractStart: string | null
  contractEnd: string | null
  paymentDate: string | null
  createdAt: string
  version: number
}

/**
 * Поля кампании, которые можно отправить на сервер. При создании статус
 * не отправляем: заявка всегда заводится как `sent`.
 */
export type CampaignInput = Partial<
  Pick<
    Campaign,
    | 'name'
    | 'status'
    | 'objective'
    | 'startDate'
    | 'endDate'
    | 'channelIds'
    | 'impressions'
    | 'clicks'
    | 'conversions'
    | 'creativeUrl'
    | 'creativeName'
    | 'creativeAddedAt'
    | 'contractNumber'
  >
>

/** Ответ загрузчика файлов: `POST /files`. */
export interface StoredFile {
  id: number
  name: string
  /** Путь скачивания вида `/api/v1/files/<slug>/download`. Требует токен. */
  url: string
  size: number
  mime: string
  addedAt: string
}
