import { useQuery } from '@tanstack/react-query'
import * as campaignsApi from '@/api/endpoints/campaigns'
import { PAGE_SIZE, fetchAllPages } from '@/lib/paginate'

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (params: campaignsApi.ListParams = {}) =>
    [...campaignKeys.all, 'list', params] as const,
  counts: () => [...campaignKeys.all, 'counts-by-advertiser'] as const,
}

/**
 * Сколько кампаний у каждого бренда — одной картой на весь экран брендов.
 *
 * Считаем на клиенте: счётчика в самом бренде нет, а спрашивать
 * `/campaigns?advertiserId=…&limit=1` на каждую карточку — это запрос
 * на бренд, то есть N запросов на страницу. Как только на бэкенде появится
 * счётчик в бренде или агрегат вроде `/campaigns/facets`, хук уходит.
 */
export function useCampaignCountsByAdvertiser() {
  return useQuery({
    queryKey: campaignKeys.counts(),
    queryFn: async () => {
      const campaigns = await fetchAllPages((cursor) =>
        campaignsApi.list({ cursor, limit: PAGE_SIZE }),
      )

      const counts = new Map<number, number>()
      for (const campaign of campaigns) {
        counts.set(
          campaign.advertiserId,
          (counts.get(campaign.advertiserId) ?? 0) + 1,
        )
      }
      return counts
    },
  })
}
