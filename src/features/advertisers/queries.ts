import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as advertisersApi from '@/api/endpoints/advertisers'
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
}

/**
 * Все бренды списком. Экран показывает карточки целиком и ищет по ним
 * локально, поэтому страницы дочитываются сразу. Когда брендов станет
 * заметно больше сотни, это место превратится в useInfiniteQuery.
 */
export function useAdvertisers() {
  return useQuery({
    queryKey: advertiserKeys.list(),
    queryFn: (): Promise<Advertiser[]> =>
      fetchAllPages((cursor) =>
        advertisersApi.list({ cursor, limit: PAGE_SIZE }),
      ),
  })
}

/** Договор в форме: у нового id ещё локальный, строковый. */
export interface EditableContract extends ContractInput {
  id: number | string
}

/**
 * Приводит договоры бренда к тому, что собрано в форме. Внутри бренда они
 * доступны только на чтение, поэтому правим их поштучно: убранные удаляем,
 * новые создаём, остальные обновляем.
 */
async function syncContracts(
  advertiserId: number,
  next: EditableContract[],
  previous: Contract[],
): Promise<void> {
  const keptIds = new Set(
    next.map((contract) => contract.id).filter((id) => typeof id === 'number'),
  )

  for (const contract of previous) {
    if (!keptIds.has(contract.id)) {
      await advertisersApi.contracts.remove(advertiserId, contract.id)
    }
  }

  for (const { id, ...fields } of next) {
    if (typeof id === 'number') {
      await advertisersApi.contracts.update(advertiserId, id, fields)
    } else {
      await advertisersApi.contracts.create(advertiserId, fields)
    }
  }
}

export interface SaveAdvertiserInput {
  /** Пусто — создаём нового. */
  id?: number
  advertiser: AdvertiserInput
  contracts: EditableContract[]
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
      previousContracts,
    }: SaveAdvertiserInput) => {
      const saved = id
        ? await advertisersApi.update(id, advertiser)
        : await advertisersApi.create(advertiser)

      await syncContracts(saved.id, contracts, previousContracts)
      return saved
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
