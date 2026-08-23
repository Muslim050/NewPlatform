import { request } from '../client'
import { buildQuery } from '../query'
import type { Paginated } from '../types'

/** Кампания в том виде, в каком её отдаёт список. */
export interface Campaign {
  id: number
  advertiserId: number
  name: string
  status: string
  contractNumber: string
}

export type ListParams = {
  advertiserId?: number
  contractNumber?: string
  status?: string
  q?: string
  cursor?: string | null
  limit?: number
}

/** GET /campaigns — одна страница выборки. */
export function list(params: ListParams = {}): Promise<Paginated<Campaign>> {
  return request<Paginated<Campaign>>(`/campaigns${buildQuery(params)}`)
}
