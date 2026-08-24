import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as contractsApi from '@/api/endpoints/contracts'
import { advertiserKeys, useAdvertisers } from '@/features/advertisers/queries'
import type { Advertiser, Contract, ContractInput } from '@/api/types'

/** Договор вместе с брендом, которому он принадлежит. */
export interface ContractRow {
  contract: Contract
  advertiser: Advertiser
}

/**
 * Все договоры площадки — строками «договор + бренд».
 *
 * Отдельный `GET /contracts` для этого не годится: в договоре нет ссылки на
 * бренд, а экран показывает рядом с каждым его название, логотип и цвет.
 * Поэтому берём договоры оттуда, где связь есть, — из списка брендов, где
 * они приходят вложенными. Заодно это тот же запрос, что у «Рекламодателей»,
 * то есть данные разделяются между экранами через кэш react-query.
 */
export function useContracts() {
  const query = useAdvertisers()

  const rows: ContractRow[] = (query.data ?? []).flatMap((advertiser) =>
    (advertiser.contracts ?? []).map((contract) => ({ contract, advertiser })),
  )

  return { ...query, rows }
}

/**
 * Правка условий договора: срок, пакет, лиги, статус. Договоры лежат внутри
 * брендов, поэтому обновляем весь список брендов — иначе экран покажет
 * старое значение.
 */
export function useUpdateContract() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ContractInput }) =>
      contractsApi.update(id, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

/**
 * Суммы договора: сумма договора и оплаченное. Прирост «Оплачено» сервер сам
 * оформляет поступлением — отдельный запрос на это не нужен.
 */
export function useSaveContractAmounts() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: contractsApi.AmountsInput
    }) => contractsApi.updateAmounts(id, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

/** Статус оплаты за месяц договора: «ожидает оплату» / «оплачено». */
export function useSetPaymentStatus() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: contractsApi.PaymentStatusInput
    }) => contractsApi.setPaymentStatus(id, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

/** Правка поступления — в интерфейсе меняется только его дата. */
export function useUpdatePayment() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      contractId,
      paymentId,
      input,
    }: {
      contractId: number
      paymentId: number
      input: { amount?: string; paidAt?: string; comment?: string }
    }) => contractsApi.payments.update(contractId, paymentId, input),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}

/** Удаление поступления. Освоенное сервер пересчитывает сам. */
export function useDeletePayment() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({
      contractId,
      paymentId,
    }: {
      contractId: number
      paymentId: number
    }) => contractsApi.payments.remove(contractId, paymentId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: advertiserKeys.all })
    },
  })
}
