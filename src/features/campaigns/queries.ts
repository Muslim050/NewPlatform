import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as campaignsApi from '@/api/endpoints/campaigns'
import { PAGE_SIZE, fetchAllPages } from '@/lib/paginate'
import type { Campaign, CampaignInput } from '@/api/types'

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: () => [...campaignKeys.all, 'list'] as const,
}

/**
 * Все кампании, доступные пользователю. Рекламодателю сервер сам отдаёт
 * только его — фильтровать на клиенте нечего.
 *
 * Экран показывает список целиком: ищет, считает по месяцам и по договорам
 * локально, поэтому страницы дочитываются сразу. Когда кампаний станет
 * заметно больше сотни, это место превратится в useInfiniteQuery.
 */
export function useCampaigns() {
  return useQuery({
    queryKey: campaignKeys.list(),
    queryFn: (): Promise<Campaign[]> =>
      fetchAllPages((cursor) =>
        campaignsApi.list({ cursor, limit: PAGE_SIZE }),
      ),
  })
}

/**
 * Сколько кампаний у каждого бренда — одной картой на весь экран брендов.
 * Считаем из того же списка, что и на странице кампаний: счётчика в самом
 * бренде нет, а спрашивать `/campaigns?advertiserId=…` на карточку — это
 * запрос на бренд. Как только на бэкенде появится `campaignsCount`, хук уйдёт.
 */
export function useCampaignCountsByAdvertiser() {
  const query = useCampaigns()

  const counts = new Map<number, number>()
  for (const campaign of query.data ?? []) {
    if (campaign.advertiserId === null) continue
    counts.set(
      campaign.advertiserId,
      (counts.get(campaign.advertiserId) ?? 0) + 1,
    )
  }

  return { ...query, data: counts }
}

export interface SaveCampaignInput {
  /** Пусто — заводим заявку. */
  id?: number
  campaign: CampaignInput
}

/**
 * Сохранение кампании. Заявку заводит рекламодатель (бренд и статус сервер
 * ставит сам), правит её дальше площадка.
 */
export function useSaveCampaign() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, campaign }: SaveCampaignInput) =>
      id ? campaignsApi.update(id, campaign) : campaignsApi.create(campaign),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}
