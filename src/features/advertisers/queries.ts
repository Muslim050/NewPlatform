import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as advertisersApi from '@/api/endpoints/advertisers'
import { useAuth } from '@/features/auth/useAuth'
import { PAGE_SIZE, fetchAllPages } from '@/lib/paginate'
import type {
  Advertiser,
  AdvertiserInput,
  Contract,
  ContractInput,
} from '@/api/types'

export const advertiserKeys = {
  all: ['advertisers'] as const,
  list: () => [...advertiserKeys.all, 'list'] as const,
  card: (id: number) => [...advertiserKeys.all, 'card', id] as const,
}

/**
 * Все бренды списком. Экран показывает карточки целиком и ищет по ним
 * локально, поэтому страницы дочитываются сразу. Когда брендов станет
 * заметно больше сотни, это место превратится в useInfiniteQuery.
 */
export function useAdvertisers({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: advertiserKeys.list(),
    queryFn: (): Promise<Advertiser[]> =>
      fetchAllPages((cursor) =>
        advertisersApi.list({ cursor, limit: PAGE_SIZE }),
      ),
    enabled,
  })
}

/** Одна карточка бренда вместе с договорами. */
export function useAdvertiser(id: number | null | undefined) {
  return useQuery({
    queryKey: advertiserKeys.card(id ?? 0),
    queryFn: (): Promise<Advertiser> => advertisersApi.get(id as number),
    enabled: !!id,
  })
}

/**
 * Бренды, которые видит текущий пользователь. Площадке доступен весь список,
 * рекламодателю — только его собственный бренд: список брендов ему закрыт,
 * и запрос к нему вернул бы 403, то есть выкинул бы из сессии.
 */
export function useVisibleAdvertisers() {
  const { user, isAdvertiser } = useAuth()
  const list = useAdvertisers({ enabled: !isAdvertiser })
  const own = useAdvertiser(isAdvertiser ? user?.advertiserId : null)

  if (!isAdvertiser) return list
  return { ...own, data: own.data ? [own.data] : undefined }
}

/**
 * Сравнение значения из формы с тем, что пришло с сервера. Сервер отдаёт
 * `null` там, где форма держит пустую строку, — для нас это одно и то же.
 */
function isSameValue(before: unknown, after: unknown): boolean {
  if (Array.isArray(before) || Array.isArray(after)) {
    const left = Array.isArray(before) ? before : []
    const right = Array.isArray(after) ? after : []
    return (
      left.length === right.length &&
      left.every((item, index) => item === right[index])
    )
  }

  const left = before ?? ''
  const right = after ?? ''
  if (left === right) return true

  // Суммы приходят как decimal-строки: «890000.00» и «890000» — одно и то же.
  const leftNumber = Number(left)
  const rightNumber = Number(right)
  return (
    left !== '' &&
    right !== '' &&
    Number.isFinite(leftNumber) &&
    Number.isFinite(rightNumber) &&
    leftNumber === rightNumber
  )
}

/**
 * Правда ли, что отправлять нечего. Сравниваем только те поля, которые форма
 * собирается отправить: остальное она не трогает.
 */
function isUnchanged(
  before: Record<string, unknown> | undefined,
  fields: Record<string, unknown>,
): boolean {
  if (!before) return false
  return Object.entries(fields).every(([key, value]) =>
    isSameValue(before[key], value),
  )
}

/** Договор в форме: у нового id ещё локальный, строковый. */
export interface EditableContract extends ContractInput {
  id: number | string
}

/**
 * Приводит договоры бренда к тому, что собрано в форме. Внутри бренда они
 * доступны только на чтение, поэтому правим их поштучно: убранные удаляем,
 * новые создаём, изменённые обновляем. Нетронутые пропускаем — иначе правка
 * одного поля бренда тянула бы за собой запрос на каждый его договор.
 */
async function syncContracts(
  advertiserId: number,
  next: EditableContract[],
  previous: Contract[],
): Promise<boolean> {
  let changed = false
  const keptIds = new Set(
    next.map((contract) => contract.id).filter((id) => typeof id === 'number'),
  )
  const previousById = new Map(
    previous.map((contract) => [contract.id, contract]),
  )

  for (const contract of previous) {
    if (!keptIds.has(contract.id)) {
      await advertisersApi.contracts.remove(advertiserId, contract.id)
      changed = true
    }
  }

  for (const { id, ...fields } of next) {
    if (typeof id !== 'number') {
      await advertisersApi.contracts.create(advertiserId, fields)
      changed = true
      continue
    }
    const before = previousById.get(id) as unknown as Record<string, unknown>
    if (isUnchanged(before, fields)) continue
    await advertisersApi.contracts.update(advertiserId, id, fields)
    changed = true
  }

  return changed
}

export interface SaveAdvertiserInput {
  /** Пусто — создаём нового. */
  id?: number
  advertiser: AdvertiserInput
  contracts: EditableContract[]
  /** Бренд, каким он пришёл с сервера, — чтобы не слать правку без правок. */
  previousAdvertiser?: Advertiser | null
  /** Договоры, какими они пришли с сервера, — чтобы понять, что удалено. */
  previousContracts: Contract[]
}

/**
 * Сохранение карточки бренда целиком: сам бренд и его договоры. Договоры
 * идут отдельными запросами — так устроен API.
 */
export function useSaveAdvertiser() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      advertiser,
      contracts,
      previousAdvertiser,
      previousContracts,
    }: SaveAdvertiserInput) => {
      // Сам бренд трогаем, только если в его полях что-то поменялось:
      // правка одних договоров не должна дёргать карточку.
      const advertiserId = id ?? (await advertisersApi.create(advertiser)).id
      const advertiserChanged =
        !id ||
        !isUnchanged(
          previousAdvertiser as unknown as Record<string, unknown>,
          advertiser,
        )

      if (id && advertiserChanged) {
        await advertisersApi.update(id, advertiser)
      }

      const contractsChanged = await syncContracts(
        advertiserId,
        contracts,
        previousContracts,
      )

      // Менять было нечего — не ходим на сервер и за карточкой.
      if (!advertiserChanged && !contractsChanged && previousAdvertiser) {
        return previousAdvertiser
      }

      // Возвращаем карточку с сервера: у созданных договоров появились
      // настоящие id, и форма должна узнать о них — иначе повторное
      // сохранение создало бы их заново.
      return advertisersApi.get(advertiserId)
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

export function useDeleteAdvertiser() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => advertisersApi.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}
