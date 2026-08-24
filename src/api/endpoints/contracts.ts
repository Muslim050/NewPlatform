import { request } from '../client'
import type { Contract, ContractInput } from '../types'

/**
 * Договор — самостоятельный ресурс: у него свой адрес, не зависящий от
 * бренда. Заводятся и удаляются договоры внутри бренда
 * (`/advertisers/:id/contracts`, см. `endpoints/advertisers.ts`), а правятся
 * по своему адресу — им и пользуется раздел «Contract Overview».
 *
 * Список `GET /contracts` здесь не нужен: договор не знает своего бренда
 * (`advertiserId` в ответе нет), а на экране рядом с каждым договором стоит
 * карточка бренда. Поэтому договоры берутся из `GET /advertisers`, где они
 * приходят вложенными.
 */

/** PATCH /contracts/:id — условия договора: срок, пакет, лиги, статус. */
export function update(id: number, input: ContractInput): Promise<Contract> {
  return request<Contract>(`/contracts/${id}`, {
    method: 'PATCH',
    body: input,
  })
}
