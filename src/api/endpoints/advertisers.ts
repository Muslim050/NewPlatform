import { request } from '../client'
import type {
  Advertiser,
  AdvertiserInput,
  Contract,
  ContractInput,
  Paginated,
} from '../types'

export interface ListParams {
  cursor?: string | null
  limit?: number
}

function query({ cursor, limit }: ListParams): string {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

/** GET /advertisers — одна страница выборки. */
export function list(params: ListParams = {}): Promise<Paginated<Advertiser>> {
  return request<Paginated<Advertiser>>(`/advertisers${query(params)}`)
}

/** POST /advertisers */
export function create(input: AdvertiserInput): Promise<Advertiser> {
  return request<Advertiser>('/advertisers', { method: 'POST', body: input })
}

/** PATCH /advertisers/:id */
export function update(
  id: number,
  input: AdvertiserInput,
): Promise<Advertiser> {
  return request<Advertiser>(`/advertisers/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

/** DELETE /advertisers/:id */
export function remove(id: number): Promise<void> {
  return request<void>(`/advertisers/${id}`, { method: 'DELETE' })
}

/**
 * Договоры лежат внутри бренда только на чтение — меняются они этими
 * эндпоинтами, по одному.
 */
export const contracts = {
  create(advertiserId: number, input: ContractInput): Promise<Contract> {
    return request<Contract>(`/advertisers/${advertiserId}/contracts`, {
      method: 'POST',
      body: input,
    })
  },
  update(
    advertiserId: number,
    id: number,
    input: ContractInput,
  ): Promise<Contract> {
    return request<Contract>(`/advertisers/${advertiserId}/contracts/${id}`, {
      method: 'PATCH',
      body: input,
    })
  },
  remove(advertiserId: number, id: number): Promise<void> {
    return request<void>(`/advertisers/${advertiserId}/contracts/${id}`, {
      method: 'DELETE',
    })
  },
}
