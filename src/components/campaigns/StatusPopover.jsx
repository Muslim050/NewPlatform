import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button.jsx'
import { Field, Input } from '@/components/ui/Field.jsx'
import { formatDateTime } from '@/lib/format.js'
import { cn } from '@/lib/cn.js'

const WIDTH = 260

/** Дата со временем для input[type=datetime-local] — в местной зоне. */
const toDateTimeInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Смена статуса: выбираем вариант, ставим дату и время события и
 * подтверждаем «Сохранить», ниже — история прошлых смен. Рисуется порталом
 * с position: fixed — иначе карточка его обрежет.
 * options: [{ value, label, badge? }], history: [{ id, status, createdAt, by }]
 */
export function StatusPopover({
  anchorEl,
  title,
  value,
  options,
  history = [],
  onSave,
  onClose,
}) {
  const ref = useRef(null)
  const [anchor, setAnchor] = useState(() => anchorEl.getBoundingClientRect())
  const [draft, setDraft] = useState(value)
  // Смену можно оформить задним числом — дату и время выбирает пользователь.
  const [changedAt, setChangedAt] = useState(() => toDateTimeInput(new Date()))
  // Ищем подпись и цвет статуса из истории по его значению.
  const byValue = Object.fromEntries(options.map((o) => [o.value, o]))

  // Держимся за карточку: страница может проехать под поповером.
  useEffect(() => {
    const track = () => {
      if (!anchorEl.isConnected) return onClose()
      setAnchor(anchorEl.getBoundingClientRect())
    }
    window.addEventListener('scroll', track, true)
    window.addEventListener('resize', track)
    return () => {
      window.removeEventListener('scroll', track, true)
      window.removeEventListener('resize', track)
    }
  }, [anchorEl, onClose])

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

  const save = () => {
    if (draft === value || !changedAt) return
    onSave(draft, new Date(changedAt).toISOString())
  }

  // Прижимаем к левому краю карточки, но не даём уехать за экран.
  const left = Math.min(
    Math.max(12, anchor.left),
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
            Статус
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ink">
            {title}
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

      <div className="mt-3 space-y-1.5">
        {options.map((option) => {
          const active = option.value === draft
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setDraft(option.value)}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition-colors focus-ring',
                active
                  ? 'border-indigo-300 bg-indigo-50 text-ink'
                  : 'border-line bg-surface text-ink-soft hover:border-indigo-200 hover:bg-indigo-50/50',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {active && (
                <Check size={15} className="shrink-0 text-indigo-800" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3">
        <Field label="Дата изменения">
          <Input
            type="datetime-local"
            value={changedAt}
            onChange={(e) => setChangedAt(e.target.value)}
            className="h-9 text-[13px] tnum"
          />
        </Field>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={save}
          disabled={draft === value || !changedAt}
        >
          Сохранить
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </div>

      {/* История смен — видно, кто и когда переключил статус. */}
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          История статуса
          {history.length > 0 && (
            <span className="ml-1 tnum">{history.length}</span>
          )}
        </p>
        <div className="mt-2 max-h-[168px] space-y-1.5 overflow-y-auto">
          {history.length === 0 ? (
            <p className="rounded-xl bg-paper/70 px-3 py-3 text-center text-[12px] text-ink-muted">
              Статус ещё не меняли.
            </p>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl bg-paper/70 px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-ink-muted tnum">
                    {formatDateTime(entry.createdAt)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 text-[9px] font-medium',
                      byValue[entry.status]?.badge,
                    )}
                  >
                    {byValue[entry.status]?.label ?? entry.status}
                  </span>
                </div>
                {entry.by && (
                  <p className="mt-0.5 truncate text-[9px] text-ink-muted">
                    {entry.by}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
