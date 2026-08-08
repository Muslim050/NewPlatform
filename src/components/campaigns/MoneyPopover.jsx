import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'
import { formatMoney } from '@/lib/format.js'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input } from '@/components/ui/Field.jsx'

const WIDTH = 300

/**
 * Правка сумм кампании: к оплате, оплачено и разовое поступление,
 * которое прибавляется к оплаченному.
 * Рисуется порталом с position: fixed — иначе таблица его обрежет.
 */
export function MoneyPopover({ anchor, campaign, onSave, onClose }) {
  const ref = useRef(null)
  const [budget, setBudget] = useState(String(campaign.budget))
  const [paid, setPaid] = useState(String(campaign.spent))
  const [income, setIncome] = useState('')

  useEffect(() => {
    const onDown = (e) =>
      ref.current && !ref.current.contains(e.target) && onClose()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const numbers = {
    budget: Number(budget) || 0,
    paid: Number(paid) || 0,
    income: Number(income) || 0,
  }
  const total = numbers.paid + numbers.income
  const invalid =
    numbers.budget < 0 || numbers.paid < 0 || numbers.income < 0 || total < 0

  const save = () => {
    if (invalid) return
    onSave({ budget: numbers.budget, spent: total })
  }

  // Прижимаем к правому краю ячейки, но не даём уехать за экран.
  const left = Math.min(
    Math.max(12, anchor.right - WIDTH),
    window.innerWidth - WIDTH - 12,
  )

  return createPortal(
    <div
      ref={ref}
      style={{ left, top: anchor.bottom + 8, width: WIDTH }}
      className="fixed z-50 rounded-2xl border border-line bg-surface p-4 shadow-lift"
      onKeyDown={(e) => e.key === 'Enter' && save()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Оплата
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ink">
            {campaign.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink focus-ring"
        >
          <X size={15} />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <Field label="К оплате">
          <Input
            type="number"
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="h-9 text-[13px] tnum"
          />
        </Field>

        <Field label="Оплачено">
          <Input
            type="number"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            className="h-9 text-[13px] tnum"
          />
        </Field>

        <Field label="Поступление" hint="Прибавится к оплаченному.">
          <div className="relative">
            <Plus
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600"
            />
            <Input
              type="number"
              min="0"
              autoFocus
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="0"
              className="h-9 pl-8 text-[13px] tnum"
            />
          </div>
        </Field>
      </div>

      {numbers.income > 0 && (
        <p className="mt-3 flex items-center justify-between rounded-xl bg-paper/70 px-3 py-2 text-[12px]">
          <span className="text-ink-muted">Станет оплачено</span>
          <span className="font-semibold text-ink tnum">
            {formatMoney(total)}
          </span>
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button size="sm" className="flex-1" onClick={save} disabled={invalid}>
          Сохранить
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </div>,
    document.body,
  )
}
